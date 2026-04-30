// ============================= ŁADOWANIE TELEBIMÓW ===========================
window.loadBillboards = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!window.currentUser) {
    try {
      const userResponse = await fetch('/api/me', { credentials: 'include' });
      if (userResponse.ok) {
        window.currentUser = await userResponse.json();
      }
    } catch (userErr) {
      console.error('Błąd pobierania danych użytkownika:', userErr);
    }
  }
  
  if (window.currentUser && window.currentUser.ranga !== "root" && !window.currentUser.groups) {
    try {
      const groupsResponse = await fetch(`/api/user/${window.currentUser.id}/groups`, {
        credentials: 'include'
      });
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        if (groupsData.success) {
          const allUserGroups = [groupsData.primary_group_id, ...(groupsData.additional_groups || [])];
          window.currentUser.groups = [...new Set(allUserGroups.filter(id => id !== null))];
        }
      }
    } catch (err) {
      console.error('Błąd ładowania grup użytkownika:', err);
    }
  }
  
  if (window.billboardsModal) {
    window.billboardsModal.style.display = "flex";
  }
  
  if (window.billboardsList) {
    window.billboardsList.innerHTML = `<p>${t.loading}</p>`;
  }

  try {
    const res = await fetch("/api/telebimlist", {
      credentials: 'include'
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        window.showToast("Sesja wygasła. Zaloguj się ponownie.", "error");
        window.location.href = '/';
        return;
      }
      throw new Error("Błąd serwera");
    }
    
    const billboards = await res.json();
    
    const onlineCount = billboards.filter(b => b.is_connected === 1).length;
    const totalCount = billboards.length;
    
    if (window.connectedCount) {
      window.connectedCount.textContent = `${onlineCount}/${totalCount}`;
    }
    
    const connectedCountElement = document.getElementById("connectedCount");
    if (connectedCountElement) {
      const prevSibling = connectedCountElement.previousSibling;
      if (prevSibling && prevSibling.nodeType === 3) {
        prevSibling.textContent = t.billboardsConnectedPrefix + " ";
      }
    }
    
    if (!billboards || billboards.length === 0) {
      if (window.billboardsList) {
        window.billboardsList.innerHTML = `
          <p style="color: var(--text-secondary); text-align: center; padding: 40px;">
            ${t.noneFound}
            ${window.currentUser && window.currentUser.ranga !== "root" 
              ? `<br><small>${lang === 'pl' 
                  ? 'Nie masz przypisanych żadnych urządzeń do swoich grup' 
                  : 'You have no devices assigned to your groups'}</small>`
              : ''
            }
          </p>
        `;
      }
      return;
    }

    const showActionsColumn = window.currentUser && 
      (window.currentUser.ranga === "root" || window.currentUser.ranga === "owner");

    if (window.billboardsList) {
      window.billboardsList.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>${t.tableBillboardUUID}</th>
              <th>${t.tableBillboardName}</th>
              <th>Status</th>
              ${showActionsColumn ? `<th>${t.tableBillboardActions}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${billboards.map((b, i) => {
              const isOnline = b.is_connected === 1;
              
              return `
                <tr>
                  <td>${b.uuid}</td>
                  <td>${b.name}</td>
                  <td>
                    <span class="status-badge ${isOnline ? 'status-online' : 'status-offline'}">
                      ${isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  ${showActionsColumn ? `<td style="cursor:pointer; text-align:center;">✏️</td>` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    if (showActionsColumn) {
      document.querySelectorAll("#billboardsList tbody tr").forEach((row, i) => {
        const td = row.cells[3];
        if (td && td.textContent.trim() !== "") {
          const newTd = td.cloneNode(true);
          td.parentNode.replaceChild(newTd, td);
          newTd.onclick = () => window.openBillboardActions(billboards[i]);
        }
      });
    }

  } catch (err) {
    if (window.billboardsList) {
      window.billboardsList.innerHTML = `<p>${t.errorLoading}</p>`;
    }
    console.error(err);
  }
};

// ============================= OTWIERANIE AKCJI TELEBIMU ===========================
window.openBillboardActions = async function(billboard) {
  if (!window.currentUser || (window.currentUser.ranga !== "root" && window.currentUser.ranga !== "owner")) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  window.selectedBillboard = billboard;

  if (window.actionBillboardname) {
    window.actionBillboardname.textContent = `${t.billboardActionsTitle} ${billboard.name}`;
  }
  
  const changeBillboardGroupBtn = document.getElementById("changeBillboardGroupBtn");
  if (changeBillboardGroupBtn) {
    changeBillboardGroupBtn.textContent = t.changeBillboardGroupBtn;
    changeBillboardGroupBtn.style.display = "block";
    
    if (window.currentUser.ranga === "owner") {
      changeBillboardGroupBtn.textContent = t.billboardChangeGroupOwner;
      
      if (!window.currentUser.groups) {
        try {
          const groupsResponse = await fetch(`/api/user/${window.currentUser.id}/groups`, {
            credentials: 'include'
          });
          
          if (groupsResponse.ok) {
            const groupsData = await groupsResponse.json();
            if (groupsData.success) {
              const allUserGroups = [groupsData.primary_group_id, ...(groupsData.additional_groups || [])];
              window.currentUser.groups = [...new Set(allUserGroups.filter(id => id !== null))];
            }
          }
        } catch (err) {
          console.error('Błąd ładowania grup użytkownika:', err);
        }
      }
    }
  }
  
  resetBillboardActionListeners();
  
  if (window.billboardActionsModal) {
    window.billboardActionsModal.style.display = "flex";
  }
};

// ============================= RESET LISTENERÓW W BILLBOARD ACTIONS ===========================
function resetBillboardActionListeners() {
  if (window.renameBillboardBtn) {
    const renameClone = window.renameBillboardBtn.cloneNode(true);
    window.renameBillboardBtn.parentNode.replaceChild(renameClone, window.renameBillboardBtn);
    window.renameBillboardBtn = renameClone;
    renameClone.onclick = window.renameBillboard;
  }
  
  const changeBillboardGroupBtn = document.getElementById("changeBillboardGroupBtn");
  if (changeBillboardGroupBtn) {
    const changeGroupClone = changeBillboardGroupBtn.cloneNode(true);
    changeBillboardGroupBtn.parentNode.replaceChild(changeGroupClone, changeBillboardGroupBtn);
    changeGroupClone.onclick = window.changeBillboardGroup;
  }
  
  if (window.deleteBillboardBtn) {
    const deleteClone = window.deleteBillboardBtn.cloneNode(true);
    window.deleteBillboardBtn.parentNode.replaceChild(deleteClone, window.deleteBillboardBtn);
    window.deleteBillboardBtn = deleteClone;
    deleteClone.onclick = window.deleteBillboard;
  }
}

// ============================= ZMIANA NAZWY TELEBIMU (modal) ===========================
window.renameBillboard = async function() {
  if (!window.selectedBillboard) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  closeAllBillboardModals();

  const modal = window.createModal(
    `${t.renameBtn}: ${window.selectedBillboard.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.enterNewName}</p>
      <input type="text" id="newBillboardNameInput" value="${window.selectedBillboard.name}" class="modal-input" placeholder="${t.enterNewName}"/>
    `,
    [
      { id: "saveRenameBillboardBtn", text: t.saveBtn, class: "save-btn" },
      { id: "cancelRenameBillboardBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.setAttribute('data-modal-type', 'rename-billboard');
  const modalId = 'rename-modal-' + Date.now();
  modal.id = modalId;

  const saveHandler = async () => {
    const newName = modal.querySelector("#newBillboardNameInput").value.trim();
    
    if (!newName) {
      window.showToast(t.fieldRequired, "error");
      modal.querySelector("#newBillboardNameInput").style.borderColor = "var(--danger)";
      return;
    }
    
    if (newName === window.selectedBillboard.name) {
      window.showToast("Wprowadź inną nazwę niż obecna", "info");
      return;
    }
    
    if (newName.length < 2) {
      window.showToast(t.invalidNameLength, "error");
      return;
    }

    try {
      const res = await fetch(`/api/telebim/${window.selectedBillboard.uuid}/rename`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || t.renameError);

      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      
      if (window.billboardActionsModal) {
        window.billboardActionsModal.style.display = "none";
      }
      
      window.showToast(t.nameChanged, "success");
      window.loadBillboards();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  };

  const cancelHandler = () => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  };

  const saveBtn = modal.querySelector("#saveRenameBillboardBtn");
  const cancelBtn = modal.querySelector("#cancelRenameBillboardBtn");
  
  if (saveBtn) saveBtn.onclick = saveHandler;
  if (cancelBtn) cancelBtn.onclick = cancelHandler;
  
  modal.onclick = function(e) { 
    if(e.target === modal) {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  };
  
  setTimeout(() => {
    const input = modal.querySelector("#newBillboardNameInput");
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
};

// ============================= AUTO DEPLOY TOKEN ===========================
window.checkUserRoleForDeployToken = async function() {
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) return;
    
    const userData = await response.json();
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    
    if (userData.ranga === 'root' || userData.ranga === 'owner') {
      const deployTokenContainer = document.getElementById('deployTokenContainer');
      if (deployTokenContainer) {
        deployTokenContainer.style.display = 'block';
        const showDeployTokenBtn = document.getElementById('showDeployTokenBtn');
        if (showDeployTokenBtn) {
          showDeployTokenBtn.textContent = t.deployTokenBtn || '🔑 Auto Deploy Token';
        }
        
        const hintParagraph = deployTokenContainer.querySelector('p');
        if (hintParagraph) {
          hintParagraph.textContent = t.deployTokenHint || 'Generuj token do automatycznego wdrażania telebimów';
        }
      }
    }
  } catch (error) {
    console.error('Błąd sprawdzania rangi użytkownika:', error);
  }
}

window.updateDeployTokenModalTexts = function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const deployTokenTitle = document.getElementById('deployTokenTitle');
  if (deployTokenTitle) deployTokenTitle.textContent = t.deployTokenTitle || '🔑 Auto Deploy Token';
  
  const deployTokenStep1 = document.getElementById('deployTokenStep1');
  if (deployTokenStep1) {
    const step1Elements = deployTokenStep1.querySelectorAll('p');
    if (step1Elements[0]) step1Elements[0].textContent = t.deployTokenPasswordPrompt || 'Wprowadź swoje hasło aby wygenerować token';
  }
  
  const deployTokenPassword = document.getElementById('deployTokenPassword');
  if (deployTokenPassword) deployTokenPassword.placeholder = t.deployTokenPasswordPlaceholder || 'Twoje hasło';
  
  const generateTokenBtn = document.getElementById('generateTokenBtn');
  if (generateTokenBtn) generateTokenBtn.textContent = t.deployTokenGenerateBtn || 'Generuj Token';
  
  const cancelDeployTokenBtn = document.getElementById('cancelDeployTokenBtn');
  if (cancelDeployTokenBtn) cancelDeployTokenBtn.textContent = t.deployTokenCancelBtn || 'Anuluj';
  
  const deployTokenStep2 = document.getElementById('deployTokenStep2');
  if (deployTokenStep2) {
    const step2Elements = deployTokenStep2.querySelectorAll('p');
    if (step2Elements[0]) step2Elements[0].textContent = t.deployTokenSuccess || 'Token wygenerowany pomyślnie!';
    if (step2Elements[1]) step2Elements[1].textContent = t.deployTokenCopyHint || 'Skopiuj ten token. Zostanie on wyświetlony tylko raz!';
    if (step2Elements[2]) step2Elements[2].textContent = t.deployTokenWarning || '⚠️ Zapisz ten token w bezpiecznym miejscu. Nie będzie można go ponownie zobaczyć!';
  }
  
  const copyTokenBtn = document.getElementById('copyTokenBtn');
  if (copyTokenBtn) copyTokenBtn.textContent = t.deployTokenCopyBtn || 'Kopiuj';
  
  const closeDeployTokenModal = document.getElementById('closeDeployTokenModal');
  if (closeDeployTokenModal) closeDeployTokenModal.textContent = t.deployTokenCloseBtn || 'Zamknij';
}

window.generateDeployToken = async function() {
  const deployTokenPassword = document.getElementById('deployTokenPassword');
  const generateTokenBtn = document.getElementById('generateTokenBtn');
  const cancelDeployTokenBtn = document.getElementById('cancelDeployTokenBtn');
  const deployTokenStep1 = document.getElementById('deployTokenStep1');
  const deployTokenStep2 = document.getElementById('deployTokenStep2');
  const generatedToken = document.getElementById('generatedToken');
  const deployTokenTitle = document.getElementById('deployTokenTitle');
  
  if (!deployTokenPassword || !generateTokenBtn) return;
  
  const password = deployTokenPassword.value.trim();
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (!password) {
    window.showToast(t.deployTokenPasswordRequired || 'Wprowadź hasło', 'error');
    deployTokenPassword.style.borderColor = 'var(--danger)';
    return;
  }
  
  const originalText = generateTokenBtn.textContent;
  generateTokenBtn.innerHTML = `<span class="loading-spinner"></span> ${t.deployTokenGenerating || 'Generowanie...'}`;
  
  try {
    const verifyResponse = await fetch('/api/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: password })
    });
    
    if (!verifyResponse.ok) {
      throw new Error(t.deployTokenInvalidPassword || 'Nieprawidłowe hasło');
    }
    
    const tokenResponse = await fetch('/api/generate-deploy-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!tokenResponse.ok) {
      throw new Error(t.deployTokenGenerationError || 'Błąd generowania tokenu');
    }
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.success || !tokenData.token) {
      throw new Error(tokenData.error || t.deployTokenGenerationError || 'Błąd generowania tokenu');
    }
    
    if (generatedToken) generatedToken.value = tokenData.token;
    if (deployTokenStep1) deployTokenStep1.style.display = 'none';
    if (deployTokenStep2) deployTokenStep2.style.display = 'block';
    if (deployTokenTitle) deployTokenTitle.textContent = '✅ ' + (t.deployTokenGenerated || 'Token wygenerowany');
    
  } catch (error) {
    console.error('Błąd generowania tokenu:', error);
    window.showToast(error.message, 'error');
    
    if (generateTokenBtn) {
      generateTokenBtn.textContent = originalText;
      generateTokenBtn.disabled = false;
    }
    if (cancelDeployTokenBtn) cancelDeployTokenBtn.disabled = false;
  }
}

window.copyDeployToken = function() {
  const generatedToken = document.getElementById('generatedToken');
  const copyTokenBtn = document.getElementById('copyTokenBtn');
  
  if (!generatedToken || !generatedToken.value) return;
  
  generatedToken.select();
  generatedToken.setSelectionRange(0, 99999);
  
  try {
    navigator.clipboard.writeText(generatedToken.value).then(() => {
      const lang = window.getCookie("language") || "pl";
      const t = window.translations[lang];
      const originalText = copyTokenBtn.textContent;
      if (copyTokenBtn) {
        copyTokenBtn.textContent = t.deployTokenCopied || 'Skopiowano!';
        copyTokenBtn.style.backgroundColor = 'var(--success)';
        
        setTimeout(() => {
          copyTokenBtn.textContent = originalText;
          copyTokenBtn.style.backgroundColor = '';
        }, 2000);
      }
    });
  } catch (err) {
    document.execCommand('copy');
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    const originalText = copyTokenBtn ? copyTokenBtn.textContent : '';
    if (copyTokenBtn) {
      copyTokenBtn.textContent = t.deployTokenCopied || 'Skopiowano!';
      
      setTimeout(() => {
        copyTokenBtn.textContent = originalText;
      }, 2000);
    }
  }
}

// ============================= ZMIANA GRUPY TELEBIMU ===========================
window.changeBillboardGroup = async function() {
  if (!window.selectedBillboard) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (window.currentUser.ranga !== "root" && window.currentUser.ranga !== "owner") {
    window.showToast(t.onlyRootCanChangeBillboardGroups, "error");
    return;
  }
  
  try {
    if (window.currentUser.ranga === "owner") {
      try {
        const groupsResponse = await fetch(`/api/user/${window.currentUser.id}/groups`, {
          credentials: 'include'
        });
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          if (groupsData.success) {
            const allUserGroups = [groupsData.primary_group_id, ...(groupsData.additional_groups || [])];
            window.currentUser.groups = [...new Set(allUserGroups.filter(id => id !== null))];
          }
        }
      } catch (err) {
        console.error('Błąd ładowania grup ownera:', err);
      }
    }
    
    const groupsRes = await fetch("/api/groupslist", {
      credentials: 'include'
    });
    
    if (!groupsRes.ok) {
      if (groupsRes.status === 401) {
        window.showToast("Sesja wygasła. Zaloguj się ponownie.", "error");
        window.location.href = '/';
        return;
      }
      throw new Error("Błąd pobierania listy grup");
    }
    
    const allGroups = await groupsRes.json();
    
    let availableGroups = [];
    
    if (window.currentUser.ranga === "root") {
      availableGroups = allGroups.filter(g => 
        g.name.toLowerCase() !== "root"
      );
    } else if (window.currentUser.ranga === "owner") {
      if (window.currentUser.groups && window.currentUser.groups.length > 0) {
        availableGroups = allGroups.filter(g => 
          window.currentUser.groups.includes(g.id)
        );
      }
    }
    
    console.log('Available groups for selection:', availableGroups);
    
    if (availableGroups.length === 0) {
      window.showToast(t.noGroupsAvailable, "error");
      return;
    }
    
    const currentGroup = allGroups.find(g => g.id === window.selectedBillboard.group_id);
    const currentGroupName = currentGroup ? currentGroup.name : `ID: ${window.selectedBillboard.group_id}`;
    
    closeAllBillboardModals();

    const modal = window.createModal(
      `${t.billboardChangeGroupOwner}: ${window.selectedBillboard.name}`,
      `
        <div style="text-align: center; margin-bottom: 15px;">
          <p style="color: var(--text-secondary); margin-bottom: 10px;">
            ${t.billboardChangeGroupOwner} <strong>${window.selectedBillboard.name}</strong>
          </p>
          <p style="font-size: 14px; color: var(--text); margin-bottom: 5px;">
            <strong>${t.currentGroup}:</strong> ${currentGroupName}
          </p>
        </div>
        
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text);">
          ${t.billboardSelectNewGroup}
        </label>
<select id="newBillboardGroupSelect" class="modal-select">
  <option value="" disabled>${t.selectGroup}</option>
  ${availableGroups.map(group => {
    const isPrimaryGroup = window.currentUser.ranga === "owner" && 
                           window.currentUser.group_id === group.id;
    const groupDisplayName = isPrimaryGroup ? `⭐ ${group.name}` : group.name;
    
    return `
      <option value="${group.id}" ${window.selectedBillboard.group_id == group.id ? 'selected' : ''}>
        ${groupDisplayName}
      </option>
    `;
  }).join('')}
</select>
        
        <p style="margin-top: 15px; font-size: 12px; color: var(--text-secondary);">
          ⚠️ ${t.groupChangeWarning}
        </p>
        
        ${window.currentUser.ranga === "owner" ? `
          <p style="margin-top: 10px; font-size: 12px; color: var(--info); padding: 8px; background: var(--info-light); border-radius: 4px;">
            ℹ️ ${t.ownerGroupsNote || "Widzisz wszystkie swoje grupy (główną i dodatkowe)"}
          </p>
        ` : ''}
      `,
      [
        { 
          id: "saveBillboardGroupBtn", 
          text: t.saveGroupChange, 
          class: "save-btn" 
        },
        { 
          id: "cancelBillboardGroupBtn", 
          text: t.cancelGroupChange, 
          class: "cancel-btn" 
        }
      ]
    );

    modal.setAttribute('data-modal-type', 'change-group-billboard');
    const modalId = 'change-group-modal-' + Date.now();
    modal.id = modalId;
    
    const saveHandler = async () => {
      const newGroupId = modal.querySelector("#newBillboardGroupSelect").value;
      const saveBtn = modal.querySelector("#saveBillboardGroupBtn");
      const cancelBtn = modal.querySelector("#cancelBillboardGroupBtn");
      
      if (!newGroupId) {
        window.showToast(t.selectGroup, "error");
        modal.querySelector("#newBillboardGroupSelect").style.borderColor = "var(--danger)";
        return;
      }
      
      const selectedGroupId = parseInt(newGroupId);
      
      if (selectedGroupId === window.selectedBillboard.group_id) {
        window.showToast(t.selectGroup, "info");
        return;
      }
      
      const originalText = saveBtn.textContent;
      saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.saveGroupChange}...`;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      
      try {
        const res = await fetch(`/api/telebim/${window.selectedBillboard.uuid}/group`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          credentials: 'include',
          body: JSON.stringify({group_id: selectedGroupId})
        });
        
        if (!res.ok) {
          let errorMsg = t.billboardGroupChangeError;
          try {
            const data = await res.json();
            if (data.error) errorMsg = data.error;
          } catch {}
          throw new Error(errorMsg);
        }
        
        const data = await res.json();
        
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        
        if (window.billboardActionsModal) {
          window.billboardActionsModal.style.display = "none";
        }
        
        window.showToast(t.billboardGroupChangeSuccess, "success");
        await window.loadBillboards();
        
      } catch (err) {
        console.error("Błąd zmiany grupy urządzenia:", err);
        window.showToast(err.message, "error");
        
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    };
    
    const cancelHandler = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
    
    const saveBtn = modal.querySelector("#saveBillboardGroupBtn");
    const cancelBtn = modal.querySelector("#cancelBillboardGroupBtn");
    
    if (saveBtn) saveBtn.onclick = saveHandler;
    if (cancelBtn) cancelBtn.onclick = cancelHandler;
    
    modal.onclick = function(e) { 
      if(e.target === modal) {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }
    };
    
    setTimeout(() => {
      const select = modal.querySelector("#newBillboardGroupSelect");
      if (select) select.focus();
    }, 100);
    
  } catch (err) {
    console.error("Błąd pobierania listy grup:", err);
    window.showToast("Błąd ładowania listy grup!", "error");
  }
};

// ============================= USUWANIE TELEBIMU (modal) ===========================
window.deleteBillboard = async function() {
  if (!window.selectedBillboard) return;

  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  closeAllBillboardModals();

  const modal = window.createModal(
    t.deleteBillboardBtn,
    `
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 18px; margin-bottom: 10px; color: var(--text);">
          ${t.deleteBillboardConfirm} <strong>"${window.selectedBillboard.name}"</strong>?
        </p>
        <p style="color: var(--danger); margin-bottom: 0;">
          ⚠️ ${t.operationIrreversible}
        </p>
      </div>
    `,
    [
      { id: "confirmDeleteBillboardBtn", text: t.deleteBtn, class: "delete-btn" },
      { id: "cancelDeleteBillboardBtn", text: t.cancelBtn, class: "cancel-btn" }
    ]
  );

  modal.setAttribute('data-modal-type', 'delete-billboard');
  const modalId = 'delete-modal-' + Date.now();
  modal.id = modalId;

  const confirmHandler = async () => {
    try {
      const res = await fetch(`/api/telebim/${window.selectedBillboard.uuid}`, { 
        method: "DELETE" 
      });

      if (!res.ok) {
        let errorMsg = t.deleteBillboardError;
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      
      if (window.billboardActionsModal) {
        window.billboardActionsModal.style.display = "none";
      }
      
      window.showToast(t.billboardDeleted, "success");
      await window.loadBillboards();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  };

  const cancelHandler = () => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  };

  const confirmBtn = modal.querySelector("#confirmDeleteBillboardBtn");
  const cancelBtn = modal.querySelector("#cancelDeleteBillboardBtn");
  
  if (confirmBtn) confirmBtn.onclick = confirmHandler;
  if (cancelBtn) cancelBtn.onclick = cancelHandler;
  
  modal.onclick = function(e) { 
    if(e.target === modal) {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  };
};

// ============================= POMOCNICZE FUNKCJE ===========================
function closeAllBillboardModals() {
  document.querySelectorAll('.custom-modal[data-modal-type]').forEach(modal => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });
}

// ============================= INIT EVENT LISTENERS ===========================
let eventListenersInitialized = false;

function initializeEventListeners() {
  if (eventListenersInitialized) return;
  eventListenersInitialized = true;

  if (window.openBillboardsBtn) {
    window.openBillboardsBtn.onclick = async () => {
      window.currentUser = await window.loadCurrentUser();
      if(!window.currentUser){ 
        window.showToast("Nie udało się pobrać danych aktualnego użytkownika. Zaloguj się ponownie.", "error"); 
        return; 
      }
      
      await window.loadBillboards();
    };
  }
  
  const showDeployTokenBtn = document.getElementById('showDeployTokenBtn');
  const cancelDeployTokenBtn = document.getElementById('cancelDeployTokenBtn');
  const closeDeployTokenModal = document.getElementById('closeDeployTokenModal');
  const deployTokenModal = document.getElementById('deployTokenModal');
  const deployTokenPassword = document.getElementById('deployTokenPassword');
  const generateTokenBtn = document.getElementById('generateTokenBtn');
  const copyTokenBtn = document.getElementById('copyTokenBtn');
  
  if (showDeployTokenBtn) {
    showDeployTokenBtn.onclick = function() {
      if (deployTokenModal) {
        deployTokenModal.style.display = 'flex';
        const deployTokenStep1 = document.getElementById('deployTokenStep1');
        const deployTokenStep2 = document.getElementById('deployTokenStep2');
        if (deployTokenStep1) deployTokenStep1.style.display = 'block';
        if (deployTokenStep2) deployTokenStep2.style.display = 'none';
        if (deployTokenPassword) deployTokenPassword.value = '';
        window.updateDeployTokenModalTexts();
        
        setTimeout(() => {
          if (deployTokenPassword) deployTokenPassword.focus();
        }, 100);
      }
    };
  }

  if (cancelDeployTokenBtn) {
    cancelDeployTokenBtn.onclick = function() {
      if (deployTokenModal) {
        deployTokenModal.style.display = 'none';
      }
    };
  }

  if (generateTokenBtn) {
    generateTokenBtn.onclick = window.generateDeployToken;
  }

  if (copyTokenBtn) {
    copyTokenBtn.onclick = window.copyDeployToken;
  }

  if (closeDeployTokenModal) {
    closeDeployTokenModal.onclick = function() {
      if (deployTokenModal) {
        deployTokenModal.style.display = 'none';
      }
    };
  }

  if (deployTokenModal) {
    deployTokenModal.onclick = function(e) {
      if (e.target === deployTokenModal) {
        deployTokenModal.style.display = 'none';
      }
    };
  }

  if (deployTokenPassword) {
    deployTokenPassword.onkeypress = function(e) {
      if (e.key === 'Enter') {
        if (generateTokenBtn) generateTokenBtn.click();
      }
    };
  }

  const refreshBillboardsBtn = document.getElementById("refreshBillboardsBtn");
  if (refreshBillboardsBtn) {
    refreshBillboardsBtn.onclick = async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const btn = this;
      btn.classList.add("loading");
      btn.disabled = true;
      
      try {
        await window.updateBillboardsCount();
        
        if (window.billboardsModal && window.billboardsModal.style.display === "flex") {
          await window.loadBillboards();
        }
        
        window.showToast("Urządzenia zostały odświeżone", "success");
      } catch (err) {
        console.error("Błąd odświeżania urządzeń:", err);
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        window.showToast(t.errorLoading || "Błąd odświeżania", "error");
      } finally {
        setTimeout(() => {
          btn.classList.remove("loading");
          btn.disabled = false;
        }, 300);
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  window.checkUserRoleForDeployToken();
});