// ============================= USERS ===========================
window.loadUsers = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (window.usersModal) {
    window.usersModal.style.display = "flex";
  }

  if (window.usersList) {
    window.usersList.innerHTML = `<p>${t.loading}</p>`;
  }

  try {
    const res = await fetch("/api/userslist");
    if (!res.ok) {
      if (res.status === 403) {
        window.showToast(t.accessDenied, "error");
        return;
      }
      throw new Error("Błąd serwera");
    }
    
    const users = await res.json();

    if (window.connectedUsersCount) {
      window.connectedUsersCount.textContent = users.length;
    }
    
    if (!users || users.length === 0) {
      if (window.usersList) {
        window.usersList.innerHTML = `<p>${t.noneFound}</p>`;
      }
      return;
    }

    const showActionsColumn = window.currentUser && window.currentUser.ranga !== "user";
    const showGroupColumn = window.currentUser && (window.currentUser.ranga === "root" || window.currentUser.ranga === "owner");
    const showCompanyColumn = window.currentUser && window.currentUser.ranga === "root";

    if (window.usersList) {
      window.usersList.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>${t.tableUserName}</th>
              <th>${t.tableUserRole}</th>
              ${showGroupColumn ? `<th>${t.tableUserGroup}</th>` : ''}
              ${showCompanyColumn ? `<th>Firma</th>` : ''}
              ${showActionsColumn ? `<th>${t.tableUserActions}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => {
              let showEdit = false;

              if (!window.currentUser) {
                showEdit = false;
              } else if (window.currentUser.ranga === "user") {
                showEdit = false;
              } else if (window.currentUser.id === u.id) {
                showEdit = true;
              } else if (window.currentUser.ranga === "root") {
                if (u.ranga !== "root") {
                  showEdit = true;
                }
              } else if (window.currentUser.ranga === "owner" && u.group_id === window.currentUser.group_id) {
                showEdit = true;
              } else if (window.currentUser.ranga === "admin" && u.group_id === window.currentUser.group_id) {
                if (u.ranga === "user") {
                  showEdit = true;
                }
              }

              let groupsHtml = '';
              let companyHtml = '';
              
              if (showGroupColumn) {
                const additionalGroups = (u.additional_groups || [])
                  .map(groupId => ({
                    id: groupId,
                    name: u.all_groups_names && u.all_groups_names[groupId] ? u.all_groups_names[groupId] : `Grupa ${groupId}`
                  }))
                  .filter(group => group.name.toLowerCase() !== 'root');
                
                const isPrimaryGroupRoot = u.group_name && u.group_name.toLowerCase() === 'root';
                const totalGroupsCount = additionalGroups.length + (u.group_id && !isPrimaryGroupRoot ? 1 : 0);
                
                if (u.group_id && u.group_name && !isPrimaryGroupRoot) {
                  groupsHtml += `<span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 5px; padding: 2px 8px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap;">
                    ⭐ ${u.group_name}
                  </span>`;
                }
                
                if (additionalGroups.length > 0) {
                  if (totalGroupsCount <= 3) {
                    additionalGroups.forEach((group) => {
                      groupsHtml += `<span style="display: inline-flex; align-items: center; gap: 4px; margin-right: 5px; padding: 2px 8px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap;">
                        ${group.name}
                      </span>`;
                    });
                  } else {
                    groupsHtml += `<button type="button" class="additional-groups-btn" data-user-id="${u.id}" style="display: inline-flex; align-items: center; gap: 4px; margin-right: 5px; padding: 2px 10px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                      <span>+${additionalGroups.length} ${t.additional || 'dodatkowe'}</span>
                    </button>`;
                  }
                }
              }
              
              if (showCompanyColumn && u.firma_nazwa) {
                companyHtml = `<span style="padding: 2px 8px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; font-size: 12px; font-weight: 500;">${u.firma_nazwa}</span>`;
              }

              return `
                <tr>
                  <td>${u.name} ${window.currentUser && window.currentUser.id === u.id ? '<span style="color: var(--primary); font-weight: bold;">' + t.usersTag + '</span>' : ''}</td>
                  <td>${u.ranga}</td>
                  ${showGroupColumn ? `<td>${groupsHtml || t.none}</td>` : ''}
                  ${showCompanyColumn ? `<td>${companyHtml || t.none}</td>` : ''}
                  ${showActionsColumn ? `<td style="cursor:pointer; text-align:center;">${showEdit ? '✏️' : ''}</td>` : ''}
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }

    if (showActionsColumn) {
      document.querySelectorAll("#usersList tbody tr").forEach((row, i) => {
        const actionCellIndex = showGroupColumn ? (showCompanyColumn ? 4 : 3) : (showCompanyColumn ? 3 : 2);
        const td = row.cells[actionCellIndex];
        if (td && td.textContent.trim() !== "") {
          td.addEventListener("click", () => {
            if (window.currentUser && window.currentUser.ranga !== "user") {
              window.openUserActions(users[i]);
            }
          });
        }
      });
    }

    document.querySelectorAll('.additional-groups-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const userId = this.getAttribute('data-user-id');
        const user = users.find(u => u.id == userId);
        if (user) {
          window.showAdditionalGroupsModal(user);
        }
      });
    });

  } catch (err) {
    if (window.usersList) {
      window.usersList.innerHTML = `<p>${t.errorLoading}</p>`;
    }
    console.error(err);
  }
}

