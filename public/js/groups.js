// ============================= GROUPS ===========================
window.loadGroups = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang] || {};
  
  if (window.groupsModal) {
    window.groupsModal.style.display = "flex";
  }
  
  if (window.groupsList) {
    window.groupsList.innerHTML = `
      <div class="loading-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 40px 0;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        "></div>
        <div style="
          color: var(--text-secondary);
          font-size: 14px;
        ">${t.loading || "Ładowanie grup..."}</div>
      </div>
    `;
  }

  try {
    const userResponse = await fetch('/api/me', { credentials: 'include' });
    if (!userResponse.ok) throw new Error('Nie udało się pobrać danych użytkownika');
    
    window.currentUser = await userResponse.json();
    
    let userGroupsData = null;
    let allAvailableGroups = [];
    
    if (window.currentUser.ranga === "root") {
      const allGroupsRes = await fetch("/api/groupslist", { credentials: 'include' });
      if (allGroupsRes.ok) allAvailableGroups = await allGroupsRes.json();
    } else {
      const groupsResponse = await fetch(`/api/user/${window.currentUser.id}/groups`, {
        credentials: 'include'
      });
      
      if (groupsResponse.ok) {
        userGroupsData = await groupsResponse.json();
        if (userGroupsData.success) allAvailableGroups = userGroupsData.all_groups || [];
      }
    }
    
    let groupCount = 0;
    let html = '';
    
    if (window.currentUser.ranga === "root") {
      groupCount = allAvailableGroups.length;
      if (window.connectedGroupsCount) window.connectedGroupsCount.textContent = groupCount;
      
      if (allAvailableGroups.length === 0) {
        html = `<p style="color: var(--text-secondary); text-align: center; padding: 40px;">${t.noneFound || "Nie znaleziono"}</p>`;
      } else {
        html = `
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>${t.tableGroupName || "Nazwa grupy"}</th>
                <th style="text-align:center;">${t.tableGroupActions || "Akcje"}</th>
              </tr>
            </thead>
            <tbody>
              ${allAvailableGroups.map((g, i) => {
                const groupName = g.name || g.nazwa || 'Brak nazwy';
                return `
                  <tr>
                    <td>${groupName}</td>
                    <td style="cursor:pointer; text-align:center;" onclick="window.openGroupActions(${JSON.stringify(g).replace(/"/g, '&quot;')})">✏️</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
      
    } else {
      if (!userGroupsData || !userGroupsData.success) {
        html = `<p style="color: var(--text-secondary); text-align: center; padding: 40px;">${t.errorLoading || "Błąd ładowania"}</p>`;
        if (window.connectedGroupsCount) window.connectedGroupsCount.textContent = "0";
      } else {
        const primaryGroupId = userGroupsData.primary_group_id;
        const additionalGroupIds = userGroupsData.additional_groups || [];
        
        const uniqueAdditionalIds = additionalGroupIds.filter(id => id !== primaryGroupId);
        groupCount = (primaryGroupId ? 1 : 0) + uniqueAdditionalIds.length;
        
        if (window.connectedGroupsCount) window.connectedGroupsCount.textContent = groupCount;
        
        const primaryGroup = allAvailableGroups.find(g => g.id === primaryGroupId);
        const additionalGroups = allAvailableGroups.filter(g => 
          uniqueAdditionalIds.includes(g.id)
        );
            
        html = `<div class="groups-container" style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">`;
        
        if (primaryGroup) {
          const primaryGroupName = primaryGroup.name || primaryGroup.nazwa || 'Brak nazwy';
          html += `
            <div class="groups-section" style="margin-bottom: 25px;">
              <h4 style="margin-bottom: 10px; color: var(--primary); font-size: 16px; font-weight: 600;">
                ${t.userGroupsPrimary || "Grupa główna"}
              </h4>
              <div style="padding: 10px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; ${window.currentUser.ranga === "owner" ? "justify-content: space-between" : "justify-content: flex-start"};">
                  <div style="display: flex; align-items: center;">
                    <span style="margin-right: 8px;">⭐</span>
                    ${primaryGroupName}
                  </div>
                  ${window.currentUser.ranga === "owner" ? `<span style="cursor:pointer; margin-left: 10px;" onclick="window.openGroupActions(${JSON.stringify(primaryGroup).replace(/"/g, '&quot;')})">✏️</span>` : ''}
                </div>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="groups-section" style="margin-bottom: 25px;">
              <h4 style="margin-bottom: 10px; color: var(--primary); font-size: 16px; font-weight: 600;">
                ${t.userGroupsPrimary || "Grupa główna"}
              </h4>
              <div style="padding: 15px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 15px; color: var(--text-secondary); text-align: center;">
                ${t.noPrimaryGroup || "Brak przypisanej głównej grupy"}
              </div>
            </div>
          `;
        }
        
        html += `
          <div class="groups-section" style="margin-bottom: 25px;">
            <h4 style="margin-bottom: 10px; color: var(--success); font-size: 16px; font-weight: 600;">
              ${t.userGroupsAdditional || "Grupy dodatkowe"}
            </h4>
        `;
        
        if (additionalGroups.length > 0) {
          html += `<div style="padding: 15px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 15px;">`;
          additionalGroups.forEach(g => {
            const groupName = g.name || g.nazwa || 'Brak nazwy';
            html += `
              <div style="display: flex; align-items: center; ${window.currentUser.ranga === "owner" ? "justify-content: space-between" : "justify-content: flex-start"}; margin-bottom: 8px; padding: 8px; background: var(--bg-primary); border-radius: 4px;">
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 8px;">- </span>
                  ${groupName}
                </div>
                ${window.currentUser.ranga === "owner" ? `<span style="cursor:pointer; margin-left: 10px;" onclick="window.openGroupActions(${JSON.stringify(g).replace(/"/g, '&quot;')})">✏️</span>` : ''}
              </div>
            `;
          });
          html += `</div>`;
        } else {
          html += `
            <div style="padding: 15px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 15px; color: var(--text-secondary); text-align: center;">
              ${t.noAdditionalGroups || "Brak dodatkowych grup"}
            </div>
          `;
        }
        
        html += `</div></div>`;
      }
    }
    
    if (window.groupsList) {
      const loader = window.groupsList.querySelector('.loading-container');
      if (loader) {
        loader.style.transition = 'opacity 0.3s ease';
        loader.style.opacity = '0';
        
        setTimeout(() => {
          window.groupsList.innerHTML = html;
          
          window.groupsList.style.opacity = '0';
          requestAnimationFrame(() => {
            window.groupsList.style.transition = 'opacity 0.3s ease';
            window.groupsList.style.opacity = '1';
          });
        }, 300);
      } else {
        window.groupsList.innerHTML = html;
      }
    }

  } catch (err) {
    console.error('Błąd ładowania grup:', err);
    
    if (window.groupsList) {
      const loader = window.groupsList.querySelector('.loading-container');
      if (loader) {
        loader.style.transition = 'opacity 0.3s ease';
        loader.style.opacity = '0';
        
        setTimeout(() => {
          window.groupsList.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">${t.errorLoading || "Błąd ładowania"}</p>`;
          
          window.groupsList.style.opacity = '0';
          requestAnimationFrame(() => {
            window.groupsList.style.transition = 'opacity 0.3s ease';
            window.groupsList.style.opacity = '1';
          });
        }, 300);
      } else {
        window.groupsList.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 40px;">${t.errorLoading || "Błąd ładowania"}</p>`;
      }
    }
    if (window.connectedGroupsCount) window.connectedGroupsCount.textContent = "0";
  }
}

