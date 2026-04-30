// ============================= COMPANIES ===========================
window.loadCompanies = async function() {
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  if (window.companiesModal) {
    window.companiesModal.style.display = "flex";
  }
  
  if (window.companiesList) {
    window.companiesList.innerHTML = `<p>${t.loading || "Ładowanie..."}</p>`;
  }

  try {
    window.currentUser = await window.loadCurrentUser();
    
    if (!window.currentUser || window.currentUser.ranga !== "root") {
      if (window.companiesList) {
        window.companiesList.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
            <div style="font-size: 48px; margin-bottom: 15px;">🔒</div>
            <h3>${t.accessDenied}</h3>
            <p>${t.onlyRootCanManageCompanies || "Tylko root może zarządzać firmami"}</p>
          </div>
        `;
      }
      if (window.connectedCompaniesCount) window.connectedCompaniesCount.textContent = "0";
      return;
    }
    
    const response = await fetch("/api/companieslist", { 
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Błąd pobierania listy firm');
    }
    
    const companies = await response.json();
    
    if (window.connectedCompaniesCount) {
      window.connectedCompaniesCount.textContent = companies.length;
    }
    
    if (companies.length === 0) {
      if (window.companiesList) {
        window.companiesList.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
            <div style="font-size: 48px; margin-bottom: 15px;">🏢</div>
            <h3>${t.noneFound || "Nie znaleziono"}</h3>
            <p>${t.noCompaniesFound || "Brak firm w bazie danych"}</p>
          </div>
        `;
      }
      return;
    }
    
    if (window.companiesList) {
      window.companiesList.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>${t.tableCompanyName || "Nazwa firmy"}</th>
              <th style="text-align:center;">${t.tableCompanyActions || "Akcje"}</th>
            </tr>
          </thead>
          <tbody>
            ${companies.map((company, i) => {
              return `
                <tr>
                  <td>${window.escapeHtml(company.name)}</td>
                  <td style="cursor:pointer; text-align:center;" onclick="window.openCompanyActions(${JSON.stringify(company).replace(/"/g, '&quot;')})">✏️</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

  } catch (err) {
    console.error("Błąd ładowania firm:", err);
    if (window.companiesList) {
      window.companiesList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
          <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
          <h3>${t.error}</h3>
          <p>${t.errorLoading || "Błąd ładowania"}</p>
          <button onclick="window.loadCompanies()" class="tile-btn" style="margin-top: 15px;">
            ${t.retryBtn}
          </button>
        </div>
      `;
    }
    if (window.connectedCompaniesCount) window.connectedCompaniesCount.textContent = "0";
  }
}

// ============================= OTWIERANIE AKCJI FIRMY ===========================
window.openCompanyActions = function(company) {
  if (!window.currentUser || window.currentUser.ranga !== "root") return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  window.selectedCompany = company;

  if (window.actionCompanyname) {
    window.actionCompanyname.textContent = `${t.companyActionsTitle || "Akcje dla firmy:"} ${company.name}`;
  }
  
  if (window.companyActionsModal) {
    window.companyActionsModal.style.display = "flex";
  }
}

// ============================= ZMIANA NAZWY FIRMY (modal) ===========================
window.renameCompany = async function() {
  if (!window.selectedCompany) return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const modal = window.createModal(
    `${t.renameBtn || "Zmień nazwę"}: ${window.selectedCompany.name}`,
    `
      <p style="margin-bottom: 15px; color: var(--text-secondary);">${t.enterNewName || "Wprowadź nową nazwę"}</p>
      <input type="text" id="newCompanyNameInput" value="${window.selectedCompany.name}" class="modal-input" placeholder="${t.enterNewName || "Nowa nazwa"}"/>
    `,
    [
      { id: "saveRenameCompanyBtn", text: t.saveBtn || "Zapisz", class: "save-btn" },
      { id: "cancelRenameCompanyBtn", text: t.cancelBtn || "Anuluj", class: "cancel-btn" }
    ]
  );

  modal.querySelector("#saveRenameCompanyBtn").addEventListener("click", async () => {
    const newName = modal.querySelector("#newCompanyNameInput").value.trim();
    
    if (!newName) {
      window.showToast(t.fieldRequired || "To pole jest wymagane", "error");
      modal.querySelector("#newCompanyNameInput").style.borderColor = "var(--danger)";
      return;
    }
    
    if (newName === window.selectedCompany.name) {
      window.showToast(t.sameNameError || "Wprowadź inną nazwę niż obecna", "info");
      return;
    }
    
    if (newName.length < 2) {
      window.showToast(t.invalidNameLength || "Nazwa musi mieć co najmniej 2 znaki", "error");
      return;
    }

    try {
      const res = await fetch(`/api/company/${window.selectedCompany.id}/rename`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || t.renameError || "Błąd zmiany nazwy");

      window.closeModal(modal);
      if (window.companyActionsModal) {
        window.companyActionsModal.style.display = "none";
      }
      window.showToast(t.nameChanged || "Nazwa zmieniona", "success");
      window.loadCompanies();
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelRenameCompanyBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newCompanyNameInput");
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}

// ============================= USUWANIE FIRMY (modal) ===========================
window.deleteCompany = async function() {
  if (!window.selectedCompany) return;

  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];

  const modal = window.createModal(
    t.deleteCompanyBtn || "Usuń firmę",
    `
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 18px; margin-bottom: 10px; color: var(--text);">
          ${t.deleteCompanyConfirm || "Czy na pewno chcesz usunąć firmę"} <strong>"${window.selectedCompany.name}"</strong>?
        </p>
        <p style="color: var(--danger); margin-bottom: 0;">
          ⚠️ ${t.operationIrreversible || "Ta operacja jest nieodwracalna!"}
        </p>
      </div>
    `,
    [
      { id: "confirmDeleteCompanyBtn", text: t.deleteBtn || "Usuń", class: "delete-btn" },
      { id: "cancelDeleteCompanyBtn", text: t.cancelBtn || "Anuluj", class: "cancel-btn" }
    ]
  );

  modal.querySelector("#confirmDeleteCompanyBtn").addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/company/${window.selectedCompany.id}`, { 
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        let errorMsg = t.deleteCompanyError || "Błąd usuwania firmy";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      window.closeModal(modal);
      if (window.companyActionsModal) {
        window.companyActionsModal.style.display = "none";
      }
      window.showToast(t.companyDeleted || "Firma usunięta", "success");
      await window.loadCompanies();
    } catch (err) {
      const errorMsg = err.message.includes("przypisanych użytkowników") 
        ? t.companyHasUsersError || "Nie można usunąć firmy, ponieważ są przypisani do niej użytkownicy"
        : err.message;
      window.showToast(errorMsg, "error");
      console.error(err);
    }
  });

  modal.querySelector("#cancelDeleteCompanyBtn").addEventListener("click", () => window.closeModal(modal));
  modal.addEventListener("click", e => { if(e.target === modal) window.closeModal(modal); });
}

// ============================= DODAWANIE FIRMY (modal) ===========================
window.openAddCompanyModal = function() {
  if (!window.currentUser || window.currentUser.ranga !== "root") return;
  
  const lang = window.getCookie("language") || "pl";
  const t = window.translations[lang];
  
  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");
  modal.id = "addCompanyModal";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  
  modal.innerHTML = `
    <div class="modal">
      <h3>${t.addCompanyTitle || "Dodaj firmę"}</h3>
      <input type="text" id="newCompanyName" placeholder="${t.addCompanyNamePlaceholder || "Nazwa firmy"}" class="modal-input"/>
      <div class="modal-btn-container">
        <button id="saveNewCompanyBtn" class="modal-btn save-btn">${t.addBtn || "Dodaj"}</button>
        <button id="closeAddCompanyModal" class="modal-btn cancel-btn">${t.cancelBtn || "Anuluj"}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  modal.querySelector("#saveNewCompanyBtn").addEventListener("click", async () => {
    const companyName = modal.querySelector("#newCompanyName").value.trim();

    if (!companyName) {
      window.showToast(t.fieldRequired || "To pole jest wymagane", "error");
      return;
    }

    const saveBtn = modal.querySelector("#saveNewCompanyBtn");
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = `<span class="loading-spinner"></span> ${t.adding || "Dodawanie..."}`;
    saveBtn.disabled = true;

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: companyName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t.addCompanyError || "Błąd dodawania firmy");
      }
      
      window.showToast(t.companyAdded || "Firma dodana", "success");
      
      modal.remove();
      window.loadCompanies();
      
    } catch (err) {
      window.showToast(err.message, "error");
      console.error(err);
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  });

  modal.querySelector("#closeAddCompanyModal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  
  setTimeout(() => {
    const input = modal.querySelector("#newCompanyName");
    if (input) input.focus();
  }, 100);
}

// ============================= INIT EVENT LISTENERS ===========================
document.addEventListener('DOMContentLoaded', function() {
  if (window.openCompaniesBtn) {
    window.openCompaniesBtn.addEventListener("click", async () => {
      window.currentUser = await window.loadCurrentUser();
      if(!window.currentUser){ 
        window.showToast("Nie udało się pobrać danych aktualnego użytkownika. Zaloguj się ponownie.", "error"); 
        return; 
      }
      
      if (window.currentUser.ranga !== "root") {
        window.showToast("Tylko root może zarządzać firmami", "error");
        return;
      }
      
      await window.loadCompanies();

      const existingBtn = document.querySelector(".add-company-btn");
      if (existingBtn) {
        existingBtn.remove();
      }

      if (window.currentUser.ranga === "root") {
        const addCompanyBtn = document.createElement("button");
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        
        addCompanyBtn.textContent = t.addCompanyTitle || "Dodaj firmę";
        addCompanyBtn.classList.add("add-company-btn");
        addCompanyBtn.style.margin = "0 auto 15px auto";
        addCompanyBtn.style.display = "block";
        addCompanyBtn.style.padding = "10px 20px";
        addCompanyBtn.style.background = "var(--primary)";
        addCompanyBtn.style.color = "white";
        addCompanyBtn.style.border = "none";
        addCompanyBtn.style.borderRadius = "4px";
        addCompanyBtn.style.cursor = "pointer";
        addCompanyBtn.style.fontSize = "14px";
        
        addCompanyBtn.addEventListener("click", window.openAddCompanyModal);

        if (window.companiesList && window.companiesList.parentElement) {
          window.companiesList.parentElement.insertBefore(addCompanyBtn, window.companiesList);
        }
      }
    });
  }
});