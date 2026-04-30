// ============================= IMPERSONACJA ===========================
window.checkImpersonationStatus = async function() {
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) return null;
    
    const userData = await response.json();
    window.currentUser = userData;
    
    const isRoot = userData.ranga === 'root';
    
    if (window.impersonateTile) {
      window.impersonateTile.style.display = isRoot ? 'flex' : 'none';
    }
    
    const companiesTile = document.getElementById('companiesTile');
    if (companiesTile && window.currentUser) {
      companiesTile.style.display = window.currentUser.ranga === 'root' ? 'flex' : 'none';
    }
    
    window.updateDashboardHeader(userData);
    
    if (userData.isImpersonating && userData.originalUser) {
      window.showImpersonationBanner(userData);
    } else {
      window.hideImpersonationBanner();
    }
    
    return userData;
  } catch (err) {
    console.error('Błąd sprawdzania statusu impersonacji:', err);
    return null;
  }
}

window.updateDashboardHeader = function(userData) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
    
  const header = document.querySelector('.dashboard-header h1');
  const subtitle = document.getElementById('dashboardSubtitle');
  
  if (!header || !subtitle) return;
  
  if (userData.isImpersonating) {
    header.textContent = t.dashboardTitle;
    
    const isCompanyImpersonation = userData.originalUser && 
      (userData.originalUser.impersonation_type === 'company' || 
       userData.originalUser.company_name);
    
    if (isCompanyImpersonation) {
      const companyName = userData.originalUser.company_name || 
                         userData.originalUser.firma || 
                         'Nieznana firma';
      subtitle.innerHTML = `
        <strong>${t.impersonatingAsCompany}: ${window.escapeHtml(companyName)}</strong><br>
        <small>${t.companyRootAccessNote}</small>
      `;
    } else {
      subtitle.innerHTML = `
        <strong>${t.currentlyViewing} ${window.escapeHtml(userData.name)} (${userData.ranga})</strong><br>
        <small>${t.loggedAsRoot} ${window.escapeHtml(userData.originalUser.name)}</small>
      `;
    }
  } else {
    header.textContent = t.dashboardTitle;
    subtitle.textContent = `${t.impersonateWelcome} ${window.escapeHtml(userData.name)} (${userData.ranga})`;
  }
}

window.showImpersonationBanner = function(userData) {
  if (!window.impersonationBanner) return;
  
  const bannerImpersonatedUser = document.getElementById('bannerImpersonatedUser');
  const bannerRootUser = document.getElementById('bannerRootUser');
  
  if (bannerImpersonatedUser) {
    const isCompanyImpersonation = userData.originalUser && 
      (userData.originalUser.impersonation_type === 'company' || 
       userData.originalUser.company_name);
    
    if (isCompanyImpersonation) {
      const companyName = userData.originalUser.company_name || 
                         userData.originalUser.firma || 
                         'Nieznana firma';
      bannerImpersonatedUser.textContent = companyName;
    } else {
      bannerImpersonatedUser.textContent = `${userData.name} (${userData.ranga})`;
    }
  }
  
  if (bannerRootUser) {
    bannerRootUser.textContent = userData.originalUser.name;
  }
  
  window.impersonationBanner.style.display = 'block';
}

window.hideImpersonationBanner = function() {
  if (window.impersonationBanner) {
    window.impersonationBanner.style.display = 'none';
  }
}