// ============================= MODAL DODATKOWYCH GRUP ===========================
window.showAdditionalGroupsModal = function(user) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const additionalGroups = (user.additional_groups || [])
    .map(groupId => ({
      id: groupId,
      name: user.all_groups_names && user.all_groups_names[groupId] ? user.all_groups_names[groupId] : `Grupa ${groupId}`
    }))
    .filter(group => group.name.toLowerCase() !== 'root');
  
  if (additionalGroups.length === 0) {
    window.showToast(t.userGroupsNoAdditional, "info");
    return;
  }
  
  const groupsHtml = additionalGroups.map(group => {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin-bottom: 6px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border);">
        <span style="font-weight: 500; color: var(--text);">${group.name}</span>
        <span style="font-size: 11px; color: var(--text-secondary); padding: 1px 6px; background: var(--bg); border-radius: 10px;">ID: ${group.id}</span>
      </div>
    `;
  }).join('');
  
  const modal = window.createModal(
    `${t.userGroupsAdditional} - ${user.name}`,
    `
      <div style="margin-bottom: 15px; font-size: 14px; color: var(--text-secondary);">
        ${user.name} ${t.has || 'ma'} ${additionalGroups.length} ${t.userGroupsAdditional.toLowerCase()}:
      </div>
      <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
        ${groupsHtml}
      </div>
      <div style="margin-top: 15px; padding: 10px; background: var(--info-bg, #e0f2fe); border-radius: 6px; font-size: 12px; color: var(--info-text, #0369a1);">
        ℹ️ ${t.userGroupsPrimary}: 
        <strong>${user.group_name || user.group_id || t.none}</strong> 
        ${user.group_name && user.group_name.toLowerCase() !== 'root' ? '⭐' : ''}
      </div>
    `,
    [
      { id: "closeAdditionalGroupsBtn", text: t.closeBtn, class: "cancel-btn" }
    ]
  );

  modal.querySelector("#closeAdditionalGroupsBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
};

// ============================= ZMIANA FIRMY UŻYTKOWNIKA ===========================
window.changeUserCompany = async function() {
  if (!window.selectedUser) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (window.currentUser.ranga !== "root") {
    window.showToast("Tylko root może zmieniać firmę użytkownika", "error");
    return;
  }
  
  try {
    const response = await fetch(`/api/user/${window.selectedUser.id}/company`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error("Błąd pobierania danych firmy");
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Błąd pobierania danych");
    }
    
    const companyOptions = data.companies.map(company => 
      `<option value="${company.id}" ${data.user.firma_id == company.id ? 'selected' : ''}>
        ${company.name}
      </option>`
    ).join('');
    
    const modalHTML = `
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 15px; color: var(--text-secondary);">
          Wybierz firmę dla użytkownika <strong>${data.user.username}</strong>
        </p>
        
        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
          Firma
        </label>
        <select id="userCompanySelect" class="modal-select">
          <option value="">${t.none} (${t.withoutCompany})</option>
          ${companyOptions}
        </select>
        
        <div style="margin-top: 15px; padding: 10px; background: var(--info-bg); border-radius: 6px; font-size: 12px; color: var(--info-text);">
          ℹ️ ${t.current}: <strong>${data.user.firma_nazwa || t.none}</strong>
        </div>
      </div>
    `;

    const modal = window.createModal(
      `${t.changeCompanyBtn}: ${window.selectedUser.name}`,
      modalHTML,
      [
        { id: "saveUserCompanyBtn", text: t.saveBtn, class: "save-btn" },
        { id: "cancelUserCompanyBtn", text: t.cancelBtn, class: "cancel-btn" }
      ]
    );
    
    modal.querySelector("#saveUserCompanyBtn").addEventListener("click", async () => {
      const selectedCompanyId = modal.querySelector("#userCompanySelect").value;
      
      const saveBtn = modal.querySelector("#saveUserCompanyBtn");
      const cancelBtn = modal.querySelector("#cancelUserCompanyBtn");
      
      const originalText = saveBtn.textContent;
      saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saveBtn}...`;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      
      try {
        const response = await fetch(`/api/user/${window.selectedUser.id}/company`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ firma_id: selectedCompanyId || null })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Błąd zmiany firmy");
        }
        
        const result = await response.json();
        
        window.closeModal(modal);
        if (window.userActionsModal) {
          window.userActionsModal.style.display = "none";
        }
        window.showToast("Firma użytkownika zmieniona", "success");
        window.loadUsers();
        
      } catch (err) {
        window.showToast(err.message, "error");
        
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });
    
    modal.querySelector("#cancelUserCompanyBtn").addEventListener("click", () => window.closeModal(modal));
    modal.addEventListener("click", e => { 
      if(e.target === modal) window.closeModal(modal); 
    });
    
  } catch (err) {
    console.error("Błąd zmiany firmy użytkownika:", err);
    window.showToast(err.message, "error");
  }
};

