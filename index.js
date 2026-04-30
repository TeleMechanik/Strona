// server.js
import express from 'express';
import session from 'express-session';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, getDB } from './db.js';
import { initWebSocket } from './ws.js';
import fs from 'fs';
import archiver from 'archiver';

const fsPromises = fs.promises;
const configFilePath = path.join(process.cwd(), 'configpanel.json');
import multer from 'multer';

const ALLOWED_EXTENSIONS = new Set([
  'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg',
  'mp4', 'avi', 'mov', 'webm', 'mkv',
  'pdf', 'zip', 'js'
]);

const ALLOWED_MIMETYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
  'image/webp', 'image/svg+xml',
  'video/mp4', 'video/avi', 'video/quicktime', 'video/webm',
  'video/x-matroska',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed', 'application/x-zip',
  'text/javascript', 'application/javascript', 'application/x-javascript',
  'application/octet-stream', 'text/plain'
]);

const FORCE_DOWNLOAD_EXTS = new Set(['.js', '.zip', '.pdf']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const PORT = 10210;

const PAGES_DIR = path.join(__dirname, 'public');

app.use(express.static(PAGES_DIR));

// ============================= Login / Zabezpieczenia ===========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'superSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 }
}));

// ============================= FUNKCJE POMOCNICZE ===========================
function normalizeFilename(filename) {
  if (!filename) return Date.now().toString();
  
  const originalExt = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, originalExt);
  
  const normalized = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => {
      const map = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
        'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      };
      return map[char] || char;
    })
    .replace(/[^\w\s.-]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[_.-]{2,}/g, '_')
    .replace(/^[_.-]+/, '')
    .replace(/[_.-]+$/, '')
    .trim();
  
  let shortName = normalized;
  if (shortName.length > 30) {
    shortName = shortName.substring(0, 30);
    shortName = shortName.replace(/[_.-]+$/, '');
  }
    if (!shortName || shortName === '' || shortName === '_') {
    shortName = Date.now().toString();
  }
    const finalName = shortName + originalExt;
  return finalName;
}

function getUniqueFilename(uploadDir, filename) {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  let counter = 1;
  let uniqueName = filename;
  
  while (fs.existsSync(path.join(uploadDir, uniqueName))) {
    uniqueName = `${nameWithoutExt}_${counter}${ext}`;
    counter++;
  }
  
  return uniqueName;
}

// ============================= AUTH MIDDLEWARE ===========================
function authMiddleware(req, res, next) {
  if (req.session.loggedIn) {
    if (req.session.impersonating && req.session.originalUser) {
      req.originalUser = {
        id: req.session.originalUser.id,
        ranga: req.session.originalUser.ranga,
        group_id: req.session.originalUser.group_id,
        username: req.session.originalUser.username
      };
      
      req.user = {
        id: req.session.userId,
        ranga: req.session.userRanga,
        group_id: req.session.userGroupId,
        username: req.session.user
      };
      
      req.isImpersonating = true;
    } else {
      req.user = {
        id: req.session.userId,
        ranga: req.session.userRanga,
        group_id: req.session.userGroupId,
        username: req.session.user
      };
      
      req.originalUser = null;
      req.isImpersonating = false;
    }
    
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Nie zalogowany' });
  } else {
    return res.redirect('/');
  }
}