// ============================= PRZEŁĄCZANIE ZAKŁADEK ===========================
window.switchImpersonationTab = function(tabName) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const companiesTab = document.getElementById('impersonateTabCompanies');
  const usersTab = document.getElementById('impersonateTabUsers');
  const companiesContent = document.getElementById('impersonateCompanyList');
  const usersContent = document.getElementById('impersonateUserList');
  const companiesHelp = document.getElementById('impersonateHelpCompanies');
  const usersHelp = document.getElementById('impersonateHelpUsers');
  
  if (!companiesTab || !usersTab || !companiesContent || !usersContent) return;
  
  companiesTab.classList.remove('active');
  usersTab.classList.remove('active');
  companiesTab.style.color = 'var(--text-secondary)';
  companiesTab.style.background = 'transparent';
  companiesTab.style.borderBottom = 'none';
  usersTab.style.color = 'var(--text-secondary)';
  usersTab.style.background = 'transparent';
  usersTab.style.borderBottom = 'none';
  
  companiesContent.style.display = 'none';
  usersContent.style.display = 'none';
  if (companiesHelp) companiesHelp.style.display = 'none';
  if (usersHelp) usersHelp.style.display = 'none';
  
  if (tabName === 'companies') {
    companiesTab.classList.add('active');
    companiesTab.style.color = 'var(--primary)';
    companiesTab.style.background = 'var(--bg-primary)';
    companiesTab.style.borderBottom = '3px solid var(--primary)';
    companiesContent.style.display = 'block';
    if (companiesHelp) {
      companiesHelp.style.display = 'block';
    }
    window.loadCompaniesForImpersonation();
  } else {
    usersTab.classList.add('active');
    usersTab.style.color = 'var(--primary)';
    usersTab.style.background = 'var(--bg-primary)';
    usersTab.style.borderBottom = '3px solid var(--primary)';
    usersContent.style.display = 'block';
    if (usersHelp) {
      usersHelp.style.display = 'block';
    }
    window.loadUsersForImpersonation();
  }
}

window.updateImpersonationModalTexts = function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modalTitle = document.querySelector('#impersonateModal h2');
  if (modalTitle) {
    modalTitle.textContent = t.impersonateModalTitle;
  }
  
  const companiesTab = document.getElementById('impersonateTabCompanies');
  const usersTab = document.getElementById('impersonateTabUsers');
  
  if (companiesTab) {
    companiesTab.innerHTML = `<span>🏢</span> ${t.impersonateCompaniesTab}`;
  }
  
  if (usersTab) {
    usersTab.innerHTML = `<span>👥</span> ${t.impersonateUsersTab}`;
  }
  
  const companiesHelp = document.getElementById('impersonateHelpCompanies');
  const usersHelp = document.getElementById('impersonateHelpUsers');
  
  if (companiesHelp) {
    companiesHelp.textContent = t.impersonateHelpcompany || t.impersonateHelp;
  }
  
  if (usersHelp) {
    usersHelp.textContent = t.impersonateHelp;
  }
  
  const exitImpersonateBtn = document.getElementById('exitImpersonateBtn');
  if (exitImpersonateBtn) {
    exitImpersonateBtn.textContent = t.exitImpersonateBtn;
  }
  
  const exitImpersonateBannerBtn = document.getElementById('exitImpersonateBannerBtn');
  if (exitImpersonateBannerBtn) {
    exitImpersonateBannerBtn.textContent = t.exitImpersonateBtn;
  }
  
  const closeImpersonateModalBtn = document.getElementById('closeImpersonateModal');
  if (closeImpersonateModalBtn) {
    closeImpersonateModalBtn.textContent = t.closeBtn;
  }
}