if (!document.querySelector('#groups-loading-style')) {
  const style = document.createElement('style');
  style.id = 'groups-loading-style';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// ============================= OTWIERANIE AKCJI GRUPY ===========================
window.openGroupActions = function(group) {
  if (!window.currentUser || (window.currentUser.ranga !== "root" && window.currentUser.ranga !== "owner")) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  window.selectedGroup = group;

  if (window.actionGroupname) {
    window.actionGroupname.textContent = `${t.groupActionsTitle} ${group.name}`;
  }
  
  if (window.groupActionsModal) {
    window.groupActionsModal.style.display = "flex";
  }
}

// ============================= ZMIANA NAZWY GRUPY (modal) ===========================
window.renameGroup = async function() {
  if (!window.selectedGroup) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const existingModals = document.querySelectorAll('.modal-overlay:not(#groupsModal):not(#groupActionsModal)');
  existingModals.forEach(modal => modal.remove());

  const modal = window.createModal(
    `${t.renameBtn}: ${window.selectedGroup.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.enterNewName}</p>
      <input type="text" id="newGroupNameInput" value="${window.selectedGroup.name}" class="modal-input" placeholder="${t.enterNewName}"/>
    `,
    [
      { id: "saveRenameGroupBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelRenameGroupBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.id = "renameGroupModal";

  modal.querySelector("#saveRenameGroupBtn").addEventListener("click", async () => {
    const newName = modal.querySelector("#newGroupNameInput").value.trim();
    
    if (!newName) {
      window.showToast(t.fieldRequired, "error");
      modal.querySelector("#newGroupNameInput").style.borderColor = "var(--danger)";
      return;
    }
    
    if (newName === window.selectedGroup.name) {
      window.showToast("Wprowadź inną nazwę niż obecna", "info");
      return;
    }
    
    if (newName.length < 2) {
      window.showToast(t.invalidNameLength, "error");
      return;
    }

    try {
      const res = await fetch(`/api/group/${window.selectedGroup.id}/rename`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || t.renameError);

      window.closeModal(modal);
      if (window.groupActionsModal) {
        window.groupActionsModal.style.display = "none";
      }
      window.showToast(t.nameChanged, "success");
      window.loadGroups();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelRenameGroupBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newGroupNameInput");
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}

// ============================= USUWANIE GRUPY (modal) ===========================
window.deleteGroup = async function() {
  if (!window.selectedGroup) return;

  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const existingModals = document.querySelectorAll('.modal-overlay:not(#groupsModal):not(#groupActionsModal)');
  existingModals.forEach(modal => modal.remove());

  const modal = window.createModal(
    t.deleteGroupBtn,
    `
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 18px; margin-bottom: 10px; color: var(--text);">
          ${t.deleteGroupConfirm} <strong>"${window.selectedGroup.name}"</strong>?
        </p>
        <p style="color: var(--danger); margin-bottom: 0;">
          ⚠️ ${t.operationIrreversible}
        </p>
      </div>
    `,
    [
      { id: "confirmDeleteGroupBtn", text: t.deleteBtn, class: "delete-btn" },
      { id: "cancelDeleteGroupBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.id = "deleteGroupModal";

  modal.querySelector("#confirmDeleteGroupBtn").addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/group/${window.selectedGroup.id}`, { method: "DELETE" });

      if (!res.ok) {
        let errorMsg = t.deleteGroupError;
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      window.closeModal(modal);
      if (window.groupActionsModal) {
        window.groupActionsModal.style.display = "none";
      }
      window.showToast(t.groupDeleted, "success");
      await window.loadGroups();
    } catch (err) {
      const errorMsg = err.message.includes("przypisanych użytkowników") 
        ? t.groupHasUsersError 
        : err.message;
      window.showToast(errorMsg, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelDeleteGroupBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
}

// ============================= DODAWANIE GRUPY (modal) ===========================
window.openAddGroupModal = function() {
  if (!window.currentUser || (window.currentUser.ranga !== "root" && window.currentUser.ranga !== "owner")) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const existingModal = document.getElementById("addGroupModal");
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");
  modal.id = "addGroupModal";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  
  modal.innerHTML = `
    <div class="modal">
      <h3>${t.addGroupTitle}</h3>
      <input type="text" id="newGroupName" placeholder="${t.addGroupNamePlaceholder}" class="modal-input"/>
      ${window.currentUser.ranga === "owner" ? `
        <p style="font-size: 12px; color: var(--info); margin: 10px 0; padding: 8px; background: var(--info-light); border-radius: 4px;">
          ℹ️ ${t.ownerGroupAutoAssign || "Ta grupa zostanie automatycznie dodana do Twoich grup dodatkowych"}
        </p>
      ` : ''}
      <div class="modal-btn-container">
        <button id="saveNewGroupBtn" class="modal-btn save-btn">${t.addBtn}</button>
        <button id="closeAddGroupModal" class="modal-btn cancel-btn">${t.cancelBtn}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  modal.querySelector("#saveNewGroupBtn").addEventListener("click", async () => {
    const groupName = modal.querySelector("#newGroupName").value.trim();

    if (!groupName) {
      window.showToast(t.fieldRequired, "error");
      return;
    }

    const saveBtn = modal.querySelector("#saveNewGroupBtn");
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.adding || "Dodawanie..."}`;
    saveBtn.disabled = true;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: groupName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t.addGroupError);
      }
      
      if (window.currentUser.ranga === "owner") {
        window.showToast(
          t.groupAddedAutoAssigned || "Grupa utworzona i dodana do Twoich grup dodatkowych", 
          "success"
        );
      } else {
        window.showToast(t.groupAdded, "success");
      }
      
      modal.remove();
      window.loadGroups();
      
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  });

  modal.querySelector("#closeAddGroupModal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newGroupName");
    if (input) input.focus();
  }, 100);
}

document.addEventListener('DOMContentLoaded', function() {
  if (window.openGroupsBtn) {
    const newOpenBtn = window.openGroupsBtn.cloneNode(true);
    window.openGroupsBtn.parentNode.replaceChild(newOpenBtn, window.openGroupsBtn);
    window.openGroupsBtn = newOpenBtn;
    
    window.openGroupsBtn.addEventListener("click", async () => {
      window.currentUser = await window.loadCurrentUser();
      if(!window.currentUser){ 
        window.showToast("Nie udało się pobrać danych aktualnego użytkownika. Zaloguj się ponownie.", "error"); 
        return; 
      }
      
      await window.loadGroups();

      const existingBtn = document.querySelector(".add-group-btn");
      if (existingBtn) {
        existingBtn.remove();
      }

      if ((window.currentUser.ranga === "root" || window.currentUser.ranga === "owner")) {
        const addGroupBtn = document.createElement("button");
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        
        addGroupBtn.textContent = t.addGroupTitle || "Dodaj grupę";
        addGroupBtn.classList.add("add-group-btn");
        addGroupBtn.style.margin = "0 auto 15px auto";
        addGroupBtn.style.display = "block";
        addGroupBtn.style.padding = "10px 20px";
        addGroupBtn.style.background = "var(--primary)";
        addGroupBtn.style.color = "white";
        addGroupBtn.style.border = "none";
        addGroupBtn.style.borderRadius = "4px";
        addGroupBtn.style.cursor = "pointer";
        addGroupBtn.style.fontSize = "14px";
        
        addGroupBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          window.openAddGroupModal();
        });

        if (window.groupsList && window.groupsList.parentElement) {
          window.groupsList.parentElement.insertBefore(addGroupBtn, window.groupsList);
        }
      }
    });
  }
  
  if (window.renameGroupBtn) {
    const newRenameBtn = window.renameGroupBtn.cloneNode(true);
    window.renameGroupBtn.parentNode.replaceChild(newRenameBtn, window.renameGroupBtn);
    window.renameGroupBtn = newRenameBtn;
    
    window.renameGroupBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      window.renameGroup();
    });
  }
  
  if (window.deleteGroupBtn) {
    const newDeleteBtn = window.deleteGroupBtn.cloneNode(true);
    window.deleteGroupBtn.parentNode.replaceChild(newDeleteBtn, window.deleteGroupBtn);
    window.deleteGroupBtn = newDeleteBtn;
    
    window.deleteGroupBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      window.deleteGroup();
    });
  }
    
  if (window.refreshGroupsBtn) {
    window.refreshGroupsBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const btn = this;
      btn.classList.add("loading");
      btn.disabled = true;
      
      try {
        window.showToast("Grupy zostały odświeżone", "success");
      } catch (err) {
        console.error("Błąd odświeżania grup:", err);
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        window.showToast(t.errorLoading || "Błąd odświeżania", "error");
      } finally {
        setTimeout(() => {
          btn.classList.remove("loading");
          btn.disabled = false;
        }, 300);
      }
    });
  }
});