async function checkUserAccess(req, res, next) {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: "Nieprawidłowe ID" });

  try {
    const db = getDB();
    
    if (req.user.ranga === "root") {
      const [rows] = await db.query(
        "SELECT id, username, ranga, group_id FROM users WHERE id = ?",
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Nie znaleziono użytkownika" });
      }
      req.targetUser = rows[0];
      return next();
    }
    
    const [rows] = await db.query(
      "SELECT id, username, ranga, group_id FROM users WHERE id = ? AND group_id = ?",
      [userId, req.user.group_id]
    );
    
    if (rows.length === 0) {
      return res.status(403).json({ 
        error: "Brak dostępu do tego użytkownika" 
      });
    }
    
    req.targetUser = rows[0];
    next();
  } catch (err) {
    console.error("Błąd sprawdzania dostępu:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
}

function checkRolePermissions(req, res, next) {
  const hierarchy = ["user", "admin", "owner", "root"];
  const currentUser = req.user;
  const targetUser = req.targetUser || {};
  
  if (currentUser.ranga === "root") {
    return next();
  }
  
  const currentIndex = hierarchy.indexOf(currentUser.ranga);
  const targetIndex = hierarchy.indexOf(targetUser.ranga);
  
  if (currentIndex <= targetIndex) {
    return res.status(403).json({ 
      error: "Nie masz uprawnień do zarządzania tym użytkownikiem" 
    });
  }
  
  next();
}

// ============================= USER GROUPS MIDDLEWARE ===========================
async function buildUserGroups(req, res, next) {
  if (!req.user) return next();
  
  try {
    const db = getDB();
    
    const [userRows] = await db.query(
      'SELECT group_id, user_groups FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const user = userRows[0];
    
    let userGroups = [];
    
    if (user.group_id) {
      userGroups.push(user.group_id);
    }
    
    if (user.user_groups) {
      try {
        const additionalGroups = JSON.parse(user.user_groups);
        if (Array.isArray(additionalGroups)) {
          additionalGroups.forEach(groupId => {
            if (!userGroups.includes(groupId)) {
              userGroups.push(groupId);
            }
          });
        }
      } catch (e) {
        console.warn(`Błąd parsowania user_groups dla użytkownika ${req.user.id}:`, e);
      }
    }
    
    if (userGroups.length === 0) {
      console.error(`Użytkownik ${req.user.id} nie ma przypisanej żadnej grupy!`);
    }
    
    req.user.groups = userGroups;
    req.user.primary_group_id = user.group_id;
    
    next();
  } catch (err) {
    console.error("Błąd budowania grup użytkownika:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
}

async function validateUserAccess(req, targetUserId) {
  if (req.user.ranga === "root") {
    return true;
  }
  
  try {
    const db = getDB();
    const [targetUser] = await db.query(
      'SELECT id, group_id FROM users WHERE id = ?',
      [targetUserId]
    );
    
    if (targetUser.length === 0) {
      return false;
    }
    
    if (req.user.ranga === "owner") {
      return targetUser[0].group_id === req.user.primary_group_id;
    }
    
    return false;
  } catch (err) {
    console.error("Błąd walidacji dostępu do użytkownika:", err);
    return false;
  }
}

async function validateBillboardAccess(req, billboardUuid) {
  if (req.user.ranga === "root") {
    return true;
  }
  
  try {
    const db = getDB();
    const [billboard] = await db.query(
      'SELECT group_id FROM telebimy_machine WHERE uuid = ?',
      [billboardUuid]
    );
    
    if (billboard.length === 0) {
      return false;
    }
    
    const billboardGroupId = billboard[0].group_id;
    
    return req.user.groups.includes(billboardGroupId);
  } catch (err) {
    console.error("Błąd walidacji dostępu do telebimu:", err);
    return false;
  }
}

async function validateGroupAccess(req, groupId) {
  if (req.user.ranga === "root") {
    return true;
  }
  
  return req.user.groups.includes(parseInt(groupId));
}

async function validateUserHasMinOneGroup(userId, newPrimaryGroupId = null, groupsToRemove = []) {
  try {
    const db = getDB();
    const [user] = await db.query(
      'SELECT group_id, user_groups FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return false;
    }
    
    const currentPrimary = user[0].group_id;
    let currentAdditional = [];
    
    if (user[0].user_groups) {
      try {
        currentAdditional = JSON.parse(user[0].user_groups);
      } catch (e) {
        currentAdditional = [];
      }
    }
    
    let newGroups = [...currentAdditional];
    let newPrimary = newPrimaryGroupId !== null ? newPrimaryGroupId : currentPrimary;
    
    if (groupsToRemove.length > 0) {
      newGroups = newGroups.filter(g => !groupsToRemove.includes(g));
    }
    
    const allGroups = [newPrimary, ...newGroups];
    const uniqueGroups = [...new Set(allGroups.filter(g => g !== null))];
    
    return uniqueGroups.length > 0;
  } catch (err) {
    console.error("Błąd walidacji minimalnej liczby grup:", err);
    return false;
  }
}

function canEditUserGroups(requesterRole, targetUserPrimaryGroupId, requesterPrimaryGroupId) {
  if (requesterRole === "root") {
    return true;
  }
  
  if (requesterRole === "owner") {
    return targetUserPrimaryGroupId === requesterPrimaryGroupId;
  }
  
  return false;
}

async function checkScheduleCollisions(billboard_uuid, schedulesData, excludeId = null) {
  try {
    const db = getDB();
    
    let query = `
      SELECT * FROM harmonogramy 
      WHERE billboard_uuid = ? 
        AND status = 'active'
    `;
    let params = [billboard_uuid];
    
    if (excludeId) {
      if (Array.isArray(excludeId)) {
        if (excludeId.length > 0) {
          query += " AND id NOT IN (?)";
          params.push(excludeId);
        }
      } else {
        query += " AND id != ?";
        params.push(excludeId);
      }
    }
    
    const [existingSchedules] = await db.query(query, params);
    
    const allCollisions = [];
    
    function checkSingleCollision(schedule1, schedule2) {
      const start1 = new Date(schedule1.start_date);
      const end1 = new Date(schedule1.end_date);
      const start2 = new Date(schedule2.start_date);
      const end2 = new Date(schedule2.end_date);

      const dateOverlap = start1 < end2 && end1 > start2;
      if (!dateOverlap) return false;

      const commonDays = schedule1.repeat.filter(day => schedule2.repeat.includes(day));
      if (commonDays.length === 0) return false;

      const getTimeFromDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
      };

      const startTime1 = getTimeFromDateTime(schedule1.start_date);
      const endTime1 = getTimeFromDateTime(schedule1.end_date);
      const startTime2 = getTimeFromDateTime(schedule2.start_date);
      const endTime2 = getTimeFromDateTime(schedule2.end_date);

      const timeOverlap = startTime1 < endTime2 && endTime1 > startTime2;
      if (!timeOverlap) return false;

      return true;
    }

    function isBlockingCollision(priority1, priority2) {
      if (priority1 === 0 || priority2 === 0) {
        return false;
      }
      return (priority1 === 1 && priority2 === 1) || (priority1 === 2 && priority2 === 2);
    }

    for (let i = 0; i < schedulesData.length; i++) {
      const newSchedule = schedulesData[i];
      const { start_date, end_date, repeat, priority } = newSchedule;

      if (priority === 0) {
        continue;
      }

      const newStart = new Date(start_date);
      const newEnd = new Date(end_date);

      const collisionsForThisSchedule = [];

      for (let j = i + 1; j < schedulesData.length; j++) {
        const otherNewSchedule = schedulesData[j];
        const otherPriority = otherNewSchedule.priority || 0;

        if (!isBlockingCollision(priority, otherPriority)) {
          continue;
        }

        if (checkSingleCollision(newSchedule, otherNewSchedule)) {
          collisionsForThisSchedule.push({
            id: null,
            task_name: otherNewSchedule.task_name,
            start_date: otherNewSchedule.start_date,
            end_date: otherNewSchedule.end_date,
            priority: otherPriority,
            repeat: otherNewSchedule.repeat,
            commonDays: newSchedule.repeat.filter(day => otherNewSchedule.repeat.includes(day)),
            dateOverlap: true,
            timeOverlap: true
          });
        }
      }

      for (const existing of existingSchedules) {
        const existingPriority = existing.priority || 0;

        if (!isBlockingCollision(priority, existingPriority)) {
          continue;
        }

        const existingStart = new Date(existing.start_date);
        const existingEnd = new Date(existing.end_date);

        const dateOverlap = newStart < existingEnd && newEnd > existingStart;
        if (!dateOverlap) {
          continue;
        }

        let existingRepeat = [];
        try {
          if (typeof existing.repeat_type === 'string') {
            existingRepeat = JSON.parse(existing.repeat_type);
          } else if (Array.isArray(existing.repeat_type)) {
            existingRepeat = existing.repeat_type;
          }
        } catch (e) {
          existingRepeat = [1,2,3,4,5,6,7];
        }

        const commonDays = repeat.filter(day => existingRepeat.includes(day));
        if (commonDays.length === 0) {
          continue;
        }

        const getTimeFromDateTime = (dateTimeStr) => {
          const date = new Date(dateTimeStr);
          return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
        };

        const newStartTime = getTimeFromDateTime(start_date);
        const newEndTime = getTimeFromDateTime(end_date);
        const existingStartTime = getTimeFromDateTime(existing.start_date);
        const existingEndTime = getTimeFromDateTime(existing.end_date);

        const timeOverlap = newStartTime < existingEndTime && newEndTime > existingStartTime;
        if (!timeOverlap) {
          continue;
        }

        collisionsForThisSchedule.push({
          id: existing.id,
          task_name: existing.task_name,
          start_date: existing.start_date,
          end_date: existing.end_date,
          priority: existingPriority,
          repeat: existingRepeat,
          commonDays: commonDays,
          dateOverlap: dateOverlap,
          timeOverlap: timeOverlap
        });
      }

      if (collisionsForThisSchedule.length > 0) {
        allCollisions.push({
          schedule: newSchedule,
          collisions: collisionsForThisSchedule
        });
      }
    }

    return {
      hasCollision: allCollisions.length > 0,
      collisions: allCollisions
    };
    
  } catch (err) {
    console.error("Błąd sprawdzania kolizji harmonogramów:", err);
    throw err;
  }
}

// ============================= PODGLĄD KONT ===========================
app.post("/api/impersonate/exit", authMiddleware, (req, res) => {
  if (!req.session.impersonating || !req.session.originalUser) {
    return res.status(400).json({ error: 'Nie trwa podgląd konta' });
  }
  
  const originalUser = req.session.originalUser;
  
  req.session.userId = originalUser.id;
  req.session.userRanga = originalUser.ranga;
  req.session.userGroupId = originalUser.group_id;
  req.session.user = originalUser.username;
  req.session.impersonating = false;
  req.session.impersonation_type = null;
  delete req.session.company_name;
  req.session.originalUser = null;
  
  req.session.save((err) => {
    if (err) {
      console.error('Błąd zapisu sesji:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    
    res.json({ 
      success: true,
      message: 'Powrót do konta root',
      user: originalUser
    });
  });
});

app.post("/api/impersonate/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  
  const userToCheck = req.originalUser || req.user;
  
  if (userToCheck.ranga !== "root") {
    return res.status(403).json({ error: "Tylko root może korzystać z podglądu konta" });
  }
  
  try {
    const db = getDB();
    
    const [rows] = await db.query(
      "SELECT id, username, ranga, group_id FROM users WHERE id = ?",
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Użytkownik nie znaleziony" });
    }
    
    const targetUser = rows[0];
    
    if (targetUser.ranga === "root") {
      return res.status(403).json({ error: "Nie możesz podglądać konta innego roota" });
    }
    
    if (targetUser.id === userToCheck.id) {
      return res.status(400).json({ error: "Nie możesz podglądać samego siebie" });
    }
    
    delete req.session.company_name;
    req.session.impersonation_type = 'user';
    
    if (!req.session.originalUser) {
      const [originalUserData] = await db.query(
        "SELECT id, username, ranga, group_id FROM users WHERE id = ?",
        [userToCheck.id]
      );
      
      if (originalUserData.length === 0) {
        return res.status(404).json({ error: "Oryginalny użytkownik nie znaleziony" });
      }
      
      req.session.originalUser = {
        id: originalUserData[0].id,
        ranga: originalUserData[0].ranga,
        group_id: originalUserData[0].group_id,
        username: originalUserData[0].username
      };
    } else {
      delete req.session.originalUser.company_name;
      req.session.originalUser.impersonation_type = 'user';
    }
    
    req.session.impersonating = true;
    req.session.userId = targetUser.id;
    req.session.userRanga = targetUser.ranga;
    req.session.userGroupId = targetUser.group_id;
    req.session.user = targetUser.username;
    
    req.session.save((err) => {
      if (err) {
        console.error("Błąd zapisu sesji:", err);
        return res.status(500).json({ error: "Błąd serwera" });
      }
      
      res.json({
        success: true,
        message: `Podgląd konta użytkownika: ${targetUser.username}`,
        user: {
          id: targetUser.id,
          name: targetUser.username,
          ranga: targetUser.ranga,
          group_id: targetUser.group_id
        },
        originalUser: req.session.originalUser,
        impersonation_type: 'user'
      });
    });
  } catch (err) {
    console.error("Błąd API POST /api/impersonate/:userId:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/impersonate/check", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
        const userToCheck = req.originalUser || req.user;
    
    if (userToCheck.ranga !== 'root') {
      return res.json({ 
        canImpersonate: false,
        reason: 'Tylko root może korzystać z podglądu konta'
      });
    }
    
    const [rows] = await db.query(
      'SELECT id, username, ranga FROM users WHERE ranga != ? AND id != ? ORDER BY username ASC',
      ['root', userToCheck.id]
    );
    
    res.json({ 
      canImpersonate: true,
      availableUsers: rows.map(user => ({
        id: user.id,
        name: user.username,
        ranga: user.ranga
      }))
    });
    
  } catch (err) {
    console.error('Błąd API GET /api/impersonate/check:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= IMPERSONACJA FIRM ===========================
app.get("/api/impersonate/companies", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    
    if (req.user.ranga !== "root") {
      return res.status(403).json({ error: "Tylko root może korzystać z podglądu firm" });
    }
    
    const [rows] = await db.query(`
      SELECT 
        f.id,
        f.name as firma_nazwa,
        COUNT(u.id) as user_count,
        MIN(u.id) as first_user_id,
        MIN(u.username) as sample_user,
        GROUP_CONCAT(DISTINCT u.ranga) as available_roles,
        GROUP_CONCAT(DISTINCT 
          CASE 
            WHEN u.ranga = 'owner' THEN u.id
            ELSE NULL
          END
        ) as owner_ids
      FROM firmy f
      LEFT JOIN users u ON f.id = u.firma
      WHERE f.id IS NOT NULL
      GROUP BY f.id, f.name
      ORDER BY f.name ASC
    `);
    
    const companies = await Promise.all(rows.map(async (row) => {
      let ownerUserId = null;
      let availableOwner = false;
      
      try {
        const roles = row.available_roles ? row.available_roles.split(',') : [];
        availableOwner = roles.includes('owner');
        
        if (availableOwner && row.owner_ids) {
          const ownerIds = row.owner_ids.split(',').filter(id => id && id !== 'NULL' && id !== 'null');
          if (ownerIds.length > 0) {
            ownerUserId = parseInt(ownerIds[0]);
          } else {
            ownerUserId = row.first_user_id;
          }
        }
      } catch (e) {
        console.error("Błąd przetwarzania ról firmy:", e);
      }
      
      return {
        id: row.id,
        name: row.firma_nazwa,
        user_count: row.user_count || 0,
        sample_user: row.sample_user,
        available_owner: availableOwner,
        owner_user_id: ownerUserId
      };
    }));
    
    res.json({
      success: true,
      companies: companies
    });
    
  } catch (err) {
    console.error('Błąd API GET /api/impersonate/companies:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/impersonate/company/:companyName", authMiddleware, async (req, res) => {
  const { companyName } = req.params;
  
  const userToCheck = req.originalUser || req.user;
  
  if (userToCheck.ranga !== "root") {
    return res.status(403).json({ error: "Tylko root może korzystać z podglądu firm" });
  }
  
  try {
    const db = getDB();
    
    const [companyRows] = await db.query(`
      SELECT id, name FROM firmy WHERE name = ?
    `, [companyName]);
    
    if (companyRows.length === 0) {
      return res.status(404).json({ error: "Firma nie znaleziona" });
    }
    
    const company = companyRows[0];
    const companyId = company.id;
    
    const [ownerRows] = await db.query(`
      SELECT id, username, ranga, firma, group_id
      FROM users 
      WHERE firma = ? 
        AND ranga = 'owner'
      LIMIT 1
    `, [companyId]);
    
    let targetUser;
    
    if (ownerRows.length > 0) {
      targetUser = ownerRows[0];
    } else {
      const [anyUserRows] = await db.query(`
        SELECT id, username, ranga, firma, group_id
        FROM users 
        WHERE firma = ? 
        ORDER BY 
          CASE ranga 
            WHEN 'admin' THEN 1
            WHEN 'user' THEN 2
            WHEN 'root' THEN 3
            ELSE 4
          END,
          id ASC
        LIMIT 1
      `, [companyId]);
      
      if (anyUserRows.length === 0) {
        return res.status(404).json({ error: "Brak użytkowników w firmie" });
      }
      
      targetUser = anyUserRows[0];
    }
    
    if (!req.session.originalUser) {
      const [originalUserData] = await db.query(
        "SELECT id, username, ranga, group_id FROM users WHERE id = ?",
        [userToCheck.id]
      );
      
      if (originalUserData.length === 0) {
        return res.status(404).json({ error: "Oryginalny użytkownik nie znaleziony" });
      }
      
      req.session.originalUser = {
        id: originalUserData[0].id,
        ranga: originalUserData[0].ranga,
        group_id: originalUserData[0].group_id,
        username: originalUserData[0].username
      };
    }
    
    req.session.impersonating = true;
    req.session.impersonation_type = 'company'; 
    req.session.company_id = companyId; 
    req.session.company_name = company.name;
    
    req.session.userId = targetUser.id;
    req.session.userRanga = targetUser.ranga;
    req.session.userGroupId = targetUser.group_id;
    req.session.user = targetUser.username;
    
    req.session.save((err) => {
      if (err) {
        console.error("Błąd zapisu sesji:", err);
        return res.status(500).json({ error: "Błąd serwera" });
      }
      
      res.json({
        success: true,
        message: `Podgląd firmy: ${company.name} jako użytkownika ${targetUser.username}`,
        user: {
          id: targetUser.id,
          name: targetUser.username,
          ranga: targetUser.ranga,
          group_id: targetUser.group_id,
          firma: targetUser.firma
        },
        originalUser: {
          id: req.session.originalUser.id,
          name: req.session.originalUser.username,
          ranga: req.session.originalUser.ranga,
          impersonation_type: 'company',
          company_id: companyId,
          company_name: company.name
        }
      });
    });
  } catch (err) {
    console.error("Błąd API POST /api/impersonate/company/:companyName:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/impersonate/check-extended", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userToCheck = req.originalUser || req.user;
    
    if (userToCheck.ranga !== 'root') {
      return res.json({ 
        canImpersonate: false,
        reason: 'Tylko root może korzystać z podglądu kont'
      });
    }
    
    const [usersRows] = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.ranga, 
        u.firma,
        f.name as firma_nazwa
      FROM users u
      LEFT JOIN firmy f ON u.firma = f.id
      WHERE u.id != ? 
      ORDER BY u.username ASC
    `, [userToCheck.id]);
    
    const [companiesRows] = await db.query(`
      SELECT 
        f.id,
        f.name as firma_nazwa,
        COUNT(u.id) as user_count,
        MIN(u.id) as first_user_id,
        MIN(u.username) as sample_user,
        GROUP_CONCAT(DISTINCT u.ranga) as available_roles
      FROM firmy f
      LEFT JOIN users u ON f.id = u.firma
      WHERE f.id IS NOT NULL
      GROUP BY f.id, f.name
      ORDER BY f.name ASC
    `);
    
    const companies = companiesRows.map(row => {
      let ownerUserId = null;
      let availableOwner = false;
      
      try {
        const roles = row.available_roles ? row.available_roles.split(',') : [];
        availableOwner = roles.includes('owner');
        
        if (availableOwner) {
          ownerUserId = row.first_user_id;
        }
      } catch (e) {
        console.error("Błąd przetwarzania ról firmy:", e);
      }
      
      return {
        id: row.id,
        name: row.firma_nazwa,
        user_count: row.user_count || 0,
        sample_user: row.sample_user,
        available_owner: availableOwner,
        owner_user_id: ownerUserId
      };
    });
    
    res.json({ 
      canImpersonate: true,
      availableUsers: usersRows.map(user => ({
        id: user.id,
        name: user.username,
        ranga: user.ranga,
        firma: user.firma,
        firma_nazwa: user.firma_nazwa
      })),
      availableCompanies: companies
    });
    
  } catch (err) {
    console.error('Błąd API GET /api/impersonate/check-extended:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= Login ===========================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await getDB().query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length > 0) {
      req.session.loggedIn = true;
      req.session.user = username;
      req.session.userId = rows[0].id;
      req.session.userRanga = rows[0].ranga;
      req.session.userGroupId = rows[0].group_id;
      console.log(`✅ Użytkownik ${username} zalogowany`);
      return res.redirect('/dashboard');
    } else {
      return res.send('<h3>❌ Błędny login lub hasło! <a href="/">Spróbuj ponownie</a></h3>');
    }

  } catch (err) {
    console.error('❌ Błąd podczas logowania:', err);
    res.status(500).send('Błąd serwera');
  }
});

// ============================= Panel ===========================
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/', (req, res) => {
  if (req.session.loggedIn) res.redirect('/dashboard');
  else res.sendFile(path.join(PAGES_DIR, 'login.html'));
});

app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile(path.join(PAGES_DIR, 'dashboard.html'));
});

// ============================= Setup ===========================
app.get('/setup-status', async (req, res) => {
try {
let config = { is_completed: false };
try {
const data = await fsPromises.readFile(configFilePath, 'utf-8');
config = JSON.parse(data);
} catch {}

if (config.is_completed) {
  return res.json({ is_completed: true });
}

const db = getDB();
  await db.query(`
  CREATE TABLE IF NOT EXISTS firmy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

  await db.query(`
  CREATE TABLE IF NOT EXISTS grupy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

  await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    ranga VARCHAR(255) NOT NULL,
    group_id INT,
    user_groups JSON,
    firma INT,
    CONSTRAINT fk_user_company FOREIGN KEY (firma) REFERENCES firmy(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

  await db.query(`
  CREATE TABLE IF NOT EXISTS telebimy_machine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    group_id INT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

  await db.query(`
  CREATE TABLE IF NOT EXISTS harmonogramy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    billboard_uuid VARCHAR(255) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    content TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    repeat_type JSON NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
    status ENUM('active', 'paused') DEFAULT 'active',
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (billboard_uuid) REFERENCES telebimy_machine(uuid) ON DELETE CASCADE,
    INDEX idx_billboard_uuid (billboard_uuid),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

  await db.query(`
  CREATE TABLE IF NOT EXISTS tokeny (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    id_owner INT NOT NULL,
    FOREIGN KEY (id_owner) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_id_owner (id_owner)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

res.json({ is_completed: false });

} catch (err) {
console.error('❌ Błąd podczas sprawdzania setupu:', err);
res.status(500).json({ is_completed: false, error: 'Błąd serwera' });
}
});

app.post('/create-first-admin', async (req, res) => {
  const { username, password } = req.body;

  try {
    let config = { is_completed: false };
    try {
      const data = await fsPromises.readFile(configFilePath, 'utf-8');
      config = JSON.parse(data);
    } catch {}

    if (config.is_completed) {
      return res.status(400).send('Setup został już wykonany!');
    }

await getDB().query(
  'INSERT INTO users (username, password, ranga, group_id) VALUES (?, ?, ?, ?)',
  [username, password, 'root', 1]
);

 await getDB().query(
  'INSERT INTO grupy (nazwa) VALUES (?)',
  ['root']
);
    config.is_completed = true;
    await fsPromises.writeFile(configFilePath, JSON.stringify(config, null, 2));

    res.status(200).send('Admin utworzony pomyślnie!');
  } catch (err) {
    console.error('❌ Błąd podczas tworzenia admina:', err.sqlMessage || err);
    res.status(500).send('Błąd serwera');
  }
});

// ============================= Telebimy ===========================
app.get('/billboards/count', authMiddleware, async (req, res) => {
  try {
    let config = { connectedBillboards: 0 };
    try {
      const data = await fs.promises.readFile(configFilePath, 'utf-8');
      config = JSON.parse(data);
    } catch (err) {
      console.warn('Nie udało się odczytać configpanel.json, używam domyślnej wartości.');
    }
    
    const totalCount = config.connectedBillboards || 0;
    
    const db = getDB();
    let query = '';
    let params = [];
    
    if (req.user.ranga === "root") {
      query = 'SELECT COUNT(*) as online_count FROM telebimy_machine WHERE is_connected = 1';
    } else {
      query = 'SELECT COUNT(*) as online_count FROM telebimy_machine WHERE is_connected = 1 AND group_id = ?';
      params = [req.user.group_id];
    }
    
    const [rows] = await db.query(query, params);
    const onlineCount = rows[0].online_count || 0;
    
    res.json({ 
      count: totalCount, //Zostawiłem to by jakoś panelu nie rozwaliło tak btw (Nie wnikać pls :<)
      online: onlineCount, 
      total: totalCount
    });
    
  } catch (err) {
    console.error('Błąd API /billboards/count:', err);
    res.status(500).json({ count: 0, online: 0, total: 0, error: 'Błąd serwera' });
  }
});

async function updateConnectedBillboards(count) {
  try {
    const data = await fs.promises.readFile(configFilePath, 'utf-8');
    const config = JSON.parse(data);
    config.connectedBillboards = count;
    await fs.promises.writeFile(configFilePath, JSON.stringify(config, null, 2));
    return config.connectedBillboards;
  } catch (err) {
    console.error("Błąd przy aktualizacji connectedBillboards:", err);
    return null;
  }
}

// ============================= ENDPOINT LISTY TELEBIMÓW ===========================
app.get('/api/telebimlist', authMiddleware, buildUserGroups, async (req, res) => {
  try {
    const db = getDB();
    let query = '';
    let params = [];
    
    if (req.user.ranga === "root") {
      query = 'SELECT id, uuid, name, is_connected, group_id FROM telebimy_machine ORDER BY name ASC';
    } else {
      query = `
        SELECT tm.id, tm.uuid, tm.name, tm.is_connected, tm.group_id 
        FROM telebimy_machine tm
        WHERE tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
        ORDER BY tm.name ASC
      `;
      params = [...req.user.groups];
    }
    
    const [rows] = await db.query(query, params);
    
    const telebimy = rows.map(r => ({ 
      id: r.id, 
      uuid: r.uuid, 
      name: r.name,
      is_connected: r.is_connected,
      group_id: r.group_id,
      status: r.is_connected === 1 ? 'podłączony' : 'rozłączony',
      status_bool: r.is_connected === 1
    }));
    
    await updateConnectedBillboards(rows.length);
    res.json(telebimy);
    
  } catch (err) {
    console.error('Błąd API /api/telebimlist:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/api/telebim/:uuid/rename', authMiddleware, async (req, res) => {
  const { uuid } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nieprawidłowa nazwa" });
  }

  try {
    const db = getDB();
    
    const [telebimRows] = await db.query(
      'SELECT id, uuid, name, group_id FROM telebimy_machine WHERE uuid = ?',
      [uuid]
    );

    if (telebimRows.length === 0) {
      return res.status(404).json({ error: "Urządzenie nie znalezione" });
    }

    const telebim = telebimRows[0];
    
    const [userRows] = await db.query(
      'SELECT id, ranga, group_id, user_groups FROM users WHERE id = ?',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: "Użytkownik nie istnieje" });
    }

    const currentUser = userRows[0];
    
    let hasAccess = false;
    
    if (currentUser.ranga === "root") {
      hasAccess = true;
    } else if (currentUser.ranga === "owner") {
      let userGroups = [currentUser.group_id];
      if (currentUser.user_groups) {
        try {
          const additionalGroups = JSON.parse(currentUser.user_groups);
          if (Array.isArray(additionalGroups)) {
            userGroups = [...userGroups, ...additionalGroups];
          }
        } catch (e) {}
      }
      
      hasAccess = userGroups.includes(telebim.group_id);
    } else if (currentUser.ranga === "admin" || currentUser.ranga === "user") {
      hasAccess = currentUser.group_id === telebim.group_id;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }

    await db.query(
      'UPDATE telebimy_machine SET name = ? WHERE uuid = ?',
      [name.trim(), uuid]
    );
    
    res.json({ 
      success: true, 
      uuid, 
      name: name.trim(),
      updated_by: currentUser.id
    });

  } catch (err) {
    console.error('Błąd API /api/telebim/:uuid/rename:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/telebim/:uuid", authMiddleware, async (req, res) => {
  const { uuid } = req.params;
  
  try {
    const db = getDB();
    
    const [telebimRows] = await db.query(
      'SELECT id, uuid, name, group_id FROM telebimy_machine WHERE uuid = ?',
      [uuid]
    );
    
    if (telebimRows.length === 0) {
      return res.status(404).json({ error: "Urządzenie nie znalezione" });
    }
    
    const telebim = telebimRows[0];
    
    const [userRows] = await db.query(
      'SELECT id, ranga, group_id, user_groups FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      return res.status(401).json({ error: "Użytkownik nie istnieje" });
    }
    
    const currentUser = userRows[0];
    
    let hasAccess = false;
    let canDelete = false;
    
    if (currentUser.ranga === "root") {
      hasAccess = true;
      canDelete = true;
    } else if (currentUser.ranga === "owner") {
      let userGroups = [currentUser.group_id];
      if (currentUser.user_groups) {
        try {
          const additionalGroups = JSON.parse(currentUser.user_groups);
          if (Array.isArray(additionalGroups)) {
            userGroups = [...userGroups, ...additionalGroups];
          }
        } catch (e) {}
      }
      
      hasAccess = userGroups.includes(telebim.group_id);
      canDelete = hasAccess;
    } else if (currentUser.ranga === "admin") {
      hasAccess = currentUser.group_id === telebim.group_id;
      canDelete = hasAccess;
    } else if (currentUser.ranga === "user") {
      hasAccess = currentUser.group_id === telebim.group_id;
      canDelete = false;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }
    
    if (!canDelete) {
      return res.status(403).json({ error: "Nie masz uprawnień do usuwania urządzeń" });
    }
    
    await db.query('DELETE FROM telebimy_machine WHERE uuid = ?', [uuid]);
    
    const telebimDir = path.join(process.cwd(), 'obrazki', uuid);
    if (fs.existsSync(telebimDir)) {
      try {
        fs.rmSync(telebimDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Nie udało się usunąć folderu telebimu: ${telebimDir}`, err);
      }
    }
    
    await db.query('DELETE FROM harmonogramy WHERE billboard_uuid = ?', [uuid]);
    
    const [allBillboards] = await db.query('SELECT COUNT(*) as count FROM telebimy_machine');
    await updateConnectedBillboards(allBillboards[0].count);
    
    res.json({ 
      success: true,
      message: "Urządzenie i powiązane dane zostały usunięte",
      deleted_uuid: uuid
    });
    
  } catch (err) {
    console.error('Błąd API DELETE /api/telebim/:uuid:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= Użytkownicy ===========================
async function updateConnectedUsers(count) {
  try {
    let config = {};
    try {
      const data = await fs.promises.readFile(configFilePath, "utf-8");
      config = JSON.parse(data);
    } catch {
      console.warn("Nie udało się odczytać configpanel.json, używam domyślnej wartości.");
    }
    config.connectedUsers = count;
    await fs.promises.writeFile(configFilePath, JSON.stringify(config, null, 2));
    return config.connectedUsers;
  } catch (err) {
    console.error("Błąd przy aktualizacji connectedUsers:", err);
    return null;
  }
}

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = req.user;
    
    const [rows] = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.ranga, 
        u.group_id, 
        u.firma,
        f.name as firma_nazwa
      FROM users u
      LEFT JOIN firmy f ON u.firma = f.id
      WHERE u.id = ?
    `, [user.id]);
    
    if (!rows.length) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    const userData = rows[0];
    
    let groupName = null;
    if (userData.group_id) {
      const [groupRows] = await db.query('SELECT nazwa FROM grupy WHERE id = ?', [userData.group_id]);
      if (groupRows.length > 0) {
        groupName = groupRows[0].nazwa;
      }
    }
    
    const response = { 
      id: userData.id, 
      name: userData.username, 
      ranga: userData.ranga, 
      group_id: userData.group_id,
      firma: userData.firma,
      firma_nazwa: userData.firma_nazwa,
      group_name: groupName,
      isImpersonating: req.isImpersonating || false
    };
    
    if (req.isImpersonating && req.originalUser) {
      const [originalRows] = await db.query(
        'SELECT username, ranga FROM users WHERE id = ?',
        [req.originalUser.id]
      );
      
      if (originalRows.length > 0) {
        response.originalUser = {
          id: req.originalUser.id,
          name: originalRows[0].username,
          ranga: originalRows[0].ranga
        };
        
        if (req.session.impersonation_type === 'company' && req.session.company_id) {
          response.originalUser.impersonation_type = 'company';
          response.originalUser.company_id = req.session.company_id;
          response.originalUser.company_name = req.session.company_name;
        } else {
          response.originalUser.impersonation_type = 'user';
          
          const [originalUserFirmaRows] = await db.query(`
            SELECT u.firma, f.name as firma_nazwa
            FROM users u
            LEFT JOIN firmy f ON u.firma = f.id
            WHERE u.id = ?
          `, [req.originalUser.id]);
          
          if (originalUserFirmaRows.length > 0) {
            response.originalUser.firma = originalUserFirmaRows[0].firma;
            response.originalUser.firma_nazwa = originalUserFirmaRows[0].firma_nazwa;
          }
        }
      }
    }
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.get("/api/userslist", authMiddleware, buildUserGroups, async (req, res) => {
  try {
    const db = getDB();
    
    let query = `
      SELECT u.id, u.username, u.ranga, u.group_id, u.user_groups, u.firma,
             g.nazwa as group_name,
             f.name as firma_nazwa
      FROM users u 
      LEFT JOIN grupy g ON u.group_id = g.id
      LEFT JOIN firmy f ON u.firma = f.id
      WHERE 1=1
    `;
    let params = [];
    
    if (req.user.ranga === "root") {
      const [rows] = await db.query(`
        SELECT u.id, u.username, u.ranga, u.group_id, u.user_groups, u.firma,
               g.nazwa as group_name,
               f.name as firma_nazwa
        FROM users u 
        LEFT JOIN grupy g ON u.group_id = g.id
        LEFT JOIN firmy f ON u.firma = f.id
        ORDER BY u.ranga DESC, u.username ASC
      `);
      
      const [allGroups] = await db.query("SELECT id, nazwa FROM grupy");
      const allGroupsMap = {};
      allGroups.forEach(g => {
        allGroupsMap[g.id] = g.nazwa;
      });
      
      const users = rows.map(u => {
        let additionalGroups = [];
        if (u.user_groups) {
          try {
            additionalGroups = JSON.parse(u.user_groups);
            if (!Array.isArray(additionalGroups)) {
              additionalGroups = [];
            }
          } catch (e) {
            additionalGroups = [];
          }
        }
        
        return { 
          id: u.id, 
          name: u.username, 
          ranga: u.ranga, 
          group_id: u.group_id,
          group_name: u.group_name,
          additional_groups: additionalGroups,
          all_groups_names: allGroupsMap,
          firma: u.firma,
          firma_nazwa: u.firma_nazwa
        };
      });
      
      await updateConnectedUsers(rows.length);
      return res.json(users);
    } else if (req.user.ranga === "owner") {
      if (req.user.groups.length > 0) {
        query += ` AND u.group_id IN (${req.user.groups.map(() => '?').join(',')})`;
        params = [...req.user.groups];
      } else {
        query += " AND 1=0";
      }
      
      const [availableGroups] = await db.query(
        `SELECT id, nazwa FROM grupy WHERE id IN (${req.user.groups.map(() => '?').join(',')})`,
        [...req.user.groups]
      );
      
      const availableGroupsMap = {};
      availableGroups.forEach(g => {
        availableGroupsMap[g.id] = g.nazwa;
      });
      
      query += " ORDER BY u.ranga DESC, u.username ASC";
      const [rows] = await db.query(query, params);
      
      const users = rows.map(u => {
        let additionalGroups = [];
        if (u.user_groups) {
          try {
            additionalGroups = JSON.parse(u.user_groups);
            if (!Array.isArray(additionalGroups)) {
              additionalGroups = [];
            }
          } catch (e) {
            additionalGroups = [];
          }
        }
        
        return { 
          id: u.id, 
          name: u.username, 
          ranga: u.ranga, 
          group_id: u.group_id,
          group_name: u.group_name,
          additional_groups: additionalGroups,
          all_groups_names: availableGroupsMap,
          firma: u.firma,
          firma_nazwa: u.firma_nazwa
        };
      });
      
      await updateConnectedUsers(rows.length);
      return res.json(users);
    } else {
      if (req.user.group_id) {
        query += " AND u.group_id = ?";
        params = [req.user.group_id];
      } else {
        query += " AND 1=0";
      }
      
      query += " ORDER BY u.ranga DESC, u.username ASC";
      const [rows] = await db.query(query, params);
      
      const users = rows.map(u => {
        return { 
          id: u.id, 
          name: u.username, 
          ranga: u.ranga, 
          group_id: u.group_id,
          group_name: u.group_name,
          firma: u.firma,
          firma_nazwa: u.firma_nazwa
        };
      });
      
      await updateConnectedUsers(rows.length);
      return res.json(users);
    }
  } catch (err) {
    console.error("Błąd API /api/userslist:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/users/count", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    let query = "SELECT COUNT(*) AS count FROM users WHERE 1=1";
    let params = [];
    
    if (req.user.ranga !== "root") {
      query += " AND group_id = ?";
      params.push(req.user.group_id);
    }
    
    const [rows] = await db.query(query, params);
    const count = rows[0]?.count || 0;
    await updateConnectedUsers(count);
    res.json({ count });
  } catch (err) {
    console.error("Błąd API /users/count:", err);
    res.status(500).json({ count: 0, error: "Błąd serwera" });
  }
});

app.post("/api/user/:id/changerole", authMiddleware, checkUserAccess, checkRolePermissions, async (req, res) => {
  const { id } = req.params;
  const { ranga } = req.body;
  const currentUser = req.user;
  const targetUser = req.targetUser;

  if (!ranga) return res.status(400).json({ error: "Nieprawidłowa ranga" });

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(currentUser.ranga);
  const targetIndex = hierarchy.indexOf(targetUser.ranga);
  const newIndex = hierarchy.indexOf(ranga);

  if (newIndex === -1) return res.status(400).json({ error: "Nieprawidłowa ranga" });
  if (newIndex >= currentIndex) return res.status(403).json({ error: "Nie możesz ustawić rangi wyższej lub równej swojej" });
  if (newIndex === targetIndex) return res.status(400).json({ error: "Użytkownik już ma tę rangę" });
  if (currentUser.ranga === "user") return res.status(403).json({ error: "Nie masz uprawnień do zmiany rang" });

  try {
    const db = getDB();
    
    await db.query("START TRANSACTION");
    
    const oldRanga = targetUser.ranga;
    await db.query("UPDATE users SET ranga = ? WHERE id = ?", [ranga, id]);
    
    const lostOwnerRootPrivileges = 
      (oldRanga === "owner" || oldRanga === "root") && 
      (ranga !== "owner" && ranga !== "root");
    
    if (lostOwnerRootPrivileges) {
      await db.query("DELETE FROM tokeny WHERE id_owner = ?", [id]);
    }
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true, 
      message: lostOwnerRootPrivileges 
        ? "Ranga zmieniona. Tokeny użytkownika zostały usunięte (stracił uprawnienia owner/root)." 
        : "Ranga zmieniona pomyślnie.",
      tokensRemoved: lostOwnerRootPrivileges,
      oldRanga,
      newRanga: ranga
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Błąd API POST /api/user/:id/changerole:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/user/:id/groups", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const { group_ids } = req.body;
  
  if (!group_ids || !Array.isArray(group_ids)) {
    return res.status(400).json({ error: "Nieprawidłowe dane grup" });
  }
  
  try {
    const hasAccess = await validateUserAccess(req, id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
    }
    
    const db = getDB();
    
    const [user] = await db.query(
      'SELECT id, group_id, user_groups FROM users WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const userData = user[0];
    
    if (!canEditUserGroups(req.user.ranga, userData.group_id, req.user.primary_group_id)) {
      return res.status(403).json({ error: "Brak uprawnień do edycji grup tego użytkownika" });
    }
    
    const newGroups = [...new Set(group_ids)];
    
    const canAddAllGroups = newGroups.every(groupId => 
      req.user.ranga === "root" || req.user.groups.includes(groupId)
    );
    
    if (!canAddAllGroups) {
      return res.status(403).json({ error: "Nie masz dostępu do wszystkich wybranych grup" });
    }
    
    const willHaveMinOneGroup = await validateUserHasMinOneGroup(id, userData.group_id, []);
    if (!willHaveMinOneGroup && newGroups.length === 0) {
      return res.status(400).json({ error: "Użytkownik musi mieć przynajmniej 1 grupę" });
    }
    
    await db.query(
      'UPDATE users SET user_groups = ? WHERE id = ?',
      [JSON.stringify(newGroups), id]
    );
    
    res.json({
      success: true,
      message: "Grupy zaktualizowane pomyślnie",
      user_id: parseInt(id),
      additional_groups: newGroups
    });
    
  } catch (err) {
    console.error("Błąd API POST /api/user/:id/groups:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/user/:id", authMiddleware, checkUserAccess, checkRolePermissions, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const currentUser = req.user;
  const targetUser = req.targetUser;

  if (targetUser.id === currentUser.id) return res.status(403).json({ error: "Nie możesz usunąć siebie" });
  if (targetUser.ranga === "root") return res.status(403).json({ error: "Nie można usunąć konta root" });
  if (currentUser.ranga === "user") return res.status(403).json({ error: "Nie masz uprawnień do usuwania użytkowników" });

  try {
    const db = getDB();
    
    await db.query("START TRANSACTION");
    
    await db.query("DELETE FROM tokeny WHERE id_owner = ?", [id]);
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    
    await db.query("COMMIT");

    const [allUsers] = await db.query("SELECT COUNT(*) AS count FROM users");
    await updateConnectedUsers(allUsers[0].count);

    res.json({ 
      success: true,
      message: "Użytkownik i jego tokeny zostały usunięte" 
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Błąd API DELETE /api/user/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/user/:id/changepassword", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const currentUser = req.user;

  if (!password || password.length < 3) 
    return res.status(400).json({ error: "Nieprawidłowe hasło (minimum 3 znaki)" });

  try {
    const db = getDB();
    
    const [rows] = await db.query("SELECT id, ranga, group_id FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const targetUser = rows[0];
    const hierarchy = ["user", "admin", "owner", "root"];

    if (currentUser.ranga === "user") {
      return res.status(403).json({ error: "Nie masz uprawnień do zmiany hasła" });
    }
    
    if (currentUser.id === targetUser.id) {
      await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id]);
      return res.json({ success: true });
    }
    
    const currentIndex = hierarchy.indexOf(currentUser.ranga);
    const targetIndex = hierarchy.indexOf(targetUser.ranga);
    
    if (currentIndex <= targetIndex) {
      return res.status(403).json({ error: "Nie masz uprawnień do zmiany hasła tego użytkownika" });
    }
    
    if (currentUser.ranga !== "root") {
      if (currentUser.group_id !== targetUser.group_id) {
        return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
      }
    }

    await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Błąd API POST /api/user/:id/changepassword:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= ZMIANA NAZWY UŻYTKOWNIKA ===========================
app.post("/api/user/:id/changename", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  const currentUser = req.user;

  if (!username || username.trim().length < 2) 
    return res.status(400).json({ error: "Nieprawidłowa nazwa użytkownika (minimum 2 znaki)" });

  const newUsername = username.trim();

  try {
    const db = getDB();
    
    const [rows] = await db.query("SELECT id, username, ranga, group_id FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const targetUser = rows[0];
    
    const hierarchy = ["user", "admin", "owner", "root"];

    if (currentUser.ranga === "user") {
      return res.status(403).json({ error: "Nie masz uprawnień do zmiany nazw użytkowników" });
    }
    
    const currentIndex = hierarchy.indexOf(currentUser.ranga);
    const targetIndex = hierarchy.indexOf(targetUser.ranga);
    
    if (currentIndex <= targetIndex && currentUser.id !== targetUser.id) {
      return res.status(403).json({ error: "Nie masz uprawnień do zmiany nazwy tego użytkownika" });
    }
    
    if (currentUser.ranga !== "root") {
      if (currentUser.group_id !== targetUser.group_id) {
        return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
      }
    }

    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [newUsername]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Nazwa użytkownika jest już zajęta" });
    }

    await db.query("UPDATE users SET username = ? WHERE id = ?", [newUsername, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Błąd API POST /api/user/:id/changename:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/user/:id/company", authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    if (req.user.ranga !== "root") {
      return res.status(403).json({ error: "Tylko root może zmieniać firmę użytkownika" });
    }
    
    const db = getDB();
    
    const [userRows] = await db.query(
      "SELECT u.id, u.username, u.firma, f.name as firma_nazwa FROM users u LEFT JOIN firmy f ON u.firma = f.id WHERE u.id = ?",
      [id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const [companies] = await db.query("SELECT id, name FROM firmy ORDER BY name ASC");
    
    res.json({
      success: true,
      user: {
        id: userRows[0].id,
        username: userRows[0].username,
        firma_id: userRows[0].firma,
        firma_nazwa: userRows[0].firma_nazwa
      },
      companies: companies
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/user/:id/company:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/user/:id/company", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { firma_id } = req.body;
  
  try {
    if (req.user.ranga !== "root") {
      return res.status(403).json({ error: "Tylko root może zmieniać firmę użytkownika" });
    }
    
    if (firma_id === undefined || firma_id === null) {
      return res.status(400).json({ error: "Nieprawidłowe ID firmy" });
    }
    
    const db = getDB();
    
    const [userRows] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    if (firma_id !== "") {
      const [companyRows] = await db.query(
        "SELECT id FROM firmy WHERE id = ?",
        [firma_id]
      );
      
      if (companyRows.length === 0) {
        return res.status(404).json({ error: "Nie znaleziono firmy" });
      }
    }
    
    await db.query(
      "UPDATE users SET firma = ? WHERE id = ?",
      [firma_id || null, id]
    );
    
    const [updatedUser] = await db.query(
      "SELECT u.id, u.username, u.firma, f.name as firma_nazwa FROM users u LEFT JOIN firmy f ON u.firma = f.id WHERE u.id = ?",
      [id]
    );
    
    res.json({
      success: true,
      message: "Firma użytkownika zaktualizowana",
      user: {
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        firma_id: updatedUser[0].firma,
        firma_nazwa: updatedUser[0].firma_nazwa
      }
    });
    
  } catch (err) {
    console.error("Błąd API POST /api/user/:id/company:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post('/api/useradd', authMiddleware, buildUserGroups, async (req, res) => {
  const { username, password, ranga, group_id, additional_groups, firma_id } = req.body;
  const currentUser = req.user;

  if (!username || !password || !ranga) {
    return res.status(400).json({ error: "Uzupełnij wszystkie pola!" });
  }

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(currentUser.ranga);
  const newUserIndex = hierarchy.indexOf(ranga);

  if (currentUser.ranga === "user") {
    return res.status(403).json({ error: "Nie masz uprawnień do dodawania użytkowników" });
  }

  if (newUserIndex >= currentIndex) {
    return res.status(403).json({ error: "Nie możesz dodać użytkownika o równej lub wyższej randze" });
  }

  try {
    const db = getDB();
    
    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Użytkownik o takiej nazwie już istnieje" });
    }
    
    let finalGroupId = group_id;
    let finalAdditionalGroups = [];
    let finalFirmaId = firma_id;
    
    if (currentUser.ranga === "root") {
      if (!group_id) {
        return res.status(400).json({ error: "Wybierz grupę" });
      }
      
      const [groupExists] = await db.query("SELECT id, nazwa FROM grupy WHERE id = ? AND nazwa != 'root'", [group_id]);
      if (groupExists.length === 0) {
        return res.status(400).json({ error: "Wybrana grupa nie istnieje lub jest grupą root" });
      }
      
      if (additional_groups && Array.isArray(additional_groups)) {
        for (const addGroupId of additional_groups) {
          const [addGroupExists] = await db.query("SELECT id FROM grupy WHERE id = ?", [addGroupId]);
          if (addGroupExists.length === 0) {
            return res.status(400).json({ error: `Grupa ${addGroupId} nie istnieje` });
          }
        }
        finalAdditionalGroups = additional_groups;
      }
      
      if (finalFirmaId) {
        const [firmaExists] = await db.query("SELECT id FROM firmy WHERE id = ?", [finalFirmaId]);
        if (firmaExists.length === 0) {
          return res.status(400).json({ error: "Wybrana firma nie istnieje" });
        }
      }
    } else {
      finalGroupId = currentUser.primary_group_id;
      
      if (additional_groups && Array.isArray(additional_groups)) {
        for (const addGroupId of additional_groups) {
          if (!req.user.groups.includes(parseInt(addGroupId))) {
            return res.status(403).json({ error: "Nie masz dostępu do wszystkich wybranych dodatkowych grup" });
          }
        }
        finalAdditionalGroups = additional_groups;
      }
      
      if (currentUser.firma) {
        finalFirmaId = currentUser.firma;
      }
    }

    await db.query(
      "INSERT INTO users (username, password, ranga, group_id, user_groups, firma) VALUES (?, ?, ?, ?, ?, ?)", 
      [username, password, ranga, finalGroupId, JSON.stringify(finalAdditionalGroups), finalFirmaId || null]
    );

    const [rows] = await db.query("SELECT COUNT(*) AS count FROM users");
    await updateConnectedUsers(rows[0].count);

    res.json({ 
      success: true, 
      user: { 
        username, 
        ranga, 
        group_id: finalGroupId,
        additional_groups: finalAdditionalGroups,
        firma_id: finalFirmaId
      } 
    });

  } catch (err) {
    console.error("Błąd API /api/useradd:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= GRUPY ===========================
app.get("/api/groupslist", authMiddleware, buildUserGroups, async (req, res) => {
  try {
    const db = getDB();
    
    if (req.user.ranga === "root") {
      const [rows] = await db.query(
        "SELECT id, nazwa FROM grupy WHERE nazwa != 'root' ORDER BY nazwa ASC"
      );
      return res.json(rows.map(g => ({ id: g.id, name: g.nazwa })));
    }
    
    if (!req.user.groups || req.user.groups.length === 0) {
      const [rows] = await db.query(
        "SELECT id, nazwa FROM grupy WHERE id = ? AND nazwa != 'root' ORDER BY nazwa ASC",
        [req.user.group_id]
      );
      return res.json(rows.map(g => ({ id: g.id, name: g.nazwa })));
    }
    
    const placeholders = req.user.groups.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT id, nazwa FROM grupy 
       WHERE id IN (${placeholders}) AND nazwa != 'root' 
       ORDER BY nazwa ASC`,
      [...req.user.groups]
    );
    
    res.json(rows.map(g => ({ id: g.id, name: g.nazwa })));
    
  } catch (err) {
    console.error("Błąd API /api/groupslist:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/telebim/:uuid/group", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid } = req.params;
  const { group_id } = req.body;
  const currentUser = req.user;

  if (!group_id) return res.status(400).json({ error: "Nieprawidłowe ID grupy" });

  try {
    const db = getDB();

    const [telebimRows] = await db.query(
      "SELECT * FROM telebimy_machine WHERE uuid = ?",
      [uuid]
    );
    
    if (telebimRows.length === 0) {
      return res.status(404).json({ error: "Urządzenie nie znalezione" });
    }

    const telebim = telebimRows[0];
    
    const canAccessBillboard = await validateBillboardAccess(req, uuid);
    if (!canAccessBillboard) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }

    if (currentUser.ranga !== "root") {
      const canAccessNewGroup = await validateGroupAccess(req, group_id);
      if (!canAccessNewGroup) {
        return res.status(403).json({ error: "Nie masz dostępu do tej grupy" });
      }
    }

    const [groupExists] = await db.query(
      "SELECT nazwa FROM grupy WHERE id = ?",
      [group_id]
    );
    
    if (groupExists.length === 0) {
      return res.status(400).json({ error: "Grupa nie istnieje" });
    }

    if (groupExists[0].nazwa === "root") {
      return res.status(403).json({ error: "Nie można przenieść urządzenia do grupy 'root'" });
    }

    if (telebim.group_id === parseInt(group_id)) {
      return res.status(400).json({ error: "Urządzenie już jest w tej grupie" });
    }

    await db.query(
      "UPDATE telebimy_machine SET group_id = ? WHERE uuid = ?",
      [group_id, uuid]
    );
    
    res.json({ 
      success: true,
      message: "Grupa urządzenia zmieniona pomyślnie",
      uuid: uuid,
      old_group_id: telebim.group_id,
      new_group_id: parseInt(group_id)
    });
  } catch (err) {
    console.error("Błąd API POST /api/telebim/:uuid/group:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/group/:id/rename", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nieprawidłowa nazwa" });
  }

  try {
    const db = getDB();
    
    const [userRows] = await db.query(
      'SELECT id, ranga, group_id, user_groups FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      return res.status(401).json({ error: "Użytkownik nie istnieje" });
    }
    
    const currentUser = userRows[0];
    
    const [groupRows] = await db.query(
      "SELECT id, nazwa FROM grupy WHERE id = ?",
      [id]
    );
    
    if (groupRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono grupy" });
    }
    
    const group = groupRows[0];
    
    if (group.nazwa === "root") {
      return res.status(403).json({ error: "Nie można edytować grupy 'root'" });
    }
    
    let hasAccess = false;
    
    if (currentUser.ranga === "root") {
      hasAccess = true;
    } else if (currentUser.ranga === "owner") {
      let userGroups = [currentUser.group_id];
      if (currentUser.user_groups) {
        try {
          const additionalGroups = JSON.parse(currentUser.user_groups);
          if (Array.isArray(additionalGroups)) {
            userGroups = [...userGroups, ...additionalGroups];
          }
        } catch (e) {}
      }
      
      hasAccess = userGroups.includes(parseInt(id));
    } else {
      return res.status(403).json({ error: "Brak uprawnień" });
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tej grupy" });
    }

    await db.query("UPDATE grupy SET nazwa = ? WHERE id = ?", [name.trim(), id]);
    res.json({ success: true, id, name: name.trim() });

  } catch (err) {
    console.error("Błąd API POST /api/group/:id/rename:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/group/:id", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDB();
    
    const [userRows] = await db.query(
      'SELECT id, ranga, group_id, user_groups FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      return res.status(401).json({ error: "Użytkownik nie istnieje" });
    }
    
    const currentUser = userRows[0];
    
    const [groupRows] = await db.query("SELECT * FROM grupy WHERE id = ?", [id]);
    if (groupRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono grupy" });
    }
    
    if (groupRows[0].nazwa === "root") {
      return res.status(403).json({ error: "Nie można usunąć grupy 'root'" });
    }
    
    let hasAccess = false;
    
    if (currentUser.ranga === "root") {
      hasAccess = true;
    } else if (currentUser.ranga === "owner") {
      let userGroups = [currentUser.group_id];
      if (currentUser.user_groups) {
        try {
          const additionalGroups = JSON.parse(currentUser.user_groups);
          if (Array.isArray(additionalGroups)) {
            userGroups = [...userGroups, ...additionalGroups];
          }
        } catch (e) {}
      }
      
      hasAccess = userGroups.includes(parseInt(id));
      
      if (currentUser.group_id === parseInt(id)) {
        return res.status(400).json({ 
          error: "Nie można usunąć swojej głównej grupy" 
        });
      }
    } else {
      return res.status(403).json({ error: "Brak uprawnień" });
    }
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Nie masz dostępu do tej grupy" 
      });
    }
    
    const [usersWithPrimaryGroup] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE group_id = ?",
      [id]
    );
    
    if (usersWithPrimaryGroup[0].count > 0) {
      return res.status(400).json({ 
        error: "Nie można usunąć grupy, ponieważ jest główną grupą dla użytkowników" 
      });
    }
    
    const [telebimsInGroup] = await db.query(
      "SELECT COUNT(*) as count FROM telebimy_machine WHERE group_id = ?",
      [id]
    );
    
    if (telebimsInGroup[0].count > 0) {
      return res.status(400).json({ 
        error: "Nie można usunąć grupy, ponieważ jest przypisana do telebimów" 
      });
    }
    
    const [allUsers] = await db.query(
      "SELECT id, user_groups FROM users WHERE user_groups IS NOT NULL AND user_groups != ''"
    );
    
    let usersToUpdate = [];
    
    allUsers.forEach(user => {
      try {
        const userGroups = JSON.parse(user.user_groups);
        if (Array.isArray(userGroups) && userGroups.includes(parseInt(id))) {
          usersToUpdate.push(user.id);
        }
      } catch (e) {}
    });
    
    for (const userId of usersToUpdate) {
      const [userData] = await db.query(
        "SELECT user_groups FROM users WHERE id = ?",
        [userId]
      );
      
      if (userData.length > 0 && userData[0].user_groups) {
        try {
          const currentGroups = JSON.parse(userData[0].user_groups);
          const newGroups = currentGroups.filter(g => g !== parseInt(id));
          
          await db.query(
            "UPDATE users SET user_groups = ? WHERE id = ?",
            [JSON.stringify(newGroups), userId]
          );
        } catch (e) {}
      }
    }
    
    await db.query("DELETE FROM grupy WHERE id = ?", [id]);
    
    res.json({ 
      success: true,
      message: `Grupa usunięta. Usunięto z ${usersToUpdate.length} użytkowników jako dodatkową grupę.`
    });

  } catch (err) {
    console.error("Błąd API DELETE /api/group/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/groups", authMiddleware, buildUserGroups, async (req, res) => {
  const { name } = req.body;
  
  if (req.user.ranga !== "root" && req.user.ranga !== "owner") {
    return res.status(403).json({ error: "Brak uprawnień" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nieprawidłowa nazwa" });
  }
  
if (name.trim().toLowerCase() === "root") {
  return res.status(400).json({ error: "Nie można utworzyć grupy o nazwie 'root'" });
}

  try {
    const db = getDB();
    
    await db.query("START TRANSACTION");
    
    const [existing] = await db.query("SELECT id FROM grupy WHERE nazwa = ?", [name.trim()]);
    if (existing.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "Grupa już istnieje" });
    }

    const result = await db.query("INSERT INTO grupy (nazwa) VALUES (?)", [name.trim()]);
    const newGroupId = result[0].insertId;
    
    if (req.user.ranga === "owner") {
      const [userData] = await db.query(
        'SELECT user_groups FROM users WHERE id = ?',
        [req.user.id]
      );
      
      let additionalGroups = [];
      if (userData.length > 0 && userData[0].user_groups) {
        try {
          additionalGroups = JSON.parse(userData[0].user_groups);
          if (!Array.isArray(additionalGroups)) {
            additionalGroups = [];
          }
        } catch (e) {
          additionalGroups = [];
        }
      }
      
      additionalGroups.push(newGroupId);
      const uniqueGroups = [...new Set(additionalGroups)];
      
      await db.query(
        'UPDATE users SET user_groups = ? WHERE id = ?',
        [JSON.stringify(uniqueGroups), req.user.id]
      );
    }
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true, 
      id: newGroupId, 
      name: name.trim(),
      autoAssigned: req.user.ranga === "owner"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Błąd API POST /api/groups:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= ENDPOINTY GRUP UŻYTKOWNIKA ===========================
app.get("/api/user/:id/groups", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;
  
  try {
    const db = getDB();
    
    if (currentUser.ranga === "root") {
      const [user] = await db.query(
        'SELECT group_id, user_groups FROM users WHERE id = ?',
        [id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ error: "Nie znaleziono użytkownika" });
      }
      
      const userData = user[0];
      let additionalGroups = [];
      
      if (userData.user_groups) {
        try {
          additionalGroups = JSON.parse(userData.user_groups);
          if (!Array.isArray(additionalGroups)) {
            additionalGroups = [];
          }
        } catch (e) {
          additionalGroups = [];
        }
      }
      
      const [allGroups] = await db.query('SELECT id, nazwa FROM grupy');
      
      return res.json({
        success: true,
        user_id: parseInt(id),
        primary_group_id: userData.group_id,
        additional_groups: additionalGroups,
        all_groups: allGroups.map(g => ({ id: g.id, name: g.nazwa }))
      });
    }
    
    if (currentUser.ranga === "owner") {
      const [user] = await db.query(
        'SELECT id, group_id, user_groups FROM users WHERE id = ?',
        [id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ error: "Nie znaleziono użytkownika" });
      }
      
      const userData = user[0];
      
      if (userData.group_id !== currentUser.group_id) {
        return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
      }
      
      let additionalGroups = [];
      if (userData.user_groups) {
        try {
          additionalGroups = JSON.parse(userData.user_groups);
          if (!Array.isArray(additionalGroups)) {
            additionalGroups = [];
          }
        } catch (e) {
          additionalGroups = [];
        }
      }
      
      const userGroups = [currentUser.group_id, ...additionalGroups];
      const [allGroups] = await db.query(
        'SELECT id, nazwa FROM grupy WHERE id IN (?)',
        [userGroups]
      );
      
      return res.json({
        success: true,
        user_id: parseInt(id),
        primary_group_id: userData.group_id,
        additional_groups: additionalGroups,
        all_groups: allGroups.map(g => ({ id: g.id, name: g.nazwa }))
      });
    }
    
    if (parseInt(id) !== currentUser.id) {
      return res.status(403).json({ error: "Brak dostępu do danych innych użytkowników" });
    }
    
    const [user] = await db.query(
      'SELECT group_id, user_groups FROM users WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const userData = user[0];
    let additionalGroups = [];
    
    if (userData.user_groups) {
      try {
        additionalGroups = JSON.parse(userData.user_groups);
        if (!Array.isArray(additionalGroups)) {
          additionalGroups = [];
        }
      } catch (e) {
        additionalGroups = [];
      }
    }
    
    const userGroups = [userData.group_id, ...additionalGroups].filter(g => g !== null);
    
    let allGroups = [];
    if (userGroups.length > 0) {
      const [groupRows] = await db.query(
        'SELECT id, nazwa FROM grupy WHERE id IN (?)',
        [userGroups]
      );
      allGroups = groupRows;
    }
    
    return res.json({
      success: true,
      user_id: parseInt(id),
      primary_group_id: userData.group_id,
      additional_groups: additionalGroups,
      all_groups: allGroups.map(g => ({ id: g.id, name: g.nazwa }))
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/user/:id/groups:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/user/:id/groups", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const { group_ids } = req.body;
  
  if (!group_ids || !Array.isArray(group_ids)) {
    return res.status(400).json({ error: "Nieprawidłowe dane grup" });
  }
  
  try {
    const hasAccess = await validateUserAccess(req, id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
    }
    
    const db = getDB();
    
    const [user] = await db.query(
      'SELECT id, group_id, user_groups FROM users WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const userData = user[0];
    
    if (!canEditUserGroups(req.user.ranga, userData.group_id, req.user.primary_group_id)) {
      return res.status(403).json({ error: "Brak uprawnień do edycji grup tego użytkownika" });
    }
    
    let currentAdditional = [];
    if (userData.user_groups) {
      try {
        currentAdditional = JSON.parse(userData.user_groups);
        if (!Array.isArray(currentAdditional)) {
          currentAdditional = [];
        }
      } catch (e) {
        currentAdditional = [];
      }
    }
    
    const newGroups = [...new Set([...currentAdditional, ...group_ids])];
    
    const canAddAllGroups = group_ids.every(groupId => 
      req.user.ranga === "root" || req.user.groups.includes(groupId)
    );
    
    if (!canAddAllGroups) {
      return res.status(403).json({ error: "Nie masz dostępu do wszystkich wybranych grup" });
    }
    
    await db.query(
      'UPDATE users SET user_groups = ? WHERE id = ?',
      [JSON.stringify(newGroups), id]
    );
    
    res.json({
      success: true,
      message: "Grupy zaktualizowane pomyślnie",
      user_id: parseInt(id),
      additional_groups: newGroups
    });
    
  } catch (err) {
    console.error("Błąd API POST /api/user/:id/groups:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/user/:id/groups/:groupId", authMiddleware, buildUserGroups, async (req, res) => {
  const { id, groupId } = req.params;
  
  try {
    const hasAccess = await validateUserAccess(req, id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Brak dostępu do tego użytkownika" });
    }
    
    const groupIdNum = parseInt(groupId);
    if (isNaN(groupIdNum)) {
      return res.status(400).json({ error: "Nieprawidłowe ID grupy" });
    }
    
    const db = getDB();
    
    const [user] = await db.query(
      'SELECT id, group_id, user_groups FROM users WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const userData = user[0];
    
    if (!canEditUserGroups(req.user.ranga, userData.group_id, req.user.primary_group_id)) {
      return res.status(403).json({ error: "Brak uprawnień do edycji grup tego użytkownika" });
    }
    
    if (userData.group_id === groupIdNum) {
      return res.status(400).json({ error: "Nie można usunąć głównej grupy użytkownika" });
    }
    
    let currentAdditional = [];
    if (userData.user_groups) {
      try {
        currentAdditional = JSON.parse(userData.user_groups);
        if (!Array.isArray(currentAdditional)) {
          currentAdditional = [];
        }
      } catch (e) {
        currentAdditional = [];
      }
    }
    
    if (!currentAdditional.includes(groupIdNum)) {
      return res.status(400).json({ error: "Użytkownik nie ma tej dodatkowej grupy" });
    }
    
    const newGroups = currentAdditional.filter(g => g !== groupIdNum);
    
    const willHaveMinOneGroup = await validateUserHasMinOneGroup(id, null, [groupIdNum]);
    if (!willHaveMinOneGroup) {
      return res.status(400).json({ error: "Użytkownik musi mieć przynajmniej 1 grupę" });
    }
    
    await db.query(
      'UPDATE users SET user_groups = ? WHERE id = ?',
      [JSON.stringify(newGroups), id]
    );
    
    res.json({
      success: true,
      message: "Grupa usunięta pomyślnie",
      user_id: parseInt(id),
      removed_group_id: groupIdNum,
      additional_groups: newGroups
    });
    
  } catch (err) {
    console.error("Błąd API DELETE /api/user/:id/groups/:groupId:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.patch("/api/user/:id/groups/primary", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const { group_id } = req.body;
  
  if (!group_id) {
    return res.status(400).json({ error: "Nieprawidłowe ID grupy" });
  }
  
  const newPrimaryId = parseInt(group_id);
  if (isNaN(newPrimaryId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID grupy" });
  }
  
  try {
    if (req.user.ranga !== "root") {
      return res.status(403).json({ error: "Tylko root może zmieniać główną grupę użytkownika" });
    }
    
    const db = getDB();
    
    const [user] = await db.query(
      'SELECT id, group_id, user_groups FROM users WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    }
    
    const userData = user[0];
    
    const [groupExists] = await db.query(
      'SELECT id FROM grupy WHERE id = ?',
      [newPrimaryId]
    );
    
    if (groupExists.length === 0) {
      return res.status(400).json({ error: "Grupa nie istnieje" });
    }
    
    let currentAdditional = [];
    if (userData.user_groups) {
      try {
        currentAdditional = JSON.parse(userData.user_groups);
        if (!Array.isArray(currentAdditional)) {
          currentAdditional = [];
        }
      } catch (e) {
        currentAdditional = [];
      }
    }
    
    const newAdditional = currentAdditional.filter(g => g !== newPrimaryId);
    
    await db.query(
      'UPDATE users SET group_id = ?, user_groups = ? WHERE id = ?',
      [newPrimaryId, JSON.stringify(newAdditional), id]
    );
    
    res.json({
      success: true,
      message: "Główna grupa zmieniona pomyślnie",
      user_id: parseInt(id),
      old_primary_group_id: userData.group_id,
      new_primary_group_id: newPrimaryId,
      additional_groups: newAdditional
    });
    
  } catch (err) {
    console.error("Błąd API PATCH /api/user/:id/groups/primary:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= ZARZĄDZANIE TOKENAMI ===========================
app.post('/api/verify-password', authMiddleware, async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: "Wprowadź hasło" });
  }
  
  try {
    const db = getDB();
    const [rows] = await db.query(
      'SELECT id FROM users WHERE id = ? AND password = ?',
      [req.user.id, password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Nieprawidłowe hasło" });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Błąd weryfikacji hasła:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post('/api/generate-deploy-token', authMiddleware, async (req, res) => {
  if (req.user.ranga !== "root" && req.user.ranga !== "owner") {
    return res.status(403).json({ error: "Brak uprawnień" });
  }
  
  try {
    const db = getDB();
    const crypto = await import('crypto');
    
    const [existingTokens] = await db.query(
      'SELECT id, token FROM tokeny WHERE id_owner = ?',
      [req.user.id]
    );
    
    let token;
    
    if (existingTokens.length > 0) {
      token = crypto.randomBytes(16).toString('hex');
      
      await db.query(
        'UPDATE tokeny SET token = ? WHERE id_owner = ?',
        [token, req.user.id]
      );
    } else {
      token = crypto.randomBytes(16).toString('hex');
      const [duplicateCheck] = await db.query(
        'SELECT id FROM tokeny WHERE token = ?',
        [token]
      );
      
      if (duplicateCheck.length > 0) {
        token = crypto.randomBytes(16).toString('hex');
      }
      
      await db.query(
        'INSERT INTO tokeny (token, id_owner) VALUES (?, ?)',
        [token, req.user.id]
      );
    }
    
    res.json({ 
      success: true, 
      token: token,
      message: existingTokens.length > 0 ? "Token zaktualizowany pomyślnie" : "Token wygenerowany pomyślnie"
    });
    
  } catch (err) {
    console.error('Błąd generowania/aktualizacji tokenu:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= ZARZĄDZANIE PLIKAMI DLA TELEBIMÓW ===========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uuid = req.params.uuid;
    const uploadDir = path.join(process.cwd(), 'obrazki', uuid);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const normalizedName = normalizeFilename(file.originalname);
    const uploadDir = path.join(process.cwd(), 'obrazki', req.params.uuid);
    const uniqueName = getUniqueFilename(uploadDir, normalizedName);
    
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Niedozwolone rozszerzenie: .${ext}`));
    }

    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      return cb(new Error(`Niedozwolony typ MIME: ${file.mimetype}`));
    }

    return cb(null, true);
  }
});

app.get("/api/billboard/:uuid/files", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid } = req.params;
  
  try {
    const db = getDB();
    let checkQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let checkParams = [uuid];
    
    if (req.user.ranga !== "root") {
      checkQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      checkParams = [uuid, ...req.user.groups];
    }
    
    const [billboard] = await db.query(checkQuery, checkParams);
    
    if (billboard.length === 0) {
      return res.status(403).json({ 
        error: "Brak dostępu do tego urządzenia",
        success: false 
      });
    }
    
    const billboardDir = path.join(process.cwd(), 'obrazki', uuid);
    
    if (!fs.existsSync(billboardDir)) {
      return res.json({
        success: true,
        uuid,
        files: [],
        count: 0,
        directory: `./obrazki/${uuid}/`,
        message: "Folder nie istnieje"
      });
    }
    
    const files = fs.readdirSync(billboardDir)
      .filter(file => /\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|avi|mov|webm|mkv|html|htm|pdf|zip|js)$/i.test(file))
      .sort();
    
    res.json({
      success: true,
      uuid,
      files: files.map(filename => ({
        filename,
        type: getFileType(filename),
        path: `/api/billboard/${uuid}/file/${filename}`,
        fullPath: `./obrazki/${uuid}/${filename}`
      })),
      count: files.length,
      directory: `./obrazki/${uuid}/`
    });
  } catch (err) {
    console.error("Błąd pobierania plików:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/billboard/:uuid/upload",  authMiddleware, buildUserGroups, upload.single('file'), async (req, res) => {
    const { uuid } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: "Nie wybrano pliku" });
    }
    
    try {
      const db = getDB();
      let checkQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
      let checkParams = [uuid];
      
      if (req.user.ranga !== "root") {
        checkQuery = `
          SELECT tm.* FROM telebimy_machine tm
          WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
        `;
        checkParams = [uuid, ...req.user.groups];
      }
      
      const [billboard] = await db.query(checkQuery, checkParams);
      
      if (billboard.length === 0) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ 
          error: "Brak dostępu do tego urządzenia lub urządzenie nie istnieje" 
        });
      }
      
      res.json({
        success: true,
        message: "Plik przesłany pomyślnie",
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: `/api/billboard/${uuid}/file/${req.file.filename}`
        }
      });
    } catch (err) {
      console.error("Błąd uploadu pliku:", err);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: "Błąd serwera" });
    }
  }
);

app.post("/api/billboard/:uuid/upload-multiple", authMiddleware, upload.array('files', 10), async (req, res) => {
    const { uuid } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nie wybrano plików" });
    }
    
    try {
      const db = getDB();
      const [billboard] = await db.query(
        "SELECT * FROM telebimy_machine WHERE uuid = ?",
        [uuid]
      );
      
      if (billboard.length === 0) {
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(404).json({ error: "Urządzenie nie istnieje" });
      }
      
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: `/api/billboard/${uuid}/file/${file.filename}`
      }));
      
      res.json({
        success: true,
        message: `Przesłano ${uploadedFiles.length} plików`,
        files: uploadedFiles,
        count: uploadedFiles.length
      });
    } catch (err) {
      console.error("Błąd uploadu plików:", err);
      res.status(500).json({ error: "Błąd serwera" });
    }
  });

app.delete("/api/billboard/:uuid/file/:filename", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid, filename } = req.params;
  
  try {
    const db = getDB();
    let checkQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let checkParams = [uuid];
    
    if (req.user.ranga !== "root") {
      checkQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      checkParams = [uuid, ...req.user.groups];
    }
    
    const [billboard] = await db.query(checkQuery, checkParams);
    
    if (billboard.length === 0) {
      return res.status(403).json({ 
        error: "Brak dostępu do tego urządzenia" 
      });
    }
    
    const filePath = path.join(process.cwd(), 'obrazki', uuid, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Plik nie istnieje" });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: "Plik usunięty pomyślnie",
      filename
    });
  } catch (err) {
    console.error("Błąd usuwania pliku:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/billboard/:uuid/file/:filename", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid, filename } = req.params;

  try {
    const db = getDB();
    let checkQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let checkParams = [uuid];

    if (req.user.ranga !== "root") {
      checkQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      checkParams = [uuid, ...req.user.groups];
    }

    const [billboard] = await db.query(checkQuery, checkParams);

    if (billboard.length === 0) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }

    const baseDir = path.join(process.cwd(), 'obrazki', uuid);
    const filePath = path.join(baseDir, filename);

    // Path traversal protection
    if (!filePath.startsWith(baseDir + path.sep)) {
      return res.status(400).json({ error: "Nieprawidłowa ścieżka pliku" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Plik nie istnieje" });
    }

    const ext = path.extname(filename).toLowerCase();

    // .js, .zip, .pdf — wymuś pobieranie, nigdy nie wykonuj w przeglądarce
    if (FORCE_DOWNLOAD_EXTS.has(ext)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.sendFile(filePath);
    }

    // Obrazy i wideo — jak wcześniej
    let contentType = 'application/octet-stream';

    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) {
      contentType = 'image/' + ext.slice(1);
      if (ext === '.jpg') contentType = 'image/jpeg';
      if (ext === '.svg') contentType = 'image/svg+xml';
    } else if (['.mp4', '.avi', '.mov', '.webm', '.mkv'].includes(ext)) {
      contentType = 'video/' + ext.slice(1);
      if (ext === '.mkv') contentType = 'video/x-matroska';
    } else if (['.html', '.htm'].includes(ext)) {
      contentType = 'text/html';
    }

    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);

  } catch (err) {
    console.error("Błąd pobierania pliku:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

function getFileType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  if (['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext)) return 'image';
  if (['mp4','avi','mov','webm','mkv','flv'].includes(ext)) return 'video';
  if (['html','htm'].includes(ext)) return 'html';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'zip') return 'zip';
  if (ext === 'js') return 'js';
  return 'unknown';
}

// ============================= HARMONOGRAMY ===========================
app.get("/api/schedules/:billboard_uuid", authMiddleware, buildUserGroups, async (req, res) => {
  const { billboard_uuid } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const db = getDB();
    let billboardCheckQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let billboardCheckParams = [billboard_uuid];
    
    if (req.user.ranga !== "root") {
      billboardCheckQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      billboardCheckParams = [billboard_uuid, ...req.user.groups];
    }
    
    const [billboardRows] = await db.query(billboardCheckQuery, billboardCheckParams);
    
    if (billboardRows.length === 0) {
      return res.status(403).json({ 
        error: "Brak dostępu do tego urządzenia lub urządzenie nie istnieje" 
      });
    }
    
    const [rows] = await db.query(`
      SELECT * FROM harmonogramy 
      WHERE billboard_uuid = ?
      ORDER BY start_date DESC
      LIMIT ? OFFSET ?
    `, [billboard_uuid, parseInt(limit), parseInt(offset)]);
    
    const [countRows] = await db.query(
      "SELECT COUNT(*) as total FROM harmonogramy WHERE billboard_uuid = ?",
      [billboard_uuid]
    );
    
    res.json({
      success: true,
      schedules: rows.map(schedule => ({
        id: schedule.id,
        billboard_uuid: schedule.billboard_uuid,
        task_name: schedule.task_name,
        content: schedule.content,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        repeat: schedule.repeat_type,
        status: schedule.status,
        priority: schedule.priority || 0,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/schedules/:billboard_uuid:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/schedule/:id", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDB();
    
    const [rows] = await db.query(
      `SELECT h.*, tm.name as billboard_name 
       FROM harmonogramy h
       LEFT JOIN telebimy_machine tm ON h.billboard_uuid = tm.uuid
       WHERE h.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Harmonogram nie znaleziony" });
    }
    
    const schedule = rows[0];
    
    if (req.user.ranga !== "root") {
      const [billboardRows] = await db.query(
        `SELECT tm.* FROM telebimy_machine tm
         WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})`,
        [schedule.billboard_uuid, ...req.user.groups]
      );
      
      if (billboardRows.length === 0) {
        return res.status(403).json({ error: "Brak dostępu do tego harmonogramu" });
      }
    }
    
    res.json({
      success: true,
      schedule: {
        id: schedule.id,
        billboard_uuid: schedule.billboard_uuid,
        billboard_name: schedule.billboard_name,
        task_name: schedule.task_name,
        content: schedule.content,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        repeat: schedule.repeat_type,
        status: schedule.status,
        priority: schedule.priority || 0,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      }
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/schedule/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/schedules", authMiddleware, buildUserGroups, async (req, res) => {
  const {
    billboard_uuid,
    task_name,
    content,
    start_date,
    end_date,
    repeat = [1,2,3,4,5,6,7],
    status = "active",
    priority = 0,
    additional_hours = []
  } = req.body;
  
  if (!billboard_uuid || !task_name || !start_date || !end_date) {
    return res.status(400).json({ 
      error: "Wypełnij wszystkie wymagane pola (billboard_uuid, task_name, start_date, end_date)" 
    });
  }
  
  if (priority !== undefined && (typeof priority !== 'number' || !Number.isInteger(priority))) {
    return res.status(400).json({ error: "Priority musi być liczbą całkowitą" });
  }
  
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Nieprawidłowy format daty" });
  }
  
  if (startDate >= endDate) {
    return res.status(400).json({ error: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia" });
  }
  
  let repeatDays = repeat;
  if (!Array.isArray(repeatDays)) {
    repeatDays = [1,2,3,4,5,6,7];
  } else {
    repeatDays = repeatDays.filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
    if (repeatDays.length === 0) {
      repeatDays = [1,2,3,4,5,6,7];
    }
    repeatDays = [...new Set(repeatDays)].sort((a,b) => a-b);
  }
  
  let scheduleStatus = status;
  if (scheduleStatus !== 'active' && scheduleStatus !== 'paused') {
    scheduleStatus = 'active';
  }
  
  const schedulePriority = priority || 0;
  
  try {
    const db = getDB();
    
    let billboardCheckQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let billboardCheckParams = [billboard_uuid];
    
    if (req.user.ranga !== "root") {
      billboardCheckQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      billboardCheckParams = [billboard_uuid, ...req.user.groups];
    }
    
    const [billboardRows] = await db.query(billboardCheckQuery, billboardCheckParams);
    
    if (billboardRows.length === 0) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }
    
    const schedulesToCheck = [];
    
    schedulesToCheck.push({
      start_date: start_date,
      end_date: end_date,
      repeat: repeatDays,
      priority: schedulePriority,
      task_name: task_name,
      is_main: true
    });
    
    if (additional_hours && Array.isArray(additional_hours)) {
      for (const hourData of additional_hours) {
        if (hourData.start_date && hourData.end_date) {
          const addStartDate = new Date(hourData.start_date);
          const addEndDate = new Date(hourData.end_date);
          
          if (!isNaN(addStartDate.getTime()) && !isNaN(addEndDate.getTime()) && addStartDate < addEndDate) {
            schedulesToCheck.push({
              start_date: hourData.start_date,
              end_date: hourData.end_date,
              repeat: repeatDays,
              priority: schedulePriority,
              task_name: task_name,
              is_additional: true
            });
          }
        }
      }
    }
    
    const collisionCheck = await checkScheduleCollisions(
      billboard_uuid, 
      schedulesToCheck
    );
    
    if (collisionCheck.hasCollision) {
      const flatCollisions = [];
      collisionCheck.collisions.forEach(item => {
        item.collisions.forEach(collision => {
          flatCollisions.push({
            id: collision.id,
            task_name: collision.task_name,
            start_date: collision.start_date,
            end_date: collision.end_date,
            priority: collision.priority,
            commonDays: collision.commonDays
          });
        });
      });
      
      return res.status(409).json({
        error: "Kolizja harmonogramów",
        message: "Nie można zapisać harmonogramu ze względu na kolizję z istniejącymi harmonogramami",
        collisions: flatCollisions,
        schedule_count: schedulesToCheck.length
      });
    }
    
    await db.query("START TRANSACTION");
    
    try {
      const [result] = await db.query(`
        INSERT INTO harmonogramy 
        (billboard_uuid, task_name, content, start_date, end_date, repeat_type, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [billboard_uuid, task_name, content || null, start_date, end_date, JSON.stringify(repeatDays), scheduleStatus, schedulePriority]);
      
      const mainScheduleId = result.insertId;
      const savedSchedules = [{
        id: mainScheduleId,
        is_main: true,
        start_date: start_date,
        end_date: end_date
      }];
      
      if (additional_hours && Array.isArray(additional_hours)) {
        for (const hourData of additional_hours) {
          if (hourData.start_date && hourData.end_date) {
            const [addResult] = await db.query(`
              INSERT INTO harmonogramy 
              (billboard_uuid, task_name, content, start_date, end_date, repeat_type, status, priority)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [billboard_uuid, task_name, content || null, hourData.start_date, hourData.end_date, JSON.stringify(repeatDays), scheduleStatus, schedulePriority]);
            
            savedSchedules.push({
              id: addResult.insertId,
              is_additional: true,
              start_date: hourData.start_date,
              end_date: hourData.end_date
            });
          }
        }
      }
      
      await db.query("COMMIT");
      
      const savedScheduleIds = savedSchedules.map(s => s.id);
      const [savedRows] = await db.query(
        `SELECT * FROM harmonogramy WHERE id IN (?) ORDER BY start_date ASC`,
        [savedScheduleIds]
      );
      
      res.status(201).json({
        success: true,
        message: `Harmonogram utworzony pomyślnie (${savedSchedules.length} godzin)`,
        schedules: savedRows.map(schedule => ({
          id: schedule.id,
          billboard_uuid: schedule.billboard_uuid,
          task_name: schedule.task_name,
          content: schedule.content,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          repeat: schedule.repeat_type,
          status: schedule.status,
          priority: schedule.priority || 0
        }))
      });
      
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
    
  } catch (err) {
    console.error("Błąd API POST /api/schedules:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/schedules/check-collisions", authMiddleware, buildUserGroups, async (req, res) => {
  const {
    billboard_uuid,
    schedules = [],
    exclude_ids = []
  } = req.body;
  
  if (!billboard_uuid) {
    return res.status(400).json({ 
      error: "Brak wymaganego pola: billboard_uuid" 
    });
  }
  
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ 
      error: "Brak harmonogramów do sprawdzenia" 
    });
  }
  
  try {
    const validatedSchedules = [];
    
    for (const schedule of schedules) {
      const { start_date, end_date, repeat = [1,2,3,4,5,6,7], priority = 0 } = schedule;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: "Każdy harmonogram musi mieć start_date i end_date" 
        });
      }
      
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Nieprawidłowy format daty w harmonogramie" });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({ error: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia" });
      }
      
      let repeatDays = repeat;
      if (!Array.isArray(repeatDays)) {
        repeatDays = [1,2,3,4,5,6,7];
      } else {
        repeatDays = repeatDays.filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
        if (repeatDays.length === 0) {
          repeatDays = [1,2,3,4,5,6,7];
        }
        repeatDays = [...new Set(repeatDays)].sort((a,b) => a-b);
      }
      
      validatedSchedules.push({
        start_date: start_date,
        end_date: end_date,
        repeat: repeatDays,
        priority: priority || 0,
        task_name: schedule.task_name || "Nowy harmonogram"
      });
    }
    
    const db = getDB();
    let billboardCheckQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let billboardCheckParams = [billboard_uuid];
    
    if (req.user.ranga !== "root") {
      billboardCheckQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      billboardCheckParams = [billboard_uuid, ...req.user.groups];
    }
    
    const [billboardRows] = await db.query(billboardCheckQuery, billboardCheckParams);
    
    if (billboardRows.length === 0) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }
    
    const collisionCheck = await checkScheduleCollisions(
      billboard_uuid, 
      validatedSchedules,
      exclude_ids
    );
    
    res.json({
      success: true,
      hasCollision: collisionCheck.hasCollision,
      collisions: collisionCheck.collisions,
      checked_schedules_count: validatedSchedules.length
    });
    
  } catch (err) {
    console.error("Błąd API POST /api/schedules/check-collisions:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.put("/api/schedule/:id", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const {
    task_name,
    content,
    start_date,
    end_date,
    repeat,
    status,
    priority,
    additional_hours = []
  } = req.body;
  
  if (!task_name || !start_date || !end_date) {
    return res.status(400).json({ 
      error: "Wypełnij wszystkie wymagane pola (task_name, start_date, end_date)" 
    });
  }
  
  if (priority !== undefined && (typeof priority !== 'number' || !Number.isInteger(priority))) {
    return res.status(400).json({ error: "Priority musi być liczbą całkowitą" });
  }
  
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: "Nieprawidłowy format daty" });
  }
  
  if (startDate >= endDate) {
    return res.status(400).json({ error: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia" });
  }
  
  let repeatDays = repeat;
  if (!Array.isArray(repeatDays)) {
    repeatDays = [1,2,3,4,5,6,7];
  } else {
    repeatDays = repeatDays.filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
    if (repeatDays.length === 0) {
      repeatDays = [1,2,3,4,5,6,7];
    }
    repeatDays = [...new Set(repeatDays)].sort((a,b) => a-b);
  }
  
  let scheduleStatus = status;
  if (scheduleStatus !== 'active' && scheduleStatus !== 'paused') {
    scheduleStatus = 'active';
  }
  
  const schedulePriority = priority !== undefined ? priority : 0;
  
  try {
    const db = getDB();
    
    const [existingRows] = await db.query(
      "SELECT * FROM harmonogramy WHERE id = ?",
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Harmonogram nie znaleziony" });
    }
    
    const schedule = existingRows[0];
    
    if (req.user.ranga !== "root") {
      const [billboardRows] = await db.query(
        `SELECT tm.* FROM telebimy_machine tm
         WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})`,
        [schedule.billboard_uuid, ...req.user.groups]
      );
      
      if (billboardRows.length === 0) {
        return res.status(403).json({ error: "Brak dostępu do tego harmonogramu" });
      }
    }
    
    const schedulesToCheck = [];
    
    schedulesToCheck.push({
      start_date: start_date,
      end_date: end_date,
      repeat: repeatDays,
      priority: schedulePriority,
      task_name: task_name
    });
    
    if (additional_hours && Array.isArray(additional_hours)) {
      for (const hourData of additional_hours) {
        if (hourData.start_date && hourData.end_date) {
          const addStartDate = new Date(hourData.start_date);
          const addEndDate = new Date(hourData.end_date);
          
          if (!isNaN(addStartDate.getTime()) && !isNaN(addEndDate.getTime()) && addStartDate < addEndDate) {
            schedulesToCheck.push({
              start_date: hourData.start_date,
              end_date: hourData.end_date,
              repeat: repeatDays,
              priority: schedulePriority,
              task_name: task_name
            });
          }
        }
      }
    }
    
    const collisionCheck = await checkScheduleCollisions(
      schedule.billboard_uuid,
      schedulesToCheck,
      [id]
    );
    
    if (collisionCheck.hasCollision) {
      const flatCollisions = [];
      collisionCheck.collisions.forEach(item => {
        item.collisions.forEach(collision => {
          flatCollisions.push({
            id: collision.id,
            task_name: collision.task_name,
            start_date: collision.start_date,
            end_date: collision.end_date,
            priority: collision.priority,
            commonDays: collision.commonDays
          });
        });
      });
      
      return res.status(409).json({
        error: "Kolizja harmonogramów",
        message: "Nie można zaktualizować harmonogramu ze względu na kolizję z istniejącymi harmonogramami",
        collisions: flatCollisions
      });
    }
    
    await db.query(`
      UPDATE harmonogramy 
      SET 
        task_name = ?,
        content = ?,
        start_date = ?,
        end_date = ?,
        repeat_type = ?,
        status = ?,
        priority = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [task_name, content || null, start_date, end_date, JSON.stringify(repeatDays), scheduleStatus, schedulePriority, id]);
    
    const [updatedRows] = await db.query(
      "SELECT * FROM harmonogramy WHERE id = ?",
      [id]
    );
    
    res.json({
      success: true,
      message: "Harmonogram zaktualizowany pomyślnie",
      schedule: {
        id: updatedRows[0].id,
        billboard_uuid: updatedRows[0].billboard_uuid,
        task_name: updatedRows[0].task_name,
        content: updatedRows[0].content,
        start_date: updatedRows[0].start_date,
        end_date: updatedRows[0].end_date,
        repeat: updatedRows[0].repeat_type,
        status: updatedRows[0].status,
        priority: updatedRows[0].priority || 0,
        updated_at: updatedRows[0].updated_at
      }
    });
    
  } catch (err) {
    console.error("Błąd API PUT /api/schedule/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.put("/api/schedule-group/:groupId", authMiddleware, buildUserGroups, async (req, res) => {
  const { groupId } = req.params;
  const {
    billboard_uuid,
    task_name,
    content,
    schedules = []
  } = req.body;
  
  if (!billboard_uuid || !task_name || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ 
      error: "Wypełnij wszystkie wymagane pola" 
    });
  }
  
  try {
    const db = getDB();
    
    let billboardCheckQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let billboardCheckParams = [billboard_uuid];
    
    if (req.user.ranga !== "root") {
      billboardCheckQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      billboardCheckParams = [billboard_uuid, ...req.user.groups];
    }
    
    const [billboardRows] = await db.query(billboardCheckQuery, billboardCheckParams);
    
    if (billboardRows.length === 0) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }
    
    const oldScheduleIds = groupId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    const validatedSchedules = [];
    
    for (const schedule of schedules) {
      const { start_date, end_date, repeat = [1,2,3,4,5,6,7], priority = 0, status = 'active' } = schedule;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: "Każdy harmonogram musi mieć start_date i end_date" 
        });
      }
      
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Nieprawidłowy format daty w harmonogramie" });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({ error: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia" });
      }
      
      let repeatDays = repeat;
      if (!Array.isArray(repeatDays)) {
        repeatDays = [1,2,3,4,5,6,7];
      } else {
        repeatDays = repeatDays.filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
        if (repeatDays.length === 0) {
          repeatDays = [1,2,3,4,5,6,7];
        }
        repeatDays = [...new Set(repeatDays)].sort((a,b) => a-b);
      }
      
      let scheduleStatus = status;
      if (scheduleStatus !== 'active' && scheduleStatus !== 'paused') {
        scheduleStatus = 'active';
      }
      
      validatedSchedules.push({
        start_date: start_date,
        end_date: end_date,
        repeat: repeatDays,
        priority: priority || 0,
        status: scheduleStatus,
        task_name: task_name,
        content: content || null
      });
    }
    
    const collisionCheck = await checkScheduleCollisions(
      billboard_uuid,
      validatedSchedules,
      oldScheduleIds
    );
    
    if (collisionCheck.hasCollision) {
      const flatCollisions = [];
      collisionCheck.collisions.forEach(item => {
        item.collisions.forEach(collision => {
          flatCollisions.push({
            id: collision.id,
            task_name: collision.task_name,
            start_date: collision.start_date,
            end_date: collision.end_date,
            priority: collision.priority,
            commonDays: collision.commonDays
          });
        });
      });
      
      return res.status(409).json({
        error: "Kolizja harmonogramów",
        message: "Nie można zaktualizować harmonogramów ze względu na kolizję z istniejącymi harmonogramami",
        collisions: flatCollisions
      });
    }
    
    await db.query("START TRANSACTION");
    
    try {
      if (oldScheduleIds.length > 0) {
        await db.query(
          `DELETE FROM harmonogramy WHERE id IN (?)`,
          [oldScheduleIds]
        );
      }
      
      const newScheduleIds = [];
      
      for (const schedule of validatedSchedules) {
        const [result] = await db.query(`
          INSERT INTO harmonogramy 
          (billboard_uuid, task_name, content, start_date, end_date, repeat_type, status, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          billboard_uuid,
          schedule.task_name,
          schedule.content,
          schedule.start_date,
          schedule.end_date,
          JSON.stringify(schedule.repeat),
          schedule.status,
          schedule.priority
        ]);
        
        newScheduleIds.push(result.insertId);
      }
      
      await db.query("COMMIT");
      
      const [newSchedulesRows] = await db.query(
        `SELECT * FROM harmonogramy WHERE id IN (?) ORDER BY start_date ASC`,
        [newScheduleIds]
      );
      
      res.json({
        success: true,
        message: `Grupa harmonogramów zaktualizowana pomyślnie (${newSchedulesRows.length} godzin)`,
        old_schedule_ids: oldScheduleIds,
        new_schedule_ids: newScheduleIds,
        schedules: newSchedulesRows.map(schedule => ({
          id: schedule.id,
          billboard_uuid: schedule.billboard_uuid,
          task_name: schedule.task_name,
          content: schedule.content,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          repeat: schedule.repeat_type,
          status: schedule.status,
          priority: schedule.priority || 0
        }))
      });
      
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
    
  } catch (err) {
    console.error("Błąd API PUT /api/schedule-group/:groupId:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/schedule/:id", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDB();
    
    const [existingRows] = await db.query(
      "SELECT * FROM harmonogramy WHERE id = ?",
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Harmonogram nie znaleziony" });
    }
    
    const schedule = existingRows[0];
    
    if (req.user.ranga !== "root") {
      const [billboardRows] = await db.query(
        `SELECT tm.* FROM telebimy_machine tm
         WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})`,
        [schedule.billboard_uuid, ...req.user.groups]
      );
      
      if (billboardRows.length === 0) {
        return res.status(403).json({ error: "Brak dostępu do tego harmonogramu" });
      }
    }
    
    await db.query("DELETE FROM harmonogramy WHERE id = ?", [id]);
    
    res.json({
      success: true,
      message: "Harmonogram usunięty pomyślnie"
    });
    
  } catch (err) {
    console.error("Błąd API DELETE /api/schedule/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/schedule/:id/status", authMiddleware, buildUserGroups, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ["active", "paused"];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Nieprawidłowy status. Dozwolone tylko: active, paused" });
  }
  
  try {
    const db = getDB();
    
    const [existingRows] = await db.query(
      "SELECT * FROM harmonogramy WHERE id = ?",
      [id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Harmonogram nie znaleziony" });
    }
    
    const schedule = existingRows[0];
    
    if (req.user.ranga !== "root") {
      const [billboardRows] = await db.query(
        `SELECT tm.* FROM telebimy_machine tm
         WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})`,
        [schedule.billboard_uuid, ...req.user.groups]
      );
      
      if (billboardRows.length === 0) {
        return res.status(403).json({ error: "Brak dostępu do tego harmonogramu" });
      }
    }
    
    await db.query(
      "UPDATE harmonogramy SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );
    
    res.json({
      success: true,
      message: `Status harmonogramu zmieniony na '${status}'`
    });
    
  } catch (err) {
    console.error("Błąd API POST /api/schedule/:id/status:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/active-schedules", authMiddleware, buildUserGroups, async (req, res) => {
  try {
    const db = getDB();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    let query = `
      SELECT 
        h.*,
        tm.uuid as billboard_uuid,
        tm.name as billboard_name
      FROM harmonogramy h
      JOIN telebimy_machine tm ON h.billboard_uuid = tm.uuid
      WHERE h.status = 'active'
        AND h.start_date <= ?
        AND h.end_date >= ?
    `;
    let params = [now, now];
    
    if (req.user.ranga !== "root") {
      query += ` AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})`;
      params.push(...req.user.groups);
    }
    
    query += " ORDER BY h.start_date ASC";
    
    const [rows] = await db.query(query, params);
    
    res.json({
      success: true,
      schedules: rows.map(schedule => ({
        id: schedule.id,
        billboard_uuid: schedule.billboard_uuid,
        billboard_name: schedule.billboard_name,
        task_name: schedule.task_name,
        content: schedule.content,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        repeat: schedule.repeat_type,
        status: schedule.status,
        priority: schedule.priority || 0
      })),
      count: rows.length,
      timestamp: now
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/active-schedules:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/schedules/status/:status", authMiddleware, async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const validStatuses = ["active", "paused"];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Nieprawidłowy status" });
  }
  
  try {
    const db = getDB();
    
    const [rows] = await db.query(`
      SELECT 
        h.*,
        tm.name as billboard_name
      FROM harmonogramy h
      JOIN telebimy_machine tm ON h.billboard_uuid = tm.uuid
      WHERE h.status = ?
      ORDER BY h.start_date DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), parseInt(offset)]);
    
    const [countRows] = await db.query(
      "SELECT COUNT(*) as total FROM harmonogramy WHERE status = ?",
      [status]
    );
    
    res.json({
      success: true,
      schedules: rows.map(schedule => ({
        id: schedule.id,
        billboard_uuid: schedule.billboard_uuid,
        billboard_name: schedule.billboard_name,
        task_name: schedule.task_name,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        repeat: schedule.repeat_type,
        status: schedule.status,
        priority: schedule.priority || 0
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    });
    
  } catch (err) {
    console.error("Błąd API GET /api/schedules/status/:status:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= FIRMY (Tylko dla root) ===========================
app.get("/api/companieslist", authMiddleware, async (req, res) => {
  try {
    if (req.user.ranga !== "root") {
      return res.status(403).json({ error: "Tylko root może zarządzać firmami" });
    }
    
    const db = getDB();
    const [rows] = await db.query(
      "SELECT id, name FROM firmy ORDER BY name ASC"
    );
    
    res.json(rows.map(c => ({ id: c.id, name: c.name })));
    
  } catch (err) {
    console.error("Błąd API /api/companieslist:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/companies", authMiddleware, async (req, res) => {
  const { name } = req.body;
  
  if (req.user.ranga !== "root") {
    return res.status(403).json({ error: "Tylko root może dodawać firmy" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nieprawidłowa nazwa" });
  }

  try {
    const db = getDB();
    
    await db.query("START TRANSACTION");
    
    const [existing] = await db.query("SELECT id FROM firmy WHERE name = ?", [name.trim()]);
    if (existing.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "Firma już istnieje" });
    }

    const result = await db.query("INSERT INTO firmy (name) VALUES (?)", [name.trim()]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true, 
      id: result[0].insertId, 
      name: name.trim()
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Błąd API POST /api/companies:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/company/:id/rename", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (req.user.ranga !== "root") {
    return res.status(403).json({ error: "Tylko root może edytować firmy" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nieprawidłowa nazwa" });
  }

  try {
    const db = getDB();
    
    const [companyRows] = await db.query(
      "SELECT id, name FROM firmy WHERE id = ?",
      [id]
    );
    
    if (companyRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono firmy" });
    }
    
    const [existing] = await db.query(
      "SELECT id FROM firmy WHERE name = ? AND id != ?",
      [name.trim(), id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: "Firma o takiej nazwie już istnieje" });
    }

    await db.query("UPDATE firmy SET name = ? WHERE id = ?", [name.trim(), id]);
    res.json({ success: true, id, name: name.trim() });

  } catch (err) {
    console.error("Błąd API POST /api/company/:id/rename:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/company/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  if (req.user.ranga !== "root") {
    return res.status(403).json({ error: "Tylko root może usuwać firmy" });
  }
  
  try {
    const db = getDB();
    
    const [companyRows] = await db.query("SELECT * FROM firmy WHERE id = ?", [id]);
    if (companyRows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono firmy" });
    }
    
    const [usersWithCompany] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE firma = ?",
      [companyRows[0].name]
    );
    
    if (usersWithCompany[0].count > 0) {
      return res.status(400).json({ 
        error: "Nie można usunąć firmy, ponieważ są przypisani do niej użytkownicy" 
      });
    }
    
    await db.query("DELETE FROM firmy WHERE id = ?", [id]);
    
    res.json({ 
      success: true,
      message: "Firma usunięta pomyślnie"
    });

  } catch (err) {
    console.error("Błąd API DELETE /api/company/:id:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// ============================= ENDPOINT ZMIANY GRUPY TELEBIMU ===========================
app.post("/api/telebim/:uuid/changegroup", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid } = req.params;
  const { group_id } = req.body;
  const currentUser = req.user;

  if (!group_id) return res.status(400).json({ error: "Nieprawidłowe ID grupy" });

  try {
    const db = getDB();

    const [telebimRows] = await db.query(
      "SELECT * FROM telebimy_machine WHERE uuid = ?",
      [uuid]
    );
    
    if (telebimRows.length === 0) {
      return res.status(404).json({ error: "Urządzenie nie znalezione" });
    }

    const telebim = telebimRows[0];
    
    const canAccessBillboard = await validateBillboardAccess(req, uuid);
    if (!canAccessBillboard) {
      return res.status(403).json({ error: "Brak dostępu do tego urządzenia" });
    }

    if (currentUser.ranga !== "root") {
      const canAccessNewGroup = await validateGroupAccess(req, group_id);
      if (!canAccessNewGroup) {
        return res.status(403).json({ error: "Nie masz dostępu do tej grupy" });
      }
    }

    const [groupExists] = await db.query(
      "SELECT nazwa FROM grupy WHERE id = ?",
      [group_id]
    );
    
    if (groupExists.length === 0) {
      return res.status(400).json({ error: "Grupa nie istnieje" });
    }

    if (groupExists[0].nazwa === "root") {
      return res.status(403).json({ error: "Nie można przenieść urządzenia do grupy 'root'" });
    }

    if (telebim.group_id === parseInt(group_id)) {
      return res.status(400).json({ error: "Urządzenie już jest w tej grupie" });
    }

    await db.query(
      "UPDATE telebimy_machine SET group_id = ? WHERE uuid = ?",
      [group_id, uuid]
    );
    
    res.json({ 
      success: true,
      message: "Grupa urządzenia zmieniona pomyślnie",
      uuid: uuid,
      old_group_id: telebim.group_id,
      new_group_id: parseInt(group_id)
    });
  } catch (err) {
    console.error("Błąd API POST /api/telebim/:uuid/changegroup:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.delete("/api/billboard/:uuid/file/:filename/with-schedules", authMiddleware, buildUserGroups, async (req, res) => {
  const { uuid, filename } = req.params;
  
  try {
    const db = getDB();
    let checkQuery = "SELECT * FROM telebimy_machine WHERE uuid = ?";
    let checkParams = [uuid];
    
    if (req.user.ranga !== "root") {
      checkQuery = `
        SELECT tm.* FROM telebimy_machine tm
        WHERE tm.uuid = ? AND tm.group_id IN (${req.user.groups.map(() => '?').join(',')})
      `;
      checkParams = [uuid, ...req.user.groups];
    }
    
    const [billboard] = await db.query(checkQuery, checkParams);

    if (billboard.length === 0) {
      return res.status(403).json({ 
        error: "Brak dostępu do tego urządzenia" 
      });
    }

    const filePath = path.join(process.cwd(), "obrazki", uuid, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Plik nie istnieje" });
    }

    const [allSchedules] = await db.query(
      "SELECT id, content FROM harmonogramy WHERE billboard_uuid = ?",
      [uuid]
    );

    const idsToDelete = [];
    
    for (const schedule of allSchedules) {
      if (!schedule.content) continue;
      
      try {
        const parsed = JSON.parse(schedule.content);
        if (parsed.filename === filename) {
          idsToDelete.push(schedule.id);
        }
      } catch (e) {
        if (schedule.content.includes(filename)) {
          idsToDelete.push(schedule.id);
        }
      }
    }

    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      const [deleteResult] = await db.query(
        `DELETE FROM harmonogramy WHERE id IN (${idsToDelete.map(() => '?').join(',')})`,
        idsToDelete
      );
      deletedCount = deleteResult.affectedRows;
    }

    fs.unlinkSync(filePath);

    const dir = path.join(process.cwd(), "obrazki", uuid);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }

    res.json({
      success: true,
      message: `Plik usunięty. Usunięto ${deletedCount} powiązanych harmonogramów.`,
      deleted_file: filename,
      deleted_schedules: deletedCount,
      deleted_schedule_ids: idsToDelete
    });

  } catch (err) {
    console.error("Błąd podczas usuwania pliku:", err);
    res.status(500).json({
      error: "Błąd serwera",
      details: err.message
    });
  }
});

app.get("/upload", async (req, res) => {
  const { uuid } = req.query;
  
  if (!uuid) {
    return res.status(400).json({ error: "Brak parametru UUID" });
  }
  
  try {
    const db = getDB();
    
    const [schedules] = await db.query(`
      SELECT * FROM harmonogramy 
      WHERE billboard_uuid = ? 
      ORDER BY start_date ASC
    `, [uuid]);
    
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const neededFiles = new Set();
    
    for (const schedule of schedules) {
      try {
        const startTime = new Date(schedule.start_date);
        const endTime = new Date(schedule.end_date);

        const isActiveInNext24h = startTime < next24h && endTime > now;

        if (!isActiveInNext24h) {
          continue;
        }

        let mediaFile = "";
        let scheduleContent = schedule.content;

        if (scheduleContent) {
          try {
            const contentObj = JSON.parse(scheduleContent);
            mediaFile = contentObj.filename || "";
          } catch (e) {
            mediaFile = scheduleContent;
          }
        }
        
        if (mediaFile && mediaFile.trim() !== '') {
          neededFiles.add(mediaFile.trim());
        }
      } catch (err) {
        console.error(`Error processing schedule ${schedule.id}:`, err);
      }
    }
    
    if (neededFiles.size === 0) {
      return res.status(404).json({ 
        error: "Brak plików do pobrania",
        message: "Brak aktywnych harmonogramów na dziś i jutro"
      });
    }
    
    const billboardDir = path.join(process.cwd(), 'obrazki', uuid);
    
    if (!fs.existsSync(billboardDir)) {
      return res.status(404).json({ 
        error: "Brak plików dla tego urządzenia",
        message: "Folder nie istnieje"
      });
    }
    
    const existingFiles = [];
    for (const filename of neededFiles) {
      const filePath = path.join(billboardDir, filename);
      if (fs.existsSync(filePath)) {
        existingFiles.push(filename);
      } else {
        console.warn(`Plik nie znaleziony: ${filePath}`);
      }
    }
    
    if (existingFiles.length === 0) {
      return res.status(404).json({ 
        error: "Brak plików do pobrania",
        message: "Pliki z harmonogramów nie istnieją na serwerze"
      });
    }
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${uuid}_today_tomorrow.zip"`);
    
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.on('error', (err) => {
      console.error("Błąd tworzenia ZIP:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Błąd podczas tworzenia archiwum ZIP" });
      }
    });
    
    archive.pipe(res);
    
    for (const filename of existingFiles) {
      const filePath = path.join(billboardDir, filename);
      archive.file(filePath, { name: filename });
    }
    
    await archive.finalize();
    
  } catch (err) {
    console.error("Błąd API GET /upload:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Błąd serwera" });
    }
  }
});

// ============================= AUTO CLEAN TOKENÓW ===========================
async function cleanupInvalidTokens() {
  try {
    const db = getDB();
    
    const [invalidTokens] = await db.query(`
      SELECT t.id, t.token, u.username, u.ranga 
      FROM tokeny t 
      JOIN users u ON t.id_owner = u.id 
      WHERE u.ranga NOT IN ('owner', 'root')
    `);
    
    if (invalidTokens.length > 0) {
      
      const ids = invalidTokens.map(t => t.id);
      const [deleteResult] = await db.query(
        `DELETE FROM tokeny WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
    }
  } catch (err) {
    console.error("Błąd czyszczenia tokenów:", err);
  }
}
setTimeout(cleanupInvalidTokens, 5000);
setInterval(cleanupInvalidTokens, 60 * 60 * 1000);

// ============================= AUTO CLEAN FOLDERÓW TELEBIMÓW ===========================
async function cleanupBillboardFolders() {
  try {
    const db = getDB();
    const imagesDir = path.join(process.cwd(), 'obrazki');
    
    if (!fs.existsSync(imagesDir)) {
      return;
    }
    
    const [billboards] = await db.query('SELECT uuid FROM telebimy_machine');
    const validUuids = new Set(billboards.map(b => b.uuid));
    
    const folders = fs.readdirSync(imagesDir).filter(item => {
      const itemPath = path.join(imagesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    const foldersToDelete = [];
    
    for (const folder of folders) {
      if (!validUuids.has(folder)) {
        const folderPath = path.join(imagesDir, folder);
        foldersToDelete.push({
          name: folder,
          path: folderPath
        });
      }
    }
    
    if (foldersToDelete.length > 0) { 
      for (const folderData of foldersToDelete) {
        try {
          fs.rmSync(folderData.path, { recursive: true, force: true });
        } catch (err) {
        }
      }
      
      console.log(`Czyszczenie zakończone. Usunięto ${foldersToDelete.length} folderów nie aktywnych urządzeń.`);
    } else {
    }
    
  } catch (err) {
    console.error("Błąd czyszczenia folderów urządzeń:", err);
  }
}
setTimeout(cleanupBillboardFolders, 5000);
setInterval(cleanupBillboardFolders, 24 * 60 * 60 * 1000);

const logFilePath = path.join(__dirname, 'logs/console_errors.txt');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFile(logFilePath, `[${timestamp}] ${message}\n`, (err) => {
    if (err) console.error('Błąd przy zapisie logu:', err);
  });
}

const originalConsoleError = console.error;
console.error = (...args) => {
  logToFile('ERROR: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
  originalConsoleError(...args);
};

const originalConsoleLog = console.log;
console.log = (...args) => {
  logToFile('LOG: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
  originalConsoleLog(...args);
};

process.on('uncaughtException', (err) => {
  console.error('Nieobsłużony błąd:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Nieobsłużona obietnica:', reason);
});

console.log('Aplikacja wystartowała!');

// ==================== INICJACJA BAZY I WEBSOCKET ====================
(async () => {
  await initDB();
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log("Serwer działa na porcie", PORT);
  });
})();