window.loadCompaniesForImpersonation = async function() {
  const companiesList = document.getElementById('impersonateCompanyList');
  if (!companiesList) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  try {
    companiesList.innerHTML = `<p style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">${t.loading}</p>`;
    
    const response = await fetch('/api/impersonate/check-extended', { credentials: 'include' });
    if (!response.ok) throw new Error('Błąd pobierania listy firm');
    
    const data = await response.json();
    
    if (!data.canImpersonate) {
      companiesList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 15px;">🔒</div>
          <h3>${t.accessDenied}</h3>
          <p>${data.reason || t.noPermissionImpersonate}</p>
        </div>
      `;
      return;
    }
    
    if (!data.availableCompanies || data.availableCompanies.length === 0) {
      companiesList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 15px;">🏢</div>
          <h3>${t.noneFound}</h3>
          <p>${t.noCompaniesForImpersonation}</p>
        </div>
      `;
      return;
    }
    
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">';
    html += `
      <thead>
        <tr>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.companyName}</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.companyUsersCount}</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.companyStatus}</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.companyAction}</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    const userResponse = await fetch('/api/me', { credentials: 'include' });
    const userData = await userResponse.json();
    
    for (const company of data.availableCompanies) {
      const isCurrentCompany = userData.isImpersonating && 
        userData.originalUser && 
        userData.originalUser.impersonation_type === 'company' &&
        userData.originalUser.company_id == company.id;
      
      html += `
        <tr style="${isCurrentCompany ? 'background-color: rgba(245, 158, 11, 0.1);' : ''}">
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            <strong style="font-size: 15px;">${window.escapeHtml(company.name)}</strong>
            ${isCurrentCompany ? `<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${t.currentlyActive}</span>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            <span style="color: var(--text-primary); font-weight: 600;">${company.user_count}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            ${company.available_owner ? 
              `<span style="color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                <span>✅</span> ${t.companyOwnerAvailable}
              </span>` : 
              `<span style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                <span>⚠️</span> ${t.companyOwnerUnavailable}
              </span>`}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border); text-align: center;">
            ${isCurrentCompany ? 
              `<span style="color: var(--text-secondary); font-size: 13px;">${t.currentlyViewing}</span>` : 
              `<button class="tile-btn impersonate-company-btn" 
                data-company-id="${company.id}" 
                data-company-name="${window.escapeHtml(company.name)}" 
                style="background-color: ${company.available_owner ? '#10b981' : '#8b5cf6'}; padding: 8px 16px; font-size: 13px; min-width: 120px;">
                ${company.available_owner ? t.companyViewAsOwnerBtn : t.impersonateCompanyBtn}
              </button>`}
          </td>
        </tr>
      `;
    }
    
    html += '</tbody></table>';
    companiesList.innerHTML = html;
    
    document.querySelectorAll('.impersonate-company-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const companyId = this.getAttribute('data-company-id');
        const companyName = this.getAttribute('data-company-name');
        window.startCompanyImpersonation(companyId, companyName);
      });
    });
    
  } catch (err) {
    console.error('Błąd ładowania listy firm do impersonacji:', err);
    companiesList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <h3>${t.error}</h3>
        <p>${t.errorLoading}</p>
        <button onclick="window.loadCompaniesForImpersonation()" class="tile-btn" style="margin-top: 15px;">
          ${t.retryBtn}
        </button>
      </div>
    `;
  }
}

window.loadUsersForImpersonation = async function() {
  const usersList = document.getElementById('impersonateUserList');
  if (!usersList) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  try {
    usersList.innerHTML = `<p style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">${t.loading}</p>`;
    
    const response = await fetch('/api/impersonate/check-extended', { credentials: 'include' });
    if (!response.ok) throw new Error('Błąd pobierania listy użytkowników');
    
    const data = await response.json();
    
    if (!data.canImpersonate) {
      usersList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 15px;">🔒</div>
          <h3>${t.accessDenied}</h3>
          <p>${data.reason || t.noPermissionImpersonate}</p>
        </div>
      `;
      return;
    }
    
    if (data.availableUsers.length === 0) {
      usersList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 15px;">👥</div>
          <h3>${t.noneFound}</h3>
          <p>${t.noUsersForImpersonation}</p>
        </div>
      `;
      return;
    }
    
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">';
    html += `
      <thead>
        <tr>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.tableUserName}</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.companyName}</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.tableUserRole}</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--border); background: var(--bg-secondary);">${t.tableUserActions}</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    const userResponse = await fetch('/api/me', { credentials: 'include' });
    const userData = await userResponse.json();
    
    data.availableUsers.forEach(user => {
      const isCurrentImpersonated = userData.isImpersonating && 
        userData.originalUser.impersonation_type !== 'company' && 
        userData.id === user.id;
      
      html += `
        <tr style="${isCurrentImpersonated ? 'background-color: rgba(245, 158, 11, 0.1);' : ''}">
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            <strong style="font-size: 15px;">${window.escapeHtml(user.name)}</strong>
            ${isCurrentImpersonated ? `<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${t.currentlyActive}</span>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            ${user.firma_nazwa ? `<span style="color: var(--text-secondary);">${window.escapeHtml(user.firma_nazwa)}</span>` : '<span style="color: var(--text-secondary);">—</span>'}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            <span style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; 
              ${user.ranga === 'owner' ? 'background-color: rgba(139, 92, 246, 0.2); color: #8b5cf6;' : 
                user.ranga === 'admin' ? 'background-color: rgba(59, 130, 246, 0.2); color: #3b82f6;' : 
                'background-color: rgba(107, 114, 128, 0.2); color: #6b7280;'}">
              ${t['role' + user.ranga.charAt(0).toUpperCase() + user.ranga.slice(1)] || user.ranga}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border); text-align: center;">
            ${isCurrentImpersonated ? 
              `<span style="color: var(--text-secondary); font-size: 13px;">${t.currentlyViewing}</span>` : 
              `<button class="tile-btn impersonate-user-btn" data-user-id="${user.id}" data-user-name="${window.escapeHtml(user.name)}" 
                style="background-color: #8b5cf6; padding: 8px 16px; font-size: 13px; min-width: 120px;">
                ${t.impersonateUserBtn}
              </button>`}
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    usersList.innerHTML = html;
    
    document.querySelectorAll('.impersonate-user-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const userId = this.getAttribute('data-user-id');
        const userName = this.getAttribute('data-user-name');
        window.startImpersonation(userId, userName);
      });
    });
    
  } catch (err) {
    console.error('Błąd ładowania listy użytkowników do impersonacji:', err);
    usersList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <h3>${t.error}</h3>
        <p>${t.errorLoading}</p>
        <button onclick="window.loadUsersForImpersonation()" class="tile-btn" style="margin-top: 15px;">
          ${t.retryBtn}
        </button>
      </div>
    `;
  }
}

