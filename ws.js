// ws.js
import { WebSocketServer } from 'ws';
import { getDB } from './db.js';
import crypto from 'crypto';

const receivers = new Map();

class Odbiornik{
    ws = null;
    name = "";
    groupId = NaN;
    
    constructor(ws, name, groupId){
        this.ws = ws;
        this.name = name;
        this.groupId = groupId;
    }
}

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.send("Welcome to WebSocket server");
	
    ws.on('message', (msg) => {
      if(msg.toString().includes("UUID")){
        receiveConnPacket(ws, msg);
      }
      if(msg.toString().includes("token")){
        receiveTokenPacket(ws, msg);
      }
      if(msg.toString().toLowerCase().includes("updaterequest")){
        receiveUpdatePacket(ws, msg);
      }
    });
      
    ws.on("close", () => {
      for (const [key, value] of receivers.entries()) {
        if (value.ws === ws) {
          updateConnectionStatus(key, false);
          receivers.delete(key);
          console.log(`Client ${key} disconnected`);
          break;
        }
	  }	
	});
  });

  return wss;
}

async function updateConnectionStatus(uuid, isConnected) {
    try {
        const db = getDB();
        
        const [existing] = await db.query(
            `SELECT id FROM telebimy_machine WHERE uuid = ?`,
            [uuid]
        );
        
        if (existing.length === 0) {
            await db.query(
                `INSERT INTO telebimy_machine (uuid, name, is_connected) 
                 VALUES (?, ?, ?)`,
                [uuid, 'Nowy telebim', isConnected ? 1 : 0]
            );
            console.log(`Nowy telebim ${uuid} ${isConnected ? 'podłączony' : 'rozłączony'}`);
        } else {
            await db.query(
                `UPDATE telebimy_machine 
                 SET is_connected = ? 
                 WHERE uuid = ?`,
                [isConnected ? 1 : 0, uuid]
            );
            console.log(`Telebim ${uuid} ${isConnected ? 'podłączony' : 'rozłączony'}`);
        }
        
        return true;
    } catch (error) {
        console.error("Błąd aktualizacji statusu połączenia:", error);
        throw error;
    }
}

function sendDebugPacketToClient(id, content){
    const receiver = receivers.get(id);
    if (!receiver || !receiver.ws || receiver.ws.readyState !== receiver.ws.OPEN) {
        return;
    }
    
    receiver.ws.send("debug:::" + content);
}

function requestUpdateFromClient(id){
    const receiver = receivers.get(id);
    if (!receiver || !receiver.ws || receiver.ws.readyState !== receiver.ws.OPEN) {
        return;
    }
    
    receiver.ws.send("updaterequest:::placeholder");
}

function sendSettings(id, settingsJson){
    const receiver = receivers.get(id);
    if (!receiver || !receiver.ws || receiver.ws.readyState !== receiver.ws.OPEN) {
        return;
    }
    
    receiver.ws.send("settings:::" + JSON.stringify(settingsJson));
}

async function receiveConnPacket(ws, msg){
    try {
        const message = msg.toString();
        
        const parts = message.split(":::");
        if(parts.length < 2) {
            return;
        }
        
        let clientId = parts[1].trim();

        await updateConnectionStatus(clientId, true);
        
        receivers.set(clientId, new Odbiornik(ws, "Test", 0));

        console.log(`Client ${clientId} connected`);
        
        requestUpdateFromClient(clientId);
        
    } catch (error) {
        console.error("Error in receiveConnPacket:", error);
        ws.send("error:::connection_failed");
    }
}