// ============================= OTWIERANIE AKCJI UŻYTKOWNIKA ===========================
window.openUserActions = function(user) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  window.selectedUser = user;

  if (window.actionUsername) {
    window.actionUsername.textContent = `${t.userActionsTitle} ${user.name} ${window.currentUser && window.currentUser.id === user.id ? t.usersTag : ''}`;
  }

  if (window.changePasswordBtn) window.changePasswordBtn.style.display = "none";
  if (window.changeRoleBtn) window.changeRoleBtn.style.display = "none";
  if (window.changeGroupBtn) window.changeGroupBtn.style.display = "none";
  if (window.deleteUserBtn) window.deleteUserBtn.style.display = "none";
  if (window.changeCompanyBtn) window.changeCompanyBtn.style.display = "none";
  
  const renameUserBtn = document.getElementById("renameUserBtn");
  if (renameUserBtn) renameUserBtn.style.display = "none";
  
  const manageGroupsBtn = document.getElementById("manageGroupsBtn");
  if (!manageGroupsBtn) {
    const newManageGroupsBtn = document.createElement("button");
    newManageGroupsBtn.id = "manageGroupsBtn";
    newManageGroupsBtn.textContent = t.userGroupsTitle;
    newManageGroupsBtn.classList.add("modal-btn", "secondary-btn");
    newManageGroupsBtn.style.marginBottom = "10px";
    newManageGroupsBtn.addEventListener("click", window.manageUserGroups);
    
    if (window.userActionsModal) {
      const btnContainer = window.userActionsModal.querySelector('.modal-btn-container');
      if (btnContainer) {
        btnContainer.insertBefore(newManageGroupsBtn, btnContainer.firstChild);
      }
    }
  }

  let changeCompanyBtn = document.getElementById("changeCompanyBtn");
  if (!changeCompanyBtn) {
    changeCompanyBtn = document.createElement("button");
    changeCompanyBtn.id = "changeCompanyBtn";
    changeCompanyBtn.innerHTML = '<span class="btn-icon">🏢</span> ' + (t.changeCompanyBtn || "Zmień firmę");
    changeCompanyBtn.classList.add("modal-btn", "secondary-btn");
    changeCompanyBtn.style.marginBottom = "10px";
    changeCompanyBtn.style.display = "none";
    changeCompanyBtn.addEventListener("click", window.changeUserCompany);
    
    if (window.userActionsModal) {
      const btnContainer = window.userActionsModal.querySelector('.modal-btn-container');
      if (btnContainer) {
        const closeBtn = btnContainer.querySelector('#closeUserActions');
        if (closeBtn) {
          btnContainer.insertBefore(changeCompanyBtn, closeBtn);
        } else {
          btnContainer.appendChild(changeCompanyBtn);
        }
      }
    }
  }

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(window.currentUser.ranga);
  const userIndex = hierarchy.indexOf(user.ranga);

  if (window.currentUser.ranga === "user") {
    if (window.userActionsModal) {
      window.userActionsModal.style.display = "none";
    }
    window.showToast(t.noPermission, "error");
    return;
  }

  if (window.currentUser.ranga === "root") {
    if (user.ranga !== "root" || window.currentUser.id === user.id) {
      if (window.changePasswordBtn) window.changePasswordBtn.style.display = "block";
      if (window.changeRoleBtn) window.changeRoleBtn.style.display = "block";
      if (window.changeGroupBtn) window.changeGroupBtn.style.display = "block";
      if (window.deleteUserBtn) window.deleteUserBtn.style.display = "block";
      if (changeCompanyBtn) changeCompanyBtn.style.display = "block";
      if (window.currentUser.id !== user.id && renameUserBtn) renameUserBtn.style.display = "block";
    } else if (window.currentUser.id !== user.id) {
      if (window.changePasswordBtn) window.changePasswordBtn.style.display = "block";
      if (changeCompanyBtn) changeCompanyBtn.style.display = "block";
      if (renameUserBtn) renameUserBtn.style.display = "block";
    }
  } 
  else if (window.currentUser.ranga === "owner" && user.group_id === window.currentUser.group_id) {
    if (user.ranga === "admin" || user.ranga === "user") {
      if (window.changePasswordBtn) window.changePasswordBtn.style.display = "block";
      if (window.changeRoleBtn) window.changeRoleBtn.style.display = "block";
      if (window.changeGroupBtn) window.changeGroupBtn.style.display = "block";
      if (window.deleteUserBtn) window.deleteUserBtn.style.display = "block";
      if (renameUserBtn) renameUserBtn.style.display = "block";
      
      if (manageGroupsBtn) manageGroupsBtn.style.display = "block";
    } else {
      if (manageGroupsBtn) manageGroupsBtn.style.display = "none";
    }
  }
  else if (window.currentUser.ranga === "admin" && user.group_id === window.currentUser.group_id) {
    if (user.ranga === "user") {
      if (window.changePasswordBtn) window.changePasswordBtn.style.display = "block";
      if (window.changeRoleBtn) window.changeRoleBtn.style.display = "block";
      if (window.deleteUserBtn) window.deleteUserBtn.style.display = "block";
      if (renameUserBtn) renameUserBtn.style.display = "block";
    }
    
    if (manageGroupsBtn) manageGroupsBtn.style.display = "none";
  }

  if (window.currentUser.ranga === "owner" && (user.ranga === "owner" || user.ranga === "root")) {
    if (window.changeGroupBtn) window.changeGroupBtn.style.display = "none";
    if (changeCompanyBtn) changeCompanyBtn.style.display = "none";
  }

  if (window.currentUser.ranga === "root" && window.currentUser.id === user.id) {
    if (window.changeRoleBtn) window.changeRoleBtn.style.display = "none";
    if (window.changeGroupBtn) window.changeGroupBtn.style.display = "none";
    if (window.deleteUserBtn) window.deleteUserBtn.style.display = "none";
    if (changeCompanyBtn) changeCompanyBtn.style.display = "none";
    if (manageGroupsBtn) manageGroupsBtn.style.display = "none";
    if (renameUserBtn) renameUserBtn.style.display = "none";
  }

  if (renameUserBtn) {
    renameUserBtn.addEventListener("click", window.renameUser);
  }

  if (window.userActionsModal) {
    window.userActionsModal.style.display = "flex";
  }
};