window.startImpersonation = async function(userId, userName) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const confirmMessage = t.impersonateConfirm.replace('{userName}', userName);
  
  const modal = window.createModal(
    t.confirmTitle,
    `
      <div style="padding: 15px 0;">
        <p style="margin-bottom: 20px; color: var(--text-primary); font-size: 16px;">
          ${confirmMessage}
        </p>
      </div>
    `,
    [
      {
        id: 'confirmImpersonate',
        text: t.confirmBtn,
        class: 'primary'
      },
      {
        id: 'cancelImpersonate',
        text: t.cancelBtn,
        class: 'secondary'
      }
    ]
  );
  
  return new Promise((resolve) => {
    document.getElementById('confirmImpersonate').addEventListener('click', async () => {
      window.closeModal(modal);
      
      try {
        const response = await fetch(`/api/impersonate/${userId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t.error);
        }
        
        const data = await response.json();
        
        window.showToast(`${t.currentlyViewing} użytkownika "${userName}"`, 'success');
        
        if (window.impersonateModal) {
          window.impersonateModal.style.display = 'none';
        }
        
        setTimeout(() => {
          window.checkImpersonationStatus();
          window.updateLanguage(window.getCookie("language") || "pl");
          window.refreshAllOpenModals();
        }, 500);
        
      } catch (err) {
        console.error('Błąd rozpoczynania impersonacji:', err);
        window.showToast(err.message || t.error, 'error');
      }
    });
    
    document.getElementById('cancelImpersonate').addEventListener('click', () => {
      window.closeModal(modal);
      resolve(false);
    });
  });
}

window.startCompanyImpersonation = async function(companyId, companyName) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const confirmMessage = t.impersonateCompanyConfirm.replace('{companyName}', companyName);
  
  const modal = window.createModal(
    t.confirmTitle,
    `
      <div style="padding: 15px 0;">
        <p style="margin-bottom: 20px; color: var(--text-primary); font-size: 16px;">
          ${confirmMessage}
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.1); padding: 10px 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 15px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>${t.companyRootAccessNote}</strong>
          </p>
        </div>
      </div>
    `,
    [
      {
        id: 'confirmCompanyImpersonate',
        text: t.confirmCompanyImpersonateBtn,
        class: 'primary'
      },
      {
        id: 'cancelImpersonate',
        text: t.cancelBtn,
        class: 'secondary'
      }
    ]
  );
  
  return new Promise((resolve) => {
    document.getElementById('confirmCompanyImpersonate').addEventListener('click', async () => {
      window.closeModal(modal);
      
      try {
        const response = await fetch(`/api/impersonate/company/${encodeURIComponent(companyId)}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t.error);
        }
        
        const data = await response.json();
        
        window.showToast(`${t.impersonatingAsCompany}: "${companyName}"`, 'success');
        
        if (window.impersonateModal) {
          window.impersonateModal.style.display = 'none';
        }
        
        setTimeout(() => {
          window.checkImpersonationStatus();
          window.updateLanguage(window.getCookie("language") || "pl");
          window.refreshAllOpenModals();
        }, 500);
        
      } catch (err) {
        console.error('Błąd rozpoczynania podglądu firmy:', err);
        window.showToast(err.message || t.error, 'error');
      }
    });
    
    document.getElementById('cancelImpersonate').addEventListener('click', () => {
      window.closeModal(modal);
      resolve(false);
    });
  });
}

window.exitImpersonation = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modal = window.createModal(
    t.confirmTitle,
    `
      <div style="padding: 15px 0;">
        <p style="margin-bottom: 20px; color: var(--text-primary); font-size: 16px;">
          ${t.exitImpersonateConfirm}
        </p>
      </div>
    `,
    [
      {
        id: 'confirmExitImpersonate',
        text: t.confirmBtn,
        class: 'primary'
      },
      {
        id: 'cancelExitImpersonate',
        text: t.cancelBtn,
        class: 'secondary'
      }
    ]
  );
  
  return new Promise((resolve) => {
    document.getElementById('confirmExitImpersonate').addEventListener('click', async () => {
      window.closeModal(modal);
      
      try {
        const response = await fetch('/api/impersonate/exit', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || t.error);
        }
        
        window.showToast(t.returnToRoot, 'success');
        
        setTimeout(() => {
          window.checkImpersonationStatus();
          window.updateLanguage(window.getCookie("language") || "pl");
          window.refreshAllOpenModals();
          
          if (window.impersonateModal) {
            window.impersonateModal.style.display = 'none';
          }
        }, 500);
        
      } catch (err) {
        console.error('Błąd kończenia impersonacji:', err);
        window.showToast(err.message || t.error, 'error');
      }
    });
    
    document.getElementById('cancelExitImpersonate').addEventListener('click', () => {
      window.closeModal(modal);
      resolve(false);
    });
  });
}

window.refreshAllOpenModals = function() {
  if (window.scheduleModal && window.scheduleModal.style.display === 'flex') {
    if (typeof window.loadBillboardsForSchedule === 'function') {
      window.loadBillboardsForSchedule();
    }
  }
  
  if (window.usersModal && window.usersModal.style.display === 'flex') {
    if (typeof window.loadUsers === 'function') {
      window.loadUsers();
    }
  }
  
  if (window.groupsModal && window.groupsModal.style.display === 'flex') {
    if (typeof window.loadGroups === 'function') {
      window.loadGroups();
    }
  }
  
  if (window.billboardsModal && window.billboardsModal.style.display === 'flex') {
    if (typeof window.loadBillboards === 'function') {
      window.loadBillboards();
    }
  }
}

// ============================= INITIALIZATION ===========================
if (typeof window.updateLanguage === 'function') {
  const originalUpdateLanguage = window.updateLanguage;
  window.updateLanguage = function(lang) {
    originalUpdateLanguage(lang);
    window.updateImpersonationModalTexts();
  };
}

window.initializeImpersonationModal = function() {
  console.log('🔧 Inicjalizacja modala impersonate...');
  
  const companiesTab = document.getElementById('impersonateTabCompanies');
  const usersTab = document.getElementById('impersonateTabUsers');
  
  if (companiesTab && usersTab) {
    console.log('✅ Znaleziono zakładki impersonate');
    
    companiesTab.addEventListener('click', function() {
      console.log('📁 Przełączanie na widok firm');
      window.switchImpersonationTab('companies');
    });
    
    usersTab.addEventListener('click', function() {
      console.log('👤 Przełączanie na widok użytkowników');
      window.switchImpersonationTab('users');
    });
    
    window.updateImpersonationModalTexts();
  }
  
  const exitImpersonateBtn = document.getElementById('exitImpersonateBtn');
  if (exitImpersonateBtn) {
    exitImpersonateBtn.addEventListener('click', function() {
      if (typeof window.exitImpersonation === 'function') {
        window.exitImpersonation();
      }
    });
  }
  
  const exitImpersonateBannerBtn = document.getElementById('exitImpersonateBannerBtn');
  if (exitImpersonateBannerBtn) {
    exitImpersonateBannerBtn.addEventListener('click', function() {
      if (typeof window.exitImpersonation === 'function') {
        window.exitImpersonation();
      }
    });
  }
  
  const openImpersonateBtn = document.getElementById('openImpersonateBtn');
  if (openImpersonateBtn) {
    openImpersonateBtn.addEventListener('click', function() {
      console.log('🎯 Otwieranie modala impersonate');
      setTimeout(() => {
        window.switchImpersonationTab('companies');
      }, 100);
    });
  }
};