async function receiveTokenPacket(ws, msg){
    try {
        const message = msg.toString();
        const parts = message.split(":::");
        if(parts.length < 2) {
            return;
        }
        
        const token = parts[1].trim();
        
        const db = getDB();
        const [tokens] = await db.query(`
            SELECT t.*, u.group_id 
            FROM tokeny t
            LEFT JOIN users u ON t.id_owner = u.id
            WHERE t.token = ?
        `, [token]);
        
        if (tokens.length === 0) {
            ws.send("error:::invalid_token");
            console.log(`Invalid token attempt: ${token}`);
            return;
        }
        
        const tokenData = tokens[0];
        const groupId = tokenData.group_id || 0;
        
        let clientId = crypto.randomUUID();
        
        await db.query(
            `INSERT INTO telebimy_machine (uuid, name, is_connected, group_id) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             is_connected = ?, group_id = ?`,
            [clientId, 'Nowy telebim', 1, groupId, 1, groupId]
        );
        
        ws.send("settings:::" + JSON.stringify({uuid: clientId}));
        
        receivers.set(clientId, new Odbiornik(ws, "Nowy telebim", groupId));

        console.log(`Client ${clientId} connected with token ${token} (group: ${groupId})`);

        requestUpdateFromClient(clientId);
        
    } catch (error) {
        console.error("Error in receiveTokenPacket:", error);
        ws.send("error:::server_error");
    }
}

async function receiveUpdatePacket(ws, msg){
    try {
        const message = msg.toString();
        const parts = message.split(":::");
        if(parts.length < 2) return;
        
        const uuid = parts[1];

        try {
            const db = getDB();
            await db.query(
                `UPDATE telebimy_machine 
                 SET is_connected = 1 
                 WHERE uuid = ?`,
                [uuid]
            );
        } catch (updateError) {
            console.error("Błąd aktualizacji statusu:", updateError);
        }

        const db = getDB();

const [schedules] = await db.query(`
    SELECT * FROM harmonogramy 
    WHERE billboard_uuid = ?
      AND status = 'active'
    ORDER BY priority DESC, start_date ASC
`, [uuid]);

        const timedDisplayArray = [];

        const formatDateTime = (date) => {
            const pad = (n) => n.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
                   `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const currentWeekday = now.getDay() === 0 ? 7 : now.getDay();

        for (const schedule of schedules) {
            try {
                const startTime = new Date(schedule.start_date);
                const endTime = new Date(schedule.end_date);

                const isActiveInNext24h = startTime < next24h && endTime > now;

                if (!isActiveInNext24h) {
                    continue;
                }

                let repeatType = [1,2,3,4,5,6,7];
                try {
                    const parsed = JSON.parse(schedule.repeat_type);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        repeatType = parsed;
                    }
                } catch (e) {}

                if (!repeatType.includes(currentWeekday)) {
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

                const fromTime = formatDateTime(startTime);
                const toTime = formatDateTime(endTime);

                timedDisplayArray.push({
                    range: {
                        from: fromTime,
                        to: toTime
                    },
                    media: {
                        file: mediaFile || ""
                    },
                    priority: schedule.priority || 0
                });

            } catch (err) {
            }
        }

        const settings = {
            timedDisplay: JSON.stringify(timedDisplayArray)
        };

        sendDebugPacketToClient(uuid, `${timedDisplayArray.length}`);
        sendSettings(uuid, settings);
        requestUpdateFromClient(uuid);

    } catch (error) {
        console.error("Error in receiveUpdatePacket:", error);

        const message = msg.toString();
        const parts = message.split(":::");
        if(parts.length >= 2) {
            const uuid = parts[1];
            sendSettings(uuid, {
                timedDisplay: "[]"
            });
        }
    }
    return 0;
}

process.on('uncaughtException', async (error) => {
    console.error('Nieoczekiwany błąd:', error);
    
    for (const [uuid, receiver] of receivers.entries()) {
        try {
            await updateConnectionStatus(uuid, false);
        } catch (err) {
            console.error(`Nie udało się zaktualizować statusu dla ${uuid}:`, err);
        }
    }
});

export async function gracefulShutdown() {
    console.log('Bezpieczne zamykanie serwera...');
    
    for (const [uuid, receiver] of receivers.entries()) {
        try {
            await updateConnectionStatus(uuid, false);
            receiver.ws.close();
        } catch (err) {
            console.error(`Błąd przy zamykaniu ${uuid}:`, err);
        }
    }
    
    console.log('Wszystkie połączenia zamknięte');
}