// ============================= ZMIANA HASŁA (modal) ===========================
window.changeUserPassword = async function() {
  if (!window.selectedUser) return;
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const modal = window.createModal(
    `${t.changePasswordBtn}: ${window.selectedUser.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.enterNewPassword}</p>
      <input type="password" id="newPasswordInput" placeholder="${t.enterNewPassword}" class="modal-input" autocomplete="new-password"/>
    `,
    [
      { id: "savePasswordBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelPasswordBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.querySelector("#savePasswordBtn").addEventListener("click", async () => {
    const newPassword = modal.querySelector("#newPasswordInput").value.trim();
    
    if (!newPassword || newPassword.length < 3) {
      modal.querySelector("#newPasswordInput").style.borderColor = "var(--danger)";
      window.showToast(t.invalidPasswordLength, "error");
      return;
    }

    try {
      const res = await fetch(`/api/user/${window.selectedUser.id}/changepassword`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({password: newPassword})
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.changePasswordError);
      }

      window.closeModal(modal);
      if (window.userActionsModal) {
        window.userActionsModal.style.display = "none";
      }
      window.showToast(t.passwordChanged, "success");
      window.loadUsers();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelPasswordBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newPasswordInput");
    if (input) input.focus();
  }, 100);
}

// ============================= ZMIANA LOGINU (modal) ===========================
window.renameUser = async function() {
  if (!window.selectedUser) return;
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(window.currentUser.ranga);
  const userIndex = hierarchy.indexOf(window.selectedUser.ranga);
  
  if (window.currentUser.ranga === "user") {
    window.showToast(t.cannotEditYourself, "error");
    return;
  }
  
  if (currentIndex <= userIndex && window.currentUser.id !== window.selectedUser.id) {
    window.showToast(t.cannotEditSameOrHigherRank, "error");
    return;
  }

  const modal = window.createModal(
    `${t.renameBtn}: ${window.selectedUser.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.enterNewName}</p>
      <input type="text" id="newUsernameInput" value="${window.selectedUser.name}" class="modal-input" autocomplete="off"/>
    `,
    [
      { id: "saveUsernameBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelUsernameBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.querySelector("#saveUsernameBtn").addEventListener("click", async () => {
    const newUsername = modal.querySelector("#newUsernameInput").value.trim();
    
    if (!newUsername || newUsername.length < 2) {
      modal.querySelector("#newUsernameInput").style.borderColor = "var(--danger)";
      window.showToast(t.invalidNameLength, "error");
      return;
    }

    if (newUsername === window.selectedUser.name) {
      modal.querySelector("#newUsernameInput").style.borderColor = "var(--danger)";
      window.showToast("Podaj inną nazwę niż obecna", "info");
      return;
    }

    try {
      const res = await fetch(`/api/user/${window.selectedUser.id}/changename`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: newUsername})
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zmiany nazwy");
      }

      window.closeModal(modal);
      if (window.userActionsModal) {
        window.userActionsModal.style.display = "none";
      }
      window.showToast("Nazwa użytkownika zmieniona", "success");
      window.loadUsers();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelUsernameBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newUsernameInput");
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}
// ============================= ZMIANA RANGI (modal) ===========================
window.changeUserRole = async function() {
  if (!window.selectedUser) return;
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(window.currentUser.ranga);
  const userIndex = hierarchy.indexOf(window.selectedUser.ranga);
  
  if (window.currentUser.ranga === "user") {
    window.showToast(t.cannotEditYourself, "error");
    return;
  }
  
  if (currentIndex <= userIndex) {
    window.showToast(t.cannotEditSameOrHigherRank, "error");
    return;
  }

  let availableRoles = [];
  
  if (window.currentUser.ranga === "root") {
    if (window.selectedUser.ranga === "root" && window.currentUser.id !== window.selectedUser.id) {
      availableRoles = ["owner", "admin", "user"];
    } else if (window.selectedUser.ranga !== "root") {
      availableRoles = hierarchy.slice(0, currentIndex);
    } else {
      availableRoles = [];
    }
  } 

  else if (window.currentUser.ranga === "owner" && window.selectedUser.group_id === window.currentUser.group_id) {
    if (window.selectedUser.ranga === "admin" || window.selectedUser.ranga === "user") {
      availableRoles = ["user", "admin"];
    }
  }

  else if (window.currentUser.ranga === "admin" && window.selectedUser.group_id === window.currentUser.group_id) {
    if (window.selectedUser.ranga === "user") {
      availableRoles = ["user"];
    }
  }
  
  if (availableRoles.length === 0) {
    window.showToast(t.noPermission, "error");
    return;
  }

  const roleOptions = availableRoles.map(role => 
    `<option value="${role}" ${role === window.selectedUser.ranga ? 'selected' : ''}>
      ${role.charAt(0).toUpperCase() + role.slice(1)}
    </option>`
  ).join('');

  const modal = window.createModal(
    `${t.changeRoleBtn}: ${window.selectedUser.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.selectNewRole}</p>
      <select id="newRoleSelect" class="modal-select">
        <option value="" disabled>${t.selectNewRole}</option>
        ${roleOptions}
      </select>
    `,
    [
      { id: "saveRoleBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelRoleBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.querySelector("#saveRoleBtn").addEventListener("click", async () => {
    const newRole = modal.querySelector("#newRoleSelect").value;
    
    if (!newRole) {
      window.showToast(t.noRoleSelected, "error");
      return;
    }
    
    if (newRole === window.selectedUser.ranga) {
      window.showToast("Wybierz inną rangę niż obecna", "info");
      return;
    }
    
    if (!availableRoles.includes(newRole)) {
      window.showToast(t.noPermission, "error");
      return;
    }

    try {
      const res = await fetch(`/api/user/${window.selectedUser.id}/changerole`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ranga: newRole})
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.changeRoleError);
      }

      window.closeModal(modal);
      if (window.userActionsModal) {
        window.userActionsModal.style.display = "none";
      }
      window.showToast(t.roleChanged, "success");
      window.loadUsers();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelRoleBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
}

// ============================= ZMIANA GRUPY (modal) ===========================
window.changeUserGroup = async function() {
  if (!window.selectedUser) return;
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  let canChangeGroups = false;
  
  if (window.currentUser.ranga === "root") {
    canChangeGroups = true;
  } 
  else if (window.currentUser.ranga === "owner" && window.selectedUser.group_id === window.currentUser.group_id) {
    if (window.selectedUser.ranga === "admin" || window.selectedUser.ranga === "user") {
      canChangeGroups = true;
    }
  }
  
  if (!canChangeGroups) {
    window.showToast(t.onlyRootCanChangeGroups, "error");
    return;
  }

  try {
    const groupsRes = await fetch("/api/groupslist");
    const groups = await groupsRes.json();
    
    let availableGroups = [];
    
    if (window.currentUser.ranga === "root") {
      availableGroups = groups.filter(g => g.name !== "root");
    } 
    else if (window.currentUser.ranga === "owner") {
      const ownerGroupsRes = await fetch(`/api/user/${window.currentUser.id}/groups`, {
        credentials: 'include'
      });
      
      if (ownerGroupsRes.ok) {
        const ownerGroupsData = await ownerGroupsRes.json();
        if (ownerGroupsData.success) {
          const ownerAllGroups = [ownerGroupsData.primary_group_id, ...(ownerGroupsData.additional_groups || [])];
          availableGroups = groups.filter(g => 
            ownerAllGroups.includes(g.id) && 
            g.id !== window.selectedUser.group_id &&
            g.name !== "root"
          );
        }
      }
    }
    
    if (availableGroups.length === 0) {
      window.showToast(t.noGroupsAvailable, "error");
      return;
    }

    let modalContent = '';
    
    if (window.currentUser.ranga === "root") {
      const groupOptions = availableGroups.map(group => 
        `<option value="${group.id}" ${window.selectedUser.group_id === group.id ? 'selected' : ''}>
          ${group.name}
        </option>`
      ).join('');
      
      const currentAdditionalGroups = window.selectedUser.additional_groups || [];
      
      modalContent = `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsPrimary}
          </label>
          <select id="newGroupSelect" class="modal-select">
            <option value="" disabled>${t.selectNewGroup}</option>
            ${groupOptions}
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsAdditional} (${t.optional})
          </label>
          <div class="checkbox-group-container">
            <div id="additionalGroupsContainer" class="checkbox-group-scroll">
              ${availableGroups.map(group => `
                <div class="checkbox-item-modern">
                  <input type="checkbox" 
                         class="additional-group-checkbox" 
                         value="${group.id}" 
                         id="group_${group.id}"
                         ${currentAdditionalGroups.includes(group.id) ? 'checked' : ''}>
                  <div class="checkbox-custom"></div>
                  <label for="group_${group.id}" class="checkbox-label-modern">
                    ${group.name}
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } 
    else if (window.currentUser.ranga === "owner") {
      const currentAdditionalGroups = window.selectedUser.additional_groups || [];
      
      modalContent = `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsAdditional} (${t.optional})
          </label>
          <div class="checkbox-group-container">
            <div id="additionalGroupsContainer" class="checkbox-group-scroll">
              ${availableGroups.map(group => `
                <div class="checkbox-item-modern">
                  <input type="checkbox" 
                         class="additional-group-checkbox" 
                         value="${group.id}" 
                         id="group_${group.id}"
                         ${currentAdditionalGroups.includes(group.id) ? 'checked' : ''}>
                  <div class="checkbox-custom"></div>
                  <label for="group_${group.id}" class="checkbox-label-modern">
                    ${group.name}
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: var(--warning-bg); border-radius: 4px; font-size: 12px; color: var(--warning-text);">
          ⓘ ${t.ownerGroupsNote || "Możesz dodać/usuć tylko z dodatkowych grup użytkownika."}
        </div>
      `;
    }

    const modal = window.createModal(
      `${t.changeGroupBtn}: ${window.selectedUser.name}`,
      modalContent,
      [
        { id: "saveGroupBtn", text: t.saveBtn, class: "save-btn" },
        { id: "cancelGroupBtn", text: t.cancelBtn, class: "cancel-btn" }
      ]
    );

    modal.querySelector("#saveGroupBtn").addEventListener("click", async () => {
      if (window.currentUser.ranga === "root") {
        const newGroupId = modal.querySelector("#newGroupSelect").value;
        
        if (!newGroupId) {
          window.showToast(t.noGroupSelected, "error");
          return;
        }

        const selectedAdditionalGroups = Array.from(modal.querySelectorAll(".additional-group-checkbox:checked"))
          .map(cb => parseInt(cb.value))
          .filter(id => !isNaN(id));
        
        const saveBtn = modal.querySelector("#saveGroupBtn");
        const cancelBtn = modal.querySelector("#cancelGroupBtn");
        
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saveBtn}...`;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        
                try {
 const changeGroupRes = await fetch(`/api/user/${window.selectedUser.id}/groups/primary`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({group_id: parseInt(newGroupId)})
  });
          
          if (!changeGroupRes.ok) {
            const data = await changeGroupRes.json();
            throw new Error(data.error || t.changeGroupError);
          }
          
          const additionalGroupsRes = await fetch(`/api/user/${window.selectedUser.id}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ group_ids: selectedAdditionalGroups })
          });
          
          if (!additionalGroupsRes.ok) {
            const errorData = await additionalGroupsRes.json();
            throw new Error(errorData.error || t.userGroupsError);
          }
          
          window.closeModal(modal);
          if (window.userActionsModal) {
            window.userActionsModal.style.display = "none";
          }
          window.showToast(t.groupChanged, "success");
          window.loadUsers();
        } catch (err) {
          window.showToast(err.message, "error");
          
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      } 
      else if (window.currentUser.ranga === "owner") {
        const selectedGroups = Array.from(modal.querySelectorAll(".additional-group-checkbox:checked"))
          .map(cb => parseInt(cb.value))
          .filter(id => !isNaN(id));
        
        const saveBtn = modal.querySelector("#saveGroupBtn");
        const cancelBtn = modal.querySelector("#cancelGroupBtn");
        
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saveBtn}...`;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        
        try {
          const response = await fetch(`/api/user/${window.selectedUser.id}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ group_ids: selectedGroups })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t.userGroupsError);
          }
          
          const result = await response.json();
          
          window.closeModal(modal);
          if (window.userActionsModal) {
            window.userActionsModal.style.display = "none";
          }
          window.showToast(t.groupChanged, "success");
          window.loadUsers();
          
        } catch (err) {
          window.showToast(err.message, "error");
          
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      }
    });

    modal.querySelector("#cancelGroupBtn").addEventListener("click", () => window.closeModal(modal));
    modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });

  } catch (err) {
    window.showToast(t.loadGroupsError, "error");
    console.error(err);
  }
}

// ============================= USUWANIE USERA (modal) ===========================
window.deleteUser = async function() {
  if (!window.selectedUser) return;

  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  if (window.currentUser.ranga === "user") {
    window.showToast(t.noPermission, "error");
    return;
  }

  if (window.selectedUser.ranga === "root") {
    if (window.selectedUser.id === window.currentUser.id) {
      window.showToast(t.cannotDeleteRoot, "error");
      return;
    } else {
      window.showToast(t.cannotDeleteOtherRoot, "error");
      return;
    }
  }

  const hierarchy = ["user", "admin", "owner", "root"];
  const currentIndex = hierarchy.indexOf(window.currentUser.ranga);
  const userIndex = hierarchy.indexOf(window.selectedUser.ranga);
  
  if (currentIndex <= userIndex) {
    window.showToast(t.cannotEditSameOrHigherRank, "error");
    return;
  }

  const modal = window.createModal(
    t.deleteUserBtn,
    `
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 18px; margin-bottom: 10px; color: var(--text);">
          ${t.deleteUserConfirm} <strong>${window.selectedUser.name}</strong>?
        </p>
        <p style="color: var(--danger); margin-bottom: 0;">
          ⚠️ ${t.operationIrreversible}
        </p>
      </div>
    `,
    [
      { id: "confirmDeleteUserBtn", text: t.deleteBtn, class: "delete-btn" },
      { id: "cancelDeleteUserBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.querySelector("#confirmDeleteUserBtn").addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/user/${window.selectedUser.id}`, { method: "DELETE" });

      if (!res.ok) {
        let errorMsg = t.deleteUserError;
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      window.closeModal(modal);
      if (window.userActionsModal) {
        window.userActionsModal.style.display = "none";
      }
      window.showToast(t.userDeleted, "success");
      await window.loadUsers();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelDeleteUserBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
}

// ============================= DODAWANIE UŻYTKOWNIKA (modal) ===========================
window.openAddUserModal = function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  Promise.all([
    fetch("/api/groupslist").then(res => res.json()),
    window.currentUser.ranga === "root" ? fetch("/api/companieslist").then(res => res.json()) : Promise.resolve([])
  ])
    .then(([groups, companies]) => {
      if (groups.length === 0) {
        window.showToast(t.noGroupsError, "error");
        return;
      }
      
      const modal = document.createElement("div");
      modal.classList.add("modal-overlay");
      modal.id = "addUserModal";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      
      let modalHTML = `
        <div class="modal" style="max-width: 450px;">
          <h3>${t.addUserTitle}</h3>
          <input type="text" id="newUsername" placeholder="${t.addUserUsernamePlaceholder}" class="modal-input"/>
          <input type="password" id="newPassword" placeholder="${t.addUserPasswordPlaceholder}" class="modal-input"/>
          
          <select id="newRole" class="modal-select">
            <option value="" disabled selected>${t.addUserRolePlaceholder}</option>
      `;

      const hierarchy = ["user", "admin", "owner", "root"];
      
      if (window.currentUser.ranga === "root") {
        modalHTML += `
          <option value="owner">${t.roleOwner}</option>
          <option value="admin">${t.roleAdmin}</option>
          <option value="user">${t.roleUser}</option>
        `;
      } 
      else if (window.currentUser.ranga === "owner") {
        modalHTML += `
          <option value="admin">${t.roleAdmin}</option>
          <option value="user">${t.roleUser}</option>
        `;
      } 
      else if (window.currentUser.ranga === "admin") {
        modalHTML += `
          <option value="user">${t.roleUser}</option>
        `;
      }

      modalHTML += `</select>`;
      
      if (window.currentUser.ranga === "root") {
        modalHTML += `
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsPrimary}
          </label>
          <select id="newGroup" class="modal-select">
            <option value="" disabled selected>${t.addUserSelectGroupPlaceholder}</option>
            ${groups.filter(g => g.name !== "root").map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        `;
        
        modalHTML += `
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text); margin-top: 15px;">
            Firma (${t.optional})
          </label>
          <select id="newCompany" class="modal-select">
            <option value="" selected>${t.none} (${t.withoutCompany || 'bez firmy'})</option>
            ${companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        `;
        
        modalHTML += `
          <div class="checkbox-group-container" style="margin-top: 20px; padding: 15px; border-radius: 12px; border: 2px solid var(--border); background: var(--panel-bg);">
            <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 15px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px;">
              <span>${t.userGroupsAdditional}</span>
              <span style="font-size: 12px; color: var(--text-secondary); font-weight: 400;">(${t.optional})</span>
            </h4>
            <div id="additionalGroupsContainer" class="checkbox-group-scroll" style="max-height: 155px; overflow-y: auto; padding: 5px;">
              ${groups.filter(g => g.name !== "root").map(g => `
                <div class="checkbox-item-modern" style="margin-bottom: 8px; padding: 12px 14px; height: 48px; display: flex; align-items: center;">
                  <input type="checkbox" class="additional-group-checkbox" value="${g.id}" id="group_${g.id}">
                  <div class="checkbox-custom"></div>
                  <label for="group_${g.id}" class="checkbox-label-modern" style="font-size: 14px; line-height: 1.2;">
                    ${g.name}
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (window.currentUser.ranga === "owner") {
        modalHTML += `
          <input type="hidden" id="newGroup" value="${window.currentUser.group_id}">
          <input type="hidden" id="newCompany" value="${window.currentUser.firma || ''}">
        `;
        
        if (groups.filter(g => g.id !== window.currentUser.group_id).length > 0) {
          modalHTML += `
            <div class="checkbox-group-container" style="margin-top: 20px; padding: 15px; border-radius: 12px; border: 2px solid var(--border); background: var(--panel-bg);">
              <h4 style="margin-top: 0; margin-bottom: 15px; font-size: 15px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px;">
                <span>${t.userGroupsAdditional}</span>
                <span style="font-size: 12px; color: var(--text-secondary); font-weight: 400;">(${t.optional})</span>
              </h4>
              <div id="additionalGroupsContainer" class="checkbox-group-scroll" style="max-height: 155px; overflow-y: auto; padding: 5px;">
                ${groups.filter(g => g.id !== window.currentUser.group_id).map(g => `
                  <div class="checkbox-item-modern" style="margin-bottom: 8px; padding: 12px 14px; height: 48px; display: flex; align-items: center;">
                    <input type="checkbox" class="additional-group-checkbox" value="${g.id}" id="group_${g.id}">
                    <div class="checkbox-custom"></div>
                    <label for="group_${g.id}" class="checkbox-label-modern" style="font-size: 14px; line-height: 1.2;">
                      ${g.name}
                    </label>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      } else if (window.currentUser.ranga === "admin") {
        modalHTML += `
          <input type="hidden" id="newGroup" value="${window.currentUser.group_id}">
          <input type="hidden" id="newCompany" value="${window.currentUser.firma || ''}">
        `;
      }

      modalHTML += `
          <div class="modal-btn-container" style="margin-top: 25px;">
            <button id="saveNewUserBtn" class="modal-btn save-btn">${t.addBtn}</button>
            <button id="closeAddUserModal" class="modal-btn cancel-btn">${t.cancelBtn}</button>
          </div>
        </div>
      `;
      
      modal.innerHTML = modalHTML;
      document.body.appendChild(modal);

      modal.querySelector("#saveNewUserBtn").addEventListener("click", async () => {
        const username = modal.querySelector("#newUsername").value.trim();
        const password = modal.querySelector("#newPassword").value.trim();
        const role = modal.querySelector("#newRole").value;
        
        let groupId = null;
        let companyId = null;
        
        if (window.currentUser.ranga === "root") {
          groupId = modal.querySelector("#newGroup").value;
          companyId = modal.querySelector("#newCompany").value || null;
          
          if (!groupId) {
            window.showToast(t.validationError, "error");
            return;
          }
        } else {
          groupId = window.currentUser.group_id;
          companyId = window.currentUser.firma || null;
        }

        const additionalGroups = Array.from(modal.querySelectorAll(".additional-group-checkbox:checked"))
          .map(cb => parseInt(cb.value))
          .filter(id => !isNaN(id));

        if (!username || !password || !role || !groupId) {
          window.showToast(t.validationError, "error");
          return;
        }

        try {
          const res = await fetch("/api/useradd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              username: username, 
              password: password, 
              ranga: role,
              group_id: parseInt(groupId),
              additional_groups: additionalGroups,
              firma_id: companyId
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || t.addUserError);
          
          window.showToast(t.userAdded, "success");
          modal.remove();
          window.loadUsers();
          
        } catch (err) {
          window.showToast(err.message, "error");
          console.error(err);
        }
      });

      modal.querySelector("#closeAddUserModal").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    })
    .catch(err => {
      console.error(err);
      window.showToast(t.loadGroupsError, "error");
    });
};

// ============================= INIT EVENT LISTENERS ===========================
document.addEventListener('DOMContentLoaded', function() {
  if (window.openUsersBtn) {
    window.openUsersBtn.addEventListener("click", async () => {
      window.currentUser = await window.loadCurrentUser();
      if(!window.currentUser){ 
        window.showToast("Nie udało się pobrać danych aktualnego użytkownika. Zaloguj się ponownie.", "error"); 
        return; 
      }
      
      await window.loadUsers();

      if (window.currentUser.ranga !== "user" && !document.querySelector(".add-user-btn")) {
        const addUserBtn = document.createElement("button");
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        
        addUserBtn.textContent = t.addUserTitle;
        addUserBtn.classList.add("add-user-btn");
        addUserBtn.addEventListener("click", window.openAddUserModal);

        if (window.usersList && window.usersList.parentElement) {
          window.usersList.parentElement.insertBefore(addUserBtn, window.usersList);
        }
      }
    });
  }
  
  const renameUserBtn = document.getElementById("renameUserBtn");
  if (renameUserBtn) {
    renameUserBtn.addEventListener("click", window.renameUser);
  }
    
  if (window.changePasswordBtn) {
    window.changePasswordBtn.addEventListener("click", window.changeUserPassword);
  }
  
  if (window.changeRoleBtn) {
    window.changeRoleBtn.addEventListener("click", window.changeUserRole);
  }
  
  if (window.changeGroupBtn) {
    window.changeGroupBtn.addEventListener("click", window.changeUserGroup);
  }
  
  if (window.deleteUserBtn) {
    window.deleteUserBtn.addEventListener("click", window.deleteUser);
  }
    
  const manageGroupsBtn = document.getElementById("manageGroupsBtn");
  if (manageGroupsBtn) {
    manageGroupsBtn.addEventListener("click", window.manageUserGroups);
  }
  
  const changeCompanyBtn = document.getElementById("changeCompanyBtn");
  if (changeCompanyBtn) {
    changeCompanyBtn.addEventListener("click", window.changeUserCompany);
  }
});

// ============================= ZARZĄDZANIE GRUPAMI UŻYTKOWNIKA ===========================
window.manageUserGroups = async function() {
  if (!window.selectedUser) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  try {
    const response = await fetch(`/api/user/${window.selectedUser.id}/groups`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        window.showToast(t.userGroupsNoAccess, "error");
        return;
      }
      throw new Error("Błąd pobierania danych grup");
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || t.userGroupsError);
    }
    
    const modalHTML = `
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsPrimary}
          </label>
          <div style="padding: 10px; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border);">
            ${data.primary_group_id ? 
              `<strong>${data.all_groups.find(g => g.id === data.primary_group_id)?.name || data.primary_group_id}</strong>` 
              : t.billboardsGroupStatus
            }
            ${window.currentUser.ranga === "root" ? `
              <button id="changePrimaryGroupBtn" class="small-btn" style="margin-left: 10px; padding: 3px 8px;">
                ${t.userGroupsChangePrimaryBtn}
              </button>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: var(--text);">
            ${t.userGroupsAdditional} (${t.optional})
          </label>
          <div class="checkbox-group-container">
            <div id="additionalGroupsContainer" class="checkbox-group-scroll">
              ${data.all_groups
                .filter(group => group.id !== data.primary_group_id)
                .map(group => `
                  <div class="checkbox-item-modern">
                    <input type="checkbox" 
                           class="additional-group-checkbox" 
                           value="${group.id}" 
                           id="group_${group.id}"
                           ${(data.additional_groups || []).includes(group.id) ? 'checked' : ''}>
                    <div class="checkbox-custom"></div>
                    <label for="group_${group.id}" class="checkbox-label-modern">
                      ${group.name}
                    </label>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 12px; color: var(--text-secondary);">
          ⓘ ${t.userGroupsMinOneError}
        </div>
      </div>
    `;

    const modal = window.createModal(
      `${t.userGroupsTitle}: ${window.selectedUser.name}`,
      modalHTML,
      [
        { id: "saveUserGroupsBtn", text: t.userGroupsSaveBtn, class: "save-btn" },
        { id: "cancelUserGroupsBtn", text: t.userGroupsCancelBtn, class: "cancel-btn" }
      ]
    );
    
    modal.querySelector("#saveUserGroupsBtn").addEventListener("click", async () => {
      const selectedGroups = Array.from(modal.querySelectorAll(".additional-group-checkbox:checked"))
        .map(cb => parseInt(cb.value))
        .filter(id => !isNaN(id));
      
      const saveBtn = modal.querySelector("#saveUserGroupsBtn");
      const cancelBtn = modal.querySelector("#cancelUserGroupsBtn");
      
      const originalText = saveBtn.textContent;
      saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.userGroupsSaveBtn}...`;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      
      try {
        const response = await fetch(`/api/user/${window.selectedUser.id}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ group_ids: selectedGroups })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t.userGroupsError);
        }
        
        const result = await response.json();
        
        window.closeModal(modal);
        window.showToast(t.userGroupsSuccess, "success");
        
      } catch (err) {
        window.showToast(err.message, "error");
        
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });
    
    modal.querySelector("#cancelUserGroupsBtn").addEventListener("click", () => window.closeModal(modal));
    
    if (modal.querySelector("#changePrimaryGroupBtn")) {
      modal.querySelector("#changePrimaryGroupBtn").addEventListener("click", () => {
        window.changeUserPrimaryGroup(data);
      });
    }
    
    modal.addEventListener("click", e => { 
      if(e.target === modal) window.closeModal(modal); 
    });
    
  } catch (err) {
    console.error("Błąd zarządzania grupami użytkownika:", err);
    window.showToast(err.message, "error");
  }
};

function addGroupToSelected(groupId, modal) {
  const selectedList = modal.querySelector("#selectedGroupsList");
  const availableList = modal.querySelector("#availableGroupsList");
  
  const groupItem = availableList.querySelector(`[data-group-id="${groupId}"]`);
  if (!groupItem) return;
  
  const groupName = groupItem.textContent.replace(t.userGroupsAddBtn, '').trim();
  
  const selectedItem = document.createElement('div');
  selectedItem.className = 'selected-group-item';
  selectedItem.dataset.groupId = groupId;
  selectedItem.innerHTML = `
    ${groupName}
    <button type="button" class="remove-group-btn" data-group-id="${groupId}" style="margin-left: 5px; background: none; border: none; color: var(--danger); cursor: pointer; font-size: 12px;">
      ×
    </button>
  `;
  selectedItem.style.cssText = 'display: inline-block; margin: 3px; padding: 5px 10px; background: var(--primary-light); color: var(--primary); border-radius: 4px; font-size: 14px;';
  
  selectedList.appendChild(selectedItem);
  groupItem.remove();
  
  selectedItem.querySelector('.remove-group-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    removeGroupFromSelected(groupId, modal);
  });
  
  if (availableList.querySelectorAll('.available-group-item').length === 0) {
    availableList.innerHTML = `<span style="color: var(--text-secondary); font-size: 14px;">${t.noneFound}</span>`;
  }
}

function removeGroupFromSelected(groupId, modal) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const selectedList = modal.querySelector("#selectedGroupsList");
  const availableList = modal.querySelector("#availableGroupsList");
  
  const selectedItem = selectedList.querySelector(`[data-group-id="${groupId}"]`);
  if (!selectedItem) return;
  
  const groupName = selectedItem.textContent.replace('×', '').trim();
  
  const availableItem = document.createElement('div');
  availableItem.className = 'available-group-item';
  availableItem.dataset.groupId = groupId;
  availableItem.innerHTML = `
    ${groupName}
    <button type="button" class="add-group-btn" data-group-id="${groupId}" style="float: right; padding: 2px 8px; background: var(--primary); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
      ${t.userGroupsAddBtn}
    </button>
  `;
  availableItem.style.cssText = 'padding: 8px; margin: 3px 0; background: var(--bg); border-radius: 4px; cursor: pointer; border: 1px solid var(--border); transition: background 0.2s;';
  
  selectedItem.remove();
  
  if (availableList.querySelector('span')) {
    availableList.innerHTML = '';
  }
  
  availableList.appendChild(availableItem);
  
  availableItem.querySelector('.add-group-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    addGroupToSelected(groupId, modal);
  });
  
  availableItem.addEventListener('click', function() {
    addGroupToSelected(groupId, modal);
  });
}

// ============================= ZMIANA GŁÓWNEJ GRUPY UŻYTKOWNIKA ===========================
window.changeUserPrimaryGroup = async function(groupsData) {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modal = window.createModal(
    `${t.userGroupsChangePrimaryBtn}: ${window.selectedUser.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">
        ${t.selectNewGroup}
      </p>
      <select id="newPrimaryGroupSelect" class="modal-select">
        <option value="" disabled>${t.selectGroup}</option>
        ${groupsData.all_groups.filter(group => 
          group.id !== groupsData.primary_group_id
        ).map(group => 
          `<option value="${group.id}">${group.name}</option>`
        ).join('')}
      </select>
      <p style="margin-top: 15px; font-size: 12px; color: var(--text-secondary);">
        ⚠️ ${t.userGroupsMinOneError}
      </p>
    `,
    [
      { id: "savePrimaryGroupBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelPrimaryGroupBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );
  
  modal.querySelector("#savePrimaryGroupBtn").addEventListener("click", async () => {
    const newGroupId = modal.querySelector("#newPrimaryGroupSelect").value;
    
    if (!newGroupId) {
      window.showToast(t.selectGroup, "error");
      modal.querySelector("#newPrimaryGroupSelect").style.borderColor = "var(--danger)";
      return;
    }
    
    const saveBtn = modal.querySelector("#savePrimaryGroupBtn");
    const cancelBtn = modal.querySelector("#cancelPrimaryGroupBtn");
    
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saveBtn}...`;
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    
    try {
      const response = await fetch(`/api/user/${window.selectedUser.id}/groups/primary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ group_id: newGroupId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.userGroupsError);
      }
      
      window.closeModal(modal);
      window.showToast(t.groupChanged, "success");
      window.loadUsers();
      
    } catch (err) {
      window.showToast(err.message, "error");
      
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
  
  modal.querySelector("#cancelPrimaryGroupBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
};