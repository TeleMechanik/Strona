// ============================= INSTRUKCJE ===========================
window.initializeInstructionsElements = function() {
  if (document.getElementById("openInstructionsBtn")) {
    document.getElementById("openInstructionsBtn").addEventListener("click", window.openInstructionsModal);
  }
};

window.openInstructionsModal = async function() {
  const lang = window.getCookie("language") || "pl";
  
  let userRole = 'user';
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (response.ok) {
      const userData = await response.json();
      userRole = userData.ranga || 'user';
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
  
  const getInstructionsForRole = (role) => {
    if (lang === 'en') {
      return getEnglishInstructions(role);
    } else {
      return getPolishInstructions(role);
    }
  };
  
  const appDownloadUrl = "TelemechanikOdbiornik.exe";
  
   const installButtonHTML = (userRole === 'root' || userRole === 'owner') ? `
    <div style="margin-bottom: 15px; text-align: center;">
      <a href="${appDownloadUrl}" target="_blank" 
         style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-size: 14px;">
        <span>⬇️</span>
        ${lang === 'pl' ? 'Pobierz .exe' : 'Download .exe'}
      </a>
    </div>
  ` : '';
  
  const modalHTML = `
    <div class="modal-overlay" id="instructionsModal" style="align-items:center; justify-content:center; padding-bottom:0;">
      <div class="big-modal-container">
        <h2 style="margin-bottom: 20px;">${lang === 'pl' ? 'Instrukcje - System Telebimowy' : 'Instructions - Telebim System'}</h2>
        
        <div class="instructions-header">
          <p style="margin-bottom: 15px; color: var(--text-secondary);">
            ${lang === 'pl' ? 'Twoja aktualna ranga:' : 'Your current role:'} <strong>${userRole === 'root' ? '👑 Root' : userRole === 'owner' ? '🏢 Owner' : userRole === 'admin' ? '⚙️ Admin' : '👤 User'}</strong>
          </p>
        </div>
        
        ${installButtonHTML}
        
        <div class="big-modal-list" id="instructionsContent" style="max-height: 500px; overflow-y: auto; padding: 20px;">
          <div class="instructions-content">
            ${getInstructionsForRole(userRole)}
          </div>
        </div>

        <button class="close-big-modal" id="closeInstructionsModal">${lang === 'pl' ? 'Zamknij' : 'Close'}</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const instructionsModal = document.getElementById("instructionsModal");
  const closeInstructionsBtn = document.getElementById("closeInstructionsModal");
  
  if (closeInstructionsBtn) {
    closeInstructionsBtn.onclick = () => {
      if (instructionsModal) {
        instructionsModal.style.display = "none";
        instructionsModal.remove();
      }
    };
  }
  
  if (instructionsModal) {
    instructionsModal.onclick = (e) => { 
      if (e.target === instructionsModal) {
        instructionsModal.style.display = "none";
        instructionsModal.remove();
      }
    };
  }
  
  if (instructionsModal) {
    instructionsModal.style.display = "flex";
  }
};

function getPolishInstructions(role) {
  let instructions = '';
  
  if (role === 'root' || role === 'owner') {
    instructions = `
      <div class="instructions-section">
        <h3>📋 Przeglądanie listy urządzeń</h3>
        <div class="instructions-step">
          <h4>Krok 1: Otwórz listę urządzeń</h4>
          <p>Kliknij przycisk "Urządzenia" w głównym menu systemu.</p>
          ${role === 'root' ? '<p><em>Jako Root zobaczysz WSZYSTKIE urządzenia w systemie.</em></p>' : '<p><em>Jako Owner zobaczysz tylko urządzenia ze swoich grup.</em></p>'}
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Zrozum tabelę</h4>
          <p>Pojawi się tabela z urządzeniami:</p>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>UUID</th>
                <th>Nazwa</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>594c9fdf-7968-42eb-96ed-bfc948a37b5a</td>
                <td>Przykładowa nazwa</td>
                <td><span class="status-badge status-online">Online</span></td>
                <td style="cursor:pointer; text-align:center;">✏️</td>
              </tr>
              <tr>
                <td>876c9fdf-7938-44eb-56ed-bfc543a37b7a</td>
                <td>Przykładowa nazwa #2</td>
                <td><span class="status-badge status-offline">Offline</span></td>
                <td style="cursor:pointer; text-align:center;">✏️</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 3: Sprawdź status</h4>
          <p>W prawym górnym rogu zobaczysz licznik: <strong>"Połączono: X/Y"</strong></p>
          <ul>
            <li><strong>X</strong> - liczba urządzeń aktualnie online</li>
            <li><strong>Y</strong> - całkowita liczba urządzeń</li>
          </ul>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>🔑 Dodawanie nowych urządzeń (Auto Deploy Token)</h3>
        <div class="instructions-step">
          <h4>Krok 1: Otwórz generator tokenów</h4>
          <p>Kliknij przycisk <strong>"🔑 Auto Deploy Token"</strong> w panelu urządzeń.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Wprowadź hasło</h4>
          <p>W polu "Twoje hasło" wprowadź swoje aktualne hasło w celu weryfikacji.</p>
          <p><em>To zabezpieczenie chroni przed nieautoryzowanym generowaniem tokenów.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 3: Wygeneruj token</h4>
          <p>Kliknij przycisk <strong>"Generuj Token"</strong>.</p>
          <p>System wygeneruje unikalny token dostępny tylko do jednorazowego użycia.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 4: Skopiuj token</h4>
          <p>Po wygenerowaniu tokenu:</p>
          <ol>
            <li>Kliknij przycisk <strong>"Kopiuj"</strong> aby skopiować token do schowka</li>
            <li>Lub zaznacz token i użyj Ctrl+C</li>
          </ol>
          <div class="instructions-warning">
            <strong>⚠️ WAŻNE:</strong> Token zostanie wyświetlony tylko raz! Zapisz go w bezpiecznym miejscu.
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 5: Zarejestruj urządzenie</h4>
          <p>Użyj skopiowanego tokenu w aplikacji telebimowej:</p>
          <ol>
            <li>Otwórz aplikację telebimową na urządzeniu</li>
            <li>Wprowadź wygenerowany token w odpowiednim polu</li>
            <li>Urządzenie automatycznie połączy się z systemem</li>
            <li>Nowe urządzenie pojawi się na liście</li>
          </ol>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>✏️ Zarządzanie istniejącymi urządzeniami</h3>
        
        <div class="instructions-step">
          <h4>Krok 1: Otwórz menu akcji</h4>
          <p>Kliknij ikonę <strong>✏️</strong> przy wybranym urządzeniu w kolumnie "Akcje".</p>
          <p>Otworzy się modalne okno z opcjami zarządzania.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Opcja 1: Zmiana nazwy urządzenia</h4>
          <p><strong>Jak to zrobić:</strong></p>
          <ol>
            <li>Kliknij przycisk <strong>"Zmień nazwę"</strong></li>
            <li>Wprowadź nową nazwę w polu tekstowym</li>
            <li>Kliknij <strong>"Zapisz"</strong></li>
          </ol>
          <p><strong>Wymagania:</strong> Nowa nazwa musi mieć co najmniej 2 znaki i być inna niż obecna.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Opcja 2: Zmiana grupy urządzenia</h4>
          <p><strong>Jak to zrobić:</strong></p>
          <ol>
            <li>Kliknij przycisk <strong>"${role === 'root' ? 'Zmień grupę urządzenia' : 'Zmień grupę urządzenia (Owner)'}"</strong></li>
            <li>Wybierz nową grupę z listy rozwijanej</li>
            <li>Kliknij <strong>"Zapisz zmianę grupy"</strong></li>
          </ol>
          ${role === 'owner' ? `
            <div class="instructions-note">
              <strong>ℹ️ Uwaga dla Owner:</strong> Możesz przenosić urządzenia TYLKO pomiędzy swoimi grupami.
              Główna grupa jest oznaczona ⭐.
            </div>
          ` : ''}
        </div>
        
        <div class="instructions-step">
          <h4>Opcja 3: Usuwanie urządzenia</h4>
          <p><strong>Jak to zrobić:</strong></p>
          <ol>
            <li>Kliknij przycisk <strong>"Usuń urządzenie"</strong></li>
            <li>Potwierdź usunięcie w oknie dialogowym</li>
            <li>Kliknij <strong>"Usuń"</strong></li>
          </ol>
          <div class="instructions-warning">
            <strong>⚠️ UWAGA:</strong> Usuniętego urządzenia NIE MOŻNA przywrócić!
            Ta operacja jest nieodwracalna.
          </div>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>🔄 Odświeżanie listy urządzeń</h3>
        <div class="instructions-step">
          <h4>Krok 1: Znajdź przycisk odświeżania</h4>
          <p>Kliknij przycisk <strong>🔄</strong> w prawym górnym rogu panelu urządzeń.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Poczekaj na aktualizację</h4>
          <p>System:</p>
          <ol>
            <li>Pobierze aktualny status wszystkich urządzeń (online/offline)</li>
            <li>Zaktualizuje licznik "Połączono: X/Y"</li>
            <li>Odświeży status w tabeli (zielony/niebieski dla online, szary dla offline)</li>
          </ol>
          <p><em>Automatyczny komunikat potwierdzi pomyślne odświeżenie.</em></p>
        </div>
      </div>
    `;
  }
  
  if (role === 'admin' || role === 'user') {
    instructions = `
      <div class="instructions-section">
        <h3>❌ Brak dostępu do zarządzania urządzeniami</h3>
        <div class="instructions-step">
          <h4>Jako ${role === 'admin' ? 'Administrator' : 'Użytkownik'} nie masz uprawnień do:</h4>
          <ul>
            <li>Przeglądania listy telebimów</li>
            <li>Dodawania nowych urządzeń</li>
            <li>Zmiany nazw urządzeń</li>
            <li>Przenoszenia urządzeń między grupami</li>
            <li>Usuwania urządzeń</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co zobaczysz po kliknięciu "Urządzenia":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"Nie masz przypisanych żadnych urządzeń do swoich grup"</strong></p>
            <p>To normalne komunikaty dla Twojej rangi.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Co możesz zrobić?</h4>
          <p>Skontaktuj się z osobą mającą rangę <strong>Root</strong> lub <strong>Owner</strong> aby:</p>
          <ol>
            <li>Przypisać Cię do odpowiednich grup urządzeń</li>
            <li>Nadać Ci wyższe uprawnienia jeśli jest to konieczne</li>
          </ol>
        </div>
      </div>
    `;
  }
  
  instructions += `
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">📅 Harmonogramy</h2>
  `;
  
  if (role === 'root' || role === 'owner' || role === 'admin') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Przeglądanie harmonogramów</h3>
        <h4>Krok 1: Otwórz moduł harmonogramów</h4>
        <p>Kliknij przycisk "Harmonogramy" w głównym menu systemu.</p>
        <p>Otworzy się panel z wyborem urządzenia i listą harmonogramów.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Wybierz urządzenie</h4>
        <p>Z listy rozwijanej wybierz telebim, którego harmonogramy chcesz przeglądać.</p>
        ${role === 'admin' ? '<p><em>Jako Admin widzisz tylko urządzenia ze swoich grup.</em></p>' : ''}
        ${role === 'owner' ? '<p><em>Jako Owner widzisz tylko urządzenia ze swoich grup.</em></p>' : ''}
        ${role === 'root' ? '<p><em>Jako Root widzisz WSZYSTKIE urządzenia w systemie.</em></p>' : ''}
      </div>
      
      <div class="instructions-step">
        <h4>Krok 3: Zrozum listę harmonogramów</h4>
        <p>Po wybraniu urządzenia zobaczysz listę harmonogramów:</p>
        <ul>
          <li><strong>Nazwa zadania</strong> - tytuł harmonogramu</li>
          <li><strong>Status</strong> - aktywny/wstrzymany</li>
          <li><strong>Podgląd pliku</strong> - miniatura obrazka/wideo</li>
          <li><strong>Daty</strong> - zakres dat obowiązywania</li>
          <li><strong>Godziny</strong> - godziny wyświetlania</li>
          <li><strong>Powtarzanie</strong> - dni tygodnia</li>
          <li><strong>Akcje</strong> - przyciski edycji i usuwania</li>
        </ul>
      </div>
      
      <div class="instructions-step">
        <h3>➕ Tworzenie nowego harmonogramu</h3>
        <h4>Krok 1: Otwórz formularz</h4>
        <p>Kliknij przycisk <strong>"➕ Dodaj harmonogram"</strong> w prawym górnym rogu.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Wybierz plik</h4>
        <p>Masz dwie opcje dodania pliku:</p>
        <ul>
          <li><strong>Wybierz z galerii</strong> - przeglądaj dostępne obrazy i wideo</li>
          <li><strong>Wgraj nowy</strong> - przeciągnij plik lub kliknij aby wybrać (max 50MB)</li>
        </ul>
        <p>Obsługiwane formaty: JPG, PNG, GIF, WebP, SVG, BMP, MP4, WebM, AVI, MOV, MKV, OGG</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 3: Ustaw daty i godziny</h4>
        <p>Skonfiguruj czas wyświetlania:</p>
        <ol>
          <li><strong>Data rozpoczęcia/zakończenia</strong> - zakres obowiązywania</li>
          <li><strong>Godzina rozpoczęcia/zakończenia</strong> - format HH:MM:SS</li>
          <li><strong>Dodatkowe godziny</strong> - kliknij "+ Dodaj godzinę" dla wielu przedziałów</li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 4: Wybierz dni powtarzania</h4>
        <p>Zaznacz dni tygodnia, w które harmonogram ma się powtarzać.</p>
        <p>Możesz użyć presetów: "Codziennie", "Dni robocze", "Weekend".</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 5: Ustaw priorytet</h4>
        <p>Wybierz priorytet od 0 (najniższy) do 2 (najwyższy):</p>
        <div class="instructions-note">
          <ul>
            <li><strong>Priorytet 0:</strong> Nie może kolidować z żadnym harmonogramem</li>
            <li><strong>Priorytet 1:</strong> Może kolidować tylko z innymi Priority 1</li>
            <li><strong>Priorytet 2:</strong> Może kolidować tylko z innymi Priority 2</li>
          </ul>
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Edycja harmonogramów</h3>
        <p>Kliknij przycisk <strong>"Edytuj"</strong> przy wybranym harmonogramie.</p>
        <p>Harmonogramy z tymi samymi parametrami są grupowane - edycja dotyczy całej grupy.</p>
      </div>
      
      <div class="instructions-step">
        <h3>🗑️ Usuwanie harmonogramów</h3>
        <p>Masz trzy opcje usuwania:</p>
        <ol>
          <li><strong>Usuń pojedynczy</strong> - kliknij "Usuń" przy harmonogramie</li>
          <li><strong>Usuń zbiorczo</strong> - zaznacz wiele harmonogramów i użyj paska zbiorczych akcji</li>
          <li><strong>Usuń plik z harmonogramami</strong> - kliknij 🗑️ w galerii (usuwa plik i WSZYSTKIE powiązane harmonogramy!)</li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h3>👁️ Wizualizacja harmonogramów</h3>
        <p>Kliknij przycisk <strong>"👁️ Wizualizuj"</strong> aby zobaczyć kalendarz tygodniowy.</p>
        <p>Kolorowe bloki pokazują harmonogramy, a obwódki oznaczają kolizje:</p>
        <ul>
          <li><strong>Czerwona</strong> - priorytet 0 w kolizji</li>
          <li><strong>Pomarańczowa</strong> - priorytet 1 w kolizji</li>
          <li><strong>Żółta</strong> - priorytet 2 w kolizji</li>
        </ul>
      </div>
      
      <div class="instructions-step">
        <h3>⚠️ Kolizje harmonogramów</h3>
        <p>Kolizja występuje gdy dwa harmonogramy mają nakładające się godziny w tym samym dniu.</p>
        <p>Jeśli system wykryje kolizję, pokaże okno z listą konfliktujących harmonogramów.</p>
        <p>Aby rozwiązać kolizję: zmień daty/godziny, dni lub priorytet.</p>
      </div>
    `;
  }
  
  if (role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ Ograniczony dostęp do harmonogramów</h3>
        <p>Jako Użytkownik możesz tylko:</p>
        <ul>
          <li>Przeglądać harmonogramy dla urządzeń ze swoich grup</li>
          <li>Oglądać wizualizację harmonogramów</li>
        </ul>
        <p><strong>NIE możesz:</strong> tworzyć, edytować, usuwać harmonogramów ani wgrywać plików.</p>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🏢 Firmy</h2>
  `;
  
  if (role === 'root') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Przeglądanie listy firm</h3>
        <h4>Krok 1: Otwórz moduł firm</h4>
        <p>Kliknij przycisk "Firmy" w głównym menu systemu.</p>
        <p><em>Tylko użytkownicy z rangą <strong>Root</strong> mają dostęp do tego modułu.</em></p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Zrozum tabelę firm</h4>
        <p>Pojawi się tabela z listą wszystkich firm w systemie:</p>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Nazwa firmy</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Przykładowa Sp. z o.o.</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
            <tr>
              <td>Inna Firma Sp. k.</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="instructions-step">
        <h3>➕ Dodawanie nowej firmy</h3>
        <h4>Krok 1: Otwórz formularz dodawania</h4>
        <p>Kliknij przycisk <strong>"🏢 Dodaj firmę"</strong> nad listą firm.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Wprowadź nazwę firmy</h4>
        <p>Wprowadź nazwę nowej firmy w polę tekstowym.</p>
        <p><strong>Wymagania:</strong> Nazwa musi mieć co najmniej 2 znaki.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 3: Potwierdź dodanie</h4>
        <p>Kliknij przycisk <strong>"Dodaj"</strong> aby utworzyć firmę.</p>
        <p>Nowa firma pojawi się na liście po pomyślnym dodaniu.</p>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Zarządzanie firmami</h3>
        <h4>Krok 1: Otwórz menu akcji</h4>
        <p>Kliknij ikonę <strong>✏️</strong> przy wybranej firmie w kolumnie "Akcje".</p>
        <p>Otworzy się modalne okno z opcjami zarządzania.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Opcja 1: Zmiana nazwy firmy</h4>
        <p><strong>Jak to zrobić:</strong></p>
        <ol>
          <li>Kliknij przycisk <strong>"Zmień nazwę"</strong></li>
          <li>Wprowadź nową nazwę firmy</li>
          <li>Kliknij <strong>"Zapisz"</strong></li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Opcja 2: Usuwanie firmy</h4>
        <p><strong>Jak to zrobić:</strong></p>
        <ol>
          <li>Kliknij przycisk <strong>"Usuń firmę"</strong></li>
          <li>Potwierdź usunięcie w oknie dialogowym</li>
          <li>Kliknij <strong>"Usuń"</strong></li>
        </ol>
        <div class="instructions-warning">
          <strong>⚠️ UWAGA:</strong> Nie można usunąć firmy, jeśli są do niej przypisani użytkownicy!
          Najpierw przenieś lub usuń wszystkich użytkowników z tej firmy.
        </div>
      </div>
    `;
  }
  
  if (role === 'owner' || role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ Brak dostępu do zarządzania firmami</h3>
        <div class="instructions-step">
          <h4>Jako ${role === 'owner' ? 'Owner' : role === 'admin' ? 'Administrator' : 'Użytkownik'} nie masz uprawnień do:</h4>
          <ul>
            <li>Przeglądania listy firm</li>
            <li>Dodawania nowych firm</li>
            <li>Zmiany nazw firm</li>
            <li>Usuwania firm</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co zobaczysz po kliknięciu "Firmy":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"Tylko root może zarządzać firmami"</strong></p>
            <p>To normalny komunikat dla Twojej rangi.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">👥 Grupy</h2>
  `;
  
  if (role === 'root' || role === 'owner') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Przeglądanie grup</h3>
        <h4>Krok 1: Otwórz moduł grup</h4>
        <p>Kliknij przycisk "Grupy" w głównym menu systemu.</p>
        ${role === 'root' ? '<p><em>Jako Root widzisz WSZYSTKIE grupy w systemie.</em></p>' : '<p><em>Jako Owner widzisz tylko swoje grupy.</em></p>'}
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Zrozum strukturę grup</h4>
    `;
    
    if (role === 'root') {
      instructions += `
        <p>Pojawi się tabela ze wszystkimi grupami w systeme:</p>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Nazwa grupy</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Grupa Główna</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
            <tr>
              <td>Grupa Dodatkowa 1</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      instructions += `
        <p>Widzisz podział na dwie sekcje:</p>
        <div class="instructions-note">
          <ul>
            <li><strong>Grupa główna ⭐</strong> - Twoja podstawowa grupa (może mieć tylko jedną)</li>
            <li><strong>Grupy dodatkowe</strong> - dodatkowe grupy, do których należysz</li>
          </ul>
        </div>
      `;
    }
    
    instructions += `
      </div>
      
      <div class="instructions-step">
        <h3>➕ Tworzenie nowej grupy</h3>
        <h4>Krok 1: Otwórz formularz dodawania</h4>
        <p>Kliknij przycisk <strong>"👥 Dodaj grupę"</strong> nad listą grup.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Krok 2: Wprowadź nazwę grupy</h4>
        <p>Wprowadź nazwę nowej grupy w polę tekstowym.</p>
        <p><strong>Wymagania:</strong> Nazwa musi mieć co najmniej 2 znaki.</p>
        ${role === 'owner' ? '<p><em>Jako Owner nowa grupa zostanie automatycznie dodana do Twoich grup dodatkowych.</em></p>' : ''}
      </div>
      
      <div class="instructions-step">
        <h4>Krok 3: Potwierdź dodanie</h4>
        <p>Kliknij przycisk <strong>"Dodaj"</strong> aby utworzyć grupę.</p>
        <p>Nowa grupa pojawi się na liście po pomyślnym dodaniu.</p>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Zarządzanie grupami</h3>
        <h4>Krok 1: Otwórz menu akcji</h4>
        <p>Kliknij ikonę <strong>✏️</strong> przy wybranej grupie.</p>
        <p>Otworzy się modalne okno z opcjami zarządzania.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Opcja 1: Zmiana nazwy grupy</h4>
        <p><strong>Jak to zrobić:</strong></p>
        <ol>
          <li>Kliknij przycisk <strong>"Zmień nazwę"</strong></li>
          <li>Wprowadź nową nazwę grupy</li>
          <li>Kliknij <strong>"Zapisz"</strong></li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Opcja 2: Usuwanie grupy</h4>
        <p><strong>Jak to zrobić:</strong></p>
        <ol>
          <li>Kliknij przycisk <strong>"Usuń grupę"</strong></li>
          <li>Potwierdź usunięcie w oknie dialogowym</li>
          <li>Kliknij <strong>"Usuń"</strong></li>
        </ol>
        <div class="instructions-warning">
          <strong>⚠️ UWAGA:</strong> Nie można usunąć grupy, jeśli są do niej przypisani użytkownicy!
          Najpierw przenieś lub usuń wszystkich użytkowników z tej grupy.
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>ℹ️ Informacje o grupach</h3>
        <div class="instructions-note">
          <ul>
            <li><strong>Grupy służą do organizacji urządzeń i użytkowników</strong></li>
            <li><strong>Urządzenia mogą należeć tylko do jednej grupy</strong></li>
            <li><strong>Użytkownicy mogą mieć jedną grupę główną i wiele dodatkowych</strong></li>
            <li><strong>Uprawnienia zależą od przynależności do grup</strong></li>
          </ul>
        </div>
      </div>
    `;
  }
  
  if (role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Przeglądanie przydzielonych grup</h3>
        <div class="instructions-step">
          <h4>Jako ${role === 'admin' ? 'Administrator' : 'Użytkownik'} możesz tylko:</h4>
          <ul>
            <li>Przeglądać swoje grupy (główną i dodatkowe)</li>
            <li>Widzieć strukturę swoich uprawnień</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co zobaczysz po kliknięciu "Grupy":</h4>
          <div class="instructions-note">
            <p>Twoje grupy są podzielone na dwie sekcje:</p>
            <ol>
              <li><strong>Grupa główna ⭐</strong> - Twoja podstawowa grupa</li>
              <li><strong>Grupy dodatkowe</strong> - dodatkowe grupy, do których należysz</li>
            </ol>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Co NIE możesz zrobić?</h4>
          <ul>
            <li>Tworzyć nowych grup</li>
            <li>Zmieniać nazw grup</li>
            <li>Usuwać grup</li>
            <li>Modyfikować przypisania grup</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Potrzebujesz zmian w grupach?</h4>
          <p>Skontaktuj się z osobą mającą rangę <strong>Root</strong> lub <strong>Owner</strong> aby:</p>
          <ol>
            <li>Przypisać Cię do innych grup</li>
            <li>Zmienić Twoją grupę główną</li>
            <li>Dodać nowe grupy do Twoich uprawnień</li>
          </ol>
        </div>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🔄 Impersonacja (Wchodzenie w rolę)</h2>
  `;

  if (role === 'root') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Przeglądanie jako inny użytkownik/firma</h3>
        <div class="instructions-step">
          <h4>Krok 1: Otwórz moduł impersonacji</h4>
          <p>Kliknij przycisk <strong>"🔄 Impersonacja"</strong> w głównym menu systemu.</p>
          <p><em>Tylko użytkownicy z rangą <strong>Root</strong> mają dostęp do tego modułu.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Wybierz typ impersonacji</h4>
          <p>Moduł ma dwie zakładki:</p>
          <ul>
            <li><strong>🏢 Firmy</strong> - przegląd systemu jako firma (widok właściciela firmy)</li>
            <li><strong>👥 Użytkownicy</strong> - przegląd systemu jako konkretny użytkownik</li>
          </ul>
          <div class="instructions-note">
            <p><strong>Przegląd firmy:</strong> Widzisz system tak jak widziałby go Owner danej firmy.</p>
            <p><strong>Przegląd użytkownika:</strong> Widzisz system z uprawnieniami i widokiem wybranego użytkownika.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 3: Wybierz firmę lub użytkownika</h4>
          <p><strong>Dla firm:</strong></p>
          <ol>
            <li>Przejdź do zakładki <strong>🏢 Firmy</strong></li>
            <li>Zobaczysz listę wszystkich firm w systemie</li>
            <li>Każda firma pokazuje:
              <ul>
                <li>Nazwę firmy</li>
                <li>Liczbę użytkowników w firmie</li>
                <li>Status dostępności właściciela (✅ dostępny / ⚠️ niedostępny)</li>
              </ul>
            </li>
            <li>Kliknij <strong>"Przegląd jako Owner"</strong> lub <strong>"Przegląd firmy"</strong> przy wybranej firmie</li>
          </ol>
          
          <p><strong>Dla użytkowników:</strong></p>
          <ol>
            <li>Przejdź do zakładki <strong>👥 Użytkownicy</strong></li>
            <li>Zobaczysz listę wszystkich użytkowników w systemie (oprócz innych root)</li>
            <li>Każdy użytkownik pokazuje:
              <ul>
                <li>Nazwę użytkownika</li>
                <li>Firmę (jeśli przypisany)</li>
                <li>Rangę (owner/admin/user)</li>
              </ul>
            </li>
            <li>Kliknij <strong>"Impersonuj użytkownika"</strong> przy wybranym użytkowniku</li>
          </ol>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 4: Potwierdź impersonację</h4>
          <p>Po wybraniu firmy/użytkownika pojawi się okno potwierdzenia:</p>
          <ul>
            <li>Przeczytaj informację o tym, na czyją rolę wchodzisz</li>
            <li>Dla firm: dodatkowa informacja o tym, że otrzymasz dostęp root do tej firmy</li>
            <li>Kliknij <strong>"Potwierdź"</strong> aby kontynuować</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h3>ℹ️ Pasek statusu impersonacji</h3>
          <p>Po rozpoczęciu impersonacji w górnej części ekranu pojawi się żółty pasek informacyjny:</p>
          <div class="instructions-note" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px;">
            <p><strong>🔄 Przeglądasz jako: [Nazwa firmy/użytkownika]</strong></p>
            <p>Jesteś zalogowany jako root: [Twoja nazwa root]</p>
            <button style="background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Zakończ przeglądanie</button>
          </div>
          <p>Pasek ten:
            <ul>
              <li>Pokazuje, kogo aktualnie impersonujesz</li>
              <li>Przypomina, że jesteś zalogowany jako root</li>
              <li>Zawiera przycisk do szybkiego zakończenia impersonacji</li>
            </ul>
          </p>
        </div>
        
        <div class="instructions-step">
          <h3>🚪 Zakończenie impersonacji</h3>
          <p>Możesz zakończyć impersonację na trzy sposoby:</p>
          <ol>
            <li><strong>Przycisk na pasku statusu:</strong> Kliknij <strong>"Zakończ przeglądanie"</strong> na żółtym pasku</li>
            <li><strong>Przycisk w module impersonacji:</strong> Kliknij <strong>"Zakończ impersonację"</strong> w module</li>
            <li><strong>Bezpośrednie przełączenie:</strong> Rozpocznij nową impersonację (poprzednia automatycznie się zakończy)</li>
          </ol>
        </div>
        
        <div class="instructions-step">
          <h3>🎯 Cel i zastosowania impersonacji</h3>
          <div class="instructions-note">
            <p><strong>Impersonacja służy do:</strong></p>
            <ul>
              <li><strong>Rozwiązywania problemów:</strong> Sprawdź, co widzi użytkownik zgłaszający problem</li>
              <li><strong>Testowania uprawnień:</strong> Zweryfikuj, czy uprawnienia są poprawnie ustawione</li>
              <li><strong>Pomocy technicznej:</strong> Wykonaj czynności w imieniu użytkownika</li>
              <li><strong>Audytu:</strong> Sprawdź funkcjonalność systemu z różnych perspektyw</li>
              <li><strong>Konfiguracji firmy:</strong> Skonfiguruj ustawienia dla firmy z poziomu właściciela</li>
            </ul>
          </div>
        </div>
        
        <div class="instructions-step">
          <h3>⚠️ Bezpieczeństwo i ograniczenia</h3>
          <div class="instructions-warning">
            <p><strong>WAŻNE zasady bezpieczeństwa:</strong></p>
            <ul>
              <li>Nie możesz impersonować innych użytkowników root</li>
              <li>Wszystkie działania są rejestrowane w logach systemowych</li>
              <li>Po zakończeniu impersonacji automatycznie wracasz do swojego konta root</li>
              <li>Nie możesz zmienić hasła podczas impersonacji</li>
              <li>Nie możesz usunąć ani edytować swojego konta root podczas impersonacji</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  if (role === 'owner' || role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ Brak dostępu do impersonacji</h3>
        <div class="instructions-step">
          <h4>Jako ${role === 'owner' ? 'Owner' : role === 'admin' ? 'Administrator' : 'Użytkownik'} nie masz uprawnień do:</h4>
          <ul>
            <li>Przeglądania systemu jako innych użytkowników</li>
            <li>Przeglądania systemu jako innych firm</li>
            <li>Korzystania z modułu impersonacji</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co zobaczysz po kliknięciu "🔄 Impersonacja":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"Tylko root może używać impersonacji"</strong> lub przycisk będzie ukryty</p>
            <p>To normalny komunikat dla Twojej rangi.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Jeśli widzisz pasek impersonacji:</h4>
          <p>Jeśli w górnej części ekranu widzisz żółty pasek z informacją o przeglądaniu, oznacza to, że:</p>
          <ol>
            <li>Administrator root aktualnie przegląda system z Twojej perspektywy</li>
            <li>Może to być związane z pomocą techniczną lub rozwiązywaniem problemu</li>
            <li>Wszystkie Twoje dane są bezpieczne</li>
            <li>Po zakończeniu pomocy pasek zniknie</li>
          </ol>
        </div>
      </div>
    `;
  }

  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">👥 Użytkownicy</h2>
  `;

  if (role === 'root' || role === 'owner' || role === 'admin') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Przeglądanie listy użytkowników</h3>
        <div class="instructions-step">
          <h4>Krok 1: Otwórz moduł użytkowników</h4>
          <p>Kliknij przycisk "Użytkownicy" w głównym menu systemu.</p>
          ${role === 'root' ? '<p><em>Jako Root zobaczysz WSZYSTKICH użytkowników w systemie.</em></p>' : ''}
          ${role === 'owner' ? '<p><em>Jako Owner zobaczysz tylko użytkowników ze swoich grup.</em></p>' : ''}
          ${role === 'admin' ? '<p><em>Jako Admin zobaczysz tylko użytkowników ze swojej grupy.</em></p>' : ''}
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Zrozum tabelę użytkowników</h4>
          <p>Pojawi się tabela z użytkownikami:</p>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>Nazwa użytkownika</th>
                <th>Ranga</th>
                ${role === 'root' || role === 'owner' ? '<th>Grupa</th>' : ''}
                ${role === 'root' ? '<th>Firma</th>' : ''}
                ${role !== 'user' ? '<th>Akcje</th>' : ''}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>jan.kowalski <span style="color: var(--primary); font-weight: bold;">(Ty)</span></td>
                <td>${role === 'root' ? 'root' : role === 'owner' ? 'owner' : 'admin'}</td>
                ${role === 'root' || role === 'owner' ? '<td>Grupa Główna ⭐ +2 dodatkowe</td>' : ''}
                ${role === 'root' ? '<td>Przykładowa Sp. z o.o.</td>' : ''}
                ${role !== 'user' ? '<td style="cursor:pointer; text-align:center;">✏️</td>' : ''}
              </tr>
              <tr>
                <td>anna.nowak</td>
                <td>user</td>
                ${role === 'root' || role === 'owner' ? '<td>Grupa Główna</td>' : ''}
                ${role === 'root' ? '<td>Inna Firma Sp. k.</td>' : ''}
                ${role !== 'user' ? '<td style="cursor:pointer; text-align:center;">✏️</td>' : ''}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 3: Sprawdź oznaczenia grup</h4>
          <p>W kolumnie "Grupa" możesz zobaczyć:</p>
          <ul>
            <li><strong>Nazwa grupy ⭐</strong> - grupa główna użytkownika</li>
            <li><strong>+X dodatkowe</strong> - przycisk pokazujący dodatkowe grupy (kliknij aby rozwinąć)</li>
            <li>Jako Root/Owner widzisz wszystkie grupy użytkownika</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h3>➕ Dodawanie nowego użytkownika</h3>
          <h4>Krok 1: Otwórz formularz dodawania</h4>
          <p>Kliknij przycisk <strong>"➕ Dodaj użytkownika"</strong> nad listą użytkowników.</p>
          <p><em>Przycisk widoczny tylko dla Root, Owner i Admin.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 2: Wprowadź dane użytkownika</h4>
          <p>Wypełnij formularz:</p>
          <ol>
            <li><strong>Nazwa użytkownika</strong> - unikalna nazwa w systemie</li>
            <li><strong>Hasło</strong> - co najmniej 3 znaki</li>
            <li><strong>Ranga</strong> - wybierz z listy (dostępne rang zależą od Twojej rangi)</li>
            ${role === 'root' ? `
            <li><strong>Grupa główna</strong> - obowiązkowo wybierz grupę główną</li>
            <li><strong>Firma</strong> - opcjonalnie przypisz do firmy (tylko Root)</li>
            <li><strong>Grupy dodatkowe</strong> - opcjonalnie dodaj do dodatkowych grup</li>
            ` : ''}
            ${role === 'owner' ? `
            <li><strong>Grupa</strong> - automatycznie ustawiona na Twoją grupę główną</li>
            <li><strong>Grupy dodatkowe</strong> - opcjonalnie dodaj do swoich dodatkowych grup</li>
            ` : ''}
            ${role === 'admin' ? `
            <li><strong>Grupa</strong> - automatycznie ustawiona na Twoją grupę</li>
            ` : ''}
          </ol>
        </div>
        
        <div class="instructions-step">
          <h4>Krok 3: Potwierdź dodanie</h4>
          <p>Kliknij przycisk <strong>"Dodaj"</strong> aby utworzyć użytkownika.</p>
          <p>Nowy użytkownik pojawi się na liście i otrzyma dostęp do systemu.</p>
        </div>
        
        <div class="instructions-step">
          <h3>✏️ Zarządzanie użytkownikami</h3>
          <h4>Krok 1: Otwórz menu akcji</h4>
          <p>Kliknij ikonę <strong>✏️</strong> przy wybranym użytkowniku w kolumnie "Akcje".</p>
          <p>Otworzy się modalne okno z opcjami zarządzania.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Opcje dostępne w zależności od rang:</h4>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>Akcja</th>
                <th>Root</th>
                <th>Owner</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Zmień hasło</td>
                <td>✅ Wszystkich (oprócz innych root)</td>
                <td>✅ Tylko swoich admin/user</td>
                <td>✅ Tylko swoich user</td>
              </tr>
              <tr>
                <td>Zmień nazwę</td>
                <td>✅ Wszystkich (oprócz siebie)</td>
                <td>✅ Tylko swoich admin/user</td>
                <td>✅ Tylko swoich user</td>
              </tr>
              <tr>
                <td>Zmień rangę</td>
                <td>✅ Wszystkich (oprócz siebie i innych root)</td>
                <td>✅ Tylko swoich admin/user (tylko na admin/user)</td>
                <td>✅ Tylko swoich user (tylko na user)</td>
              </tr>
              <tr>
                <td>Zmień grupę</td>
                <td>✅ Wszystkich</td>
                <td>✅ Tylko swoich admin/user (dodatkowe grupy)</td>
                <td>❌ Brak dostępu</td>
              </tr>
              <tr>
                <td>Zmień firmę</td>
                <td>✅ Wszystkich</td>
                <td>❌ Brak dostępu</td>
                <td>❌ Brak dostępu</td>
              </tr>
              <tr>
                <td>Zarządzaj grupami</td>
                <td>✅ Wszystkich</td>
                <td>✅ Tylko swoich admin/user</td>
                <td>❌ Brak dostępu</td>
              </tr>
              <tr>
                <td>Usuń użytkownika</td>
                <td>✅ Wszystkich (oprócz siebie i innych root)</td>
                <td>✅ Tylko swoich admin/user</td>
                <td>✅ Tylko swoich user</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Szczegółowy opis opcji:</h4>
          
          <div class="instructions-substep">
            <h5>1. Zmiana hasła użytkownika</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Zmień hasło"</strong></li>
              <li>Wprowadź nowe hasło (minimum 3 znaki)</li>
              <li>Kliknij <strong>"Zapisz"</strong></li>
            </ol>
            <p><em>Użytkownik zostanie automatycznie wylogowany ze wszystkich urządzeń.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>2. Zmiana nazwy użytkownika (loginu)</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Zmień nazwę"</strong></li>
              <li>Wprowadź nową nazwę (minimum 2 znaki, inna niż obecna)</li>
              <li>Kliknij <strong>"Zapisz"</strong></li>
            </ol>
            <p><em>Nie możesz zmienić nazwy samemu sobie.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>3. Zmiana rangi użytkownika</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Zmień rangę"</strong></li>
              <li>Wybierz nową rangę z listy (dostępne opcje zależą od Twojej rangi)</li>
              <li>Kliknij <strong>"Zapisz"</strong></li>
            </ol>
            <div class="instructions-warning">
              <p><strong>Hierarchia rang:</strong> root → owner → admin → user</p>
              <p><strong>Możesz zmieniać rangę TYLKO na niższą lub równą swojej.</strong></p>
              <p><strong>Nie możesz:</strong> nadać komuś rangi wyższej niż Twoja, zmienić rangi innym root, zmienić swojej własnej rangi.</p>
            </div>
          </div>
          
          <div class="instructions-substep">
            <h5>4. Zmiana grupy użytkownika</h5>
            <p><strong>Dla Root:</strong></p>
            <ol>
              <li>Możesz zmienić grupę główną dowolnego użytkownika</li>
              <li>Możesz dodać/usuć użytkownika z dodatkowych grup</li>
              <li>Użytkownik musi mieć co najmniej jedną grupę</li>
            </ol>
            
            <p><strong>Dla Owner:</strong></p>
            <ol>
              <li>Możesz zarządzać tylko użytkownikami ze swojej grupy głównej</li>
              <li>Możesz dodawać/usuwać ich ze swoich dodatkowych grup</li>
              <li>Nie możesz zmienić ich grupy głównej (chyba że jest to Twoja grupa)</li>
            </ol>
          </div>
          
          <div class="instructions-substep">
            <h5>5. Zmiana firmy użytkownika (tylko Root)</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Zmień firmę"</strong> (tylko dla Root)</li>
              <li>Wybierz nową firmę z listy lub "brak"</li>
              <li>Kliknij <strong>"Zapisz"</strong></li>
            </ol>
            <p><em>Przypisanie do firmy wpływa na widoczność w module firm i uprawnienia.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>6. Zarządzanie grupami użytkownika</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Zarządzaj grupami"</strong></li>
              <li>Zobaczysz panel z:
                <ul>
                  <li>Grupa główna (z możliwością zmiany dla Root)</li>
                  <li>Lista dodatkowych grup (zaznacz/odznacz)</li>
                </ul>
              </li>
              <li>Wprowadź zmiany i kliknij <strong>"Zapisz"</strong></li>
            </ol>
          </div>
          
          <div class="instructions-substep">
            <h5>7. Usuwanie użytkownika</h5>
            <p><strong>Jak to zrobić:</strong></p>
            <ol>
              <li>Wybierz użytkownika i otwórz menu akcji (✏️)</li>
              <li>Kliknij przycisk <strong>"Usuń użytkownika"</strong></li>
              <li>Potwierdź usunięcie w oknie dialogowym</li>
              <li>Kliknij <strong>"Usuń"</strong></li>
            </ol>
            <div class="instructions-warning">
              <p><strong>⚠️ WAŻNE:</strong></p>
              <ul>
                <li>Nie można usunąć samego siebie</li>
                <li>Nie można usunąć innych użytkowników root</li>
                <li>Usuniętego użytkownika NIE MOŻNA przywrócić!</li>
                <li>Wszystkie dane użytkownika zostaną usunięte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>👁️ Widok własnego konta</h3>
        <div class="instructions-step">
          <h4>Jak rozpoznać swoje konto na liście:</h4>
          <p>Twoje konto jest oznaczone na liście: <strong><span style="color: var(--primary);">(Ty)</span></strong></p>
          <p>W menu akcji dla swojego konta widzisz ograniczone opcje:</p>
          <ul>
            <li><strong>Root:</strong> Możesz tylko zmienić swoje hasło</li>
            <li><strong>Owner:</strong> Możesz zmienić swoje hasło i nazwę</li>
            <li><strong>Admin:</strong> Możesz zmienić swoje hasło i nazwę</li>
            <li><strong>User:</strong> Brak dostępu do edycji (tylko przeglądanie)</li>
          </ul>
        </div>
      </div>
    `;
  }

  if (role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Przeglądanie użytkowników (tylko widok)</h3>
        <div class="instructions-step">
          <h4>Jako Użytkownik możesz tylko:</h4>
          <ul>
            <li>Przeglądać listę użytkowników w swojej grupie</li>
            <li>Widzieć podstawowe informacje o innych użytkownikach</li>
            <li>Rozpoznać swoje konto oznaczone jako <strong><span style="color: var(--primary);">(Ty)</span></strong></li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co NIE możesz zrobić?</h4>
          <ul>
            <li>Dodawać nowych użytkowników</li>
            <li>Zmieniać haseł innych użytkowników</li>
            <li>Zmieniać nazw/ loginów</li>
            <li>Zmieniać rang innych użytkowników</li>
            <li>Zmieniać grup przypisań</li>
            <li>Usuwać użytkowników</li>
            <li>Modyfikować swojego konta (tylko przegląd)</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Co zobaczysz po kliknięciu "Użytkownicy":</h4>
          <div class="instructions-note">
            <p>Zobaczysz tabelę z użytkownikami, ale:</p>
            <ul>
              <li>Brak kolumny "Akcje"</li>
              <li>Brak przycisku "➕ Dodaj użytkownika"</li>
              <li>Możesz tylko przeglądać dane</li>
            </ul>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Potrzebujesz zmian w swoim koncie?</h4>
          <p>Skontaktuj się z osobą mającą rangę <strong>Root</strong>, <strong>Owner</strong> lub <strong>Admin</strong> w swojej grupie aby:</p>
          <ol>
            <li>Zmienić swoje hasło</li>
            <li>Zmienić swoją nazwę użytkownika</li>
            <li>Rozwiązać problemy z dostępem</li>
          </ol>
        </div>
      </div>
    `;
  }

if (role === 'root' || role === 'owner') {
    instructions += `
      <div class="instructions-section">
        <h2 style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🖥️ Instalacja nowego telebimu/urządzenia</h2>
        
        <div class="instructions-step">
          <h3>Instrukcja instalacji oprogramowania na odbiorniki</h3>
          
          <div class="instructions-step">
            <h4>1. Instalacja</h4>
            <p>W zależności od systemu instalujemy najnowszą wersję programu VLC oraz instalujemy JDK Java 22.</p>
            
            <p><strong>VLC:</strong> <a href="https://www.videolan.org/" target="_blank" style="color: var(--primary); text-decoration: underline;">https://www.videolan.org/</a></p>
            <p><strong>Java 22:</strong> <a href="https://www.oracle.com/java/technologies/javase/jdk22-archive-downloads.html" target="_blank" style="color: var(--primary); text-decoration: underline;">https://www.oracle.com/java/technologies/javase/jdk22-archive-downloads.html</a></p>
            
            <p>Następnie pobieramy najnowszą wersję oprogramowania na odbiorniki (przycisk "Pobierz .exe" powyżej) i uruchamiamy.</p>
          </div>
          
          <div class="instructions-step">
            <h4>2. Konfiguracja</h4>
            <p>Przy pierwszym uruchomieniu odbiornik nie będzie widoczny w panelu, żeby go podłączyć trzeba utworzyć najpierw podać adres serwera i token właściciela grupy do której chcemy go przypisać (znaleźć go można w zakładce "Lista Urządzeń" w panelu po kliknięciu przycisku "Auto Deploy Token" i podaniu hasła konta właściciela grupy).</p>
            
            <p>Po utworzeniu tokenu w aplikacji odbiornika naciskamy skrót klawiszowy <strong>ctrl+i</strong> otwierając ustawienia w których podajemy adres i token do ich pól.</p>
            
            <p>Po podaniu adresu serwera i tokenu właściciela klikamy przycisk <strong>Confirm</strong>.</p>
            
            <p>Na tym etapie odbiornik powinien pojawić się w panelu, jeżeli jednak to się nie stało trzeba zwrócić uwagę czy wpisany token i adres serwera są poprawne i jeżeli tak to należy zrestartować aplikację.</p>
            
            <p>Opcjonalnie można jeszcze ustawić domyślny plik który ma się wyświetlać jeżeli nie ma ustawionego żadnego harmonogramu wybierając go w ustawieniach przy opcji <strong>"Select default file to be displayed"</strong>.</p>
          </div>
          
          <div class="instructions-step">
            <h4>3. Gotowość</h4>
            <p>Odbiornik jest gotowy do testów i do użycia.</p>
          </div>
        </div>
      </div>
    `;    
}
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h3>📞 Wsparcie techniczne</h3>
      <div class="instructions-step">
        <h4>Typowe problemy i rozwiązania:</h4>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Rozwiązanie</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nie widzę urządzeń/harmonogramów</td>
              <td>Sprawdź czy jesteś przypisany do grup urządzeń</td>
            </tr>
            <tr>
              <td>Token Auto Deploy nie działa</td>
              <td>Wygeneruj nowy token - każdy token jest jednorazowy</td>
            </tr>
            <tr>
              <td>Nie mogę zapisać harmonogramu - kolizja</td>
              <td>Zmień daty, godziny, dni lub priorytet</td>
            </tr>
            <tr>
              <td>Urządzenie pokazuje status "Offline"</td>
              <td>Sprawdź połączenie internetowe urządzenia</td>
            </tr>
            <tr>
              <td>Plik jest za duży</td>
              <td>Użyj pliku mniejszego niż 50MB</td>
            </tr>
            <tr>
              <td>Nie mogę usunąć firmy/grupy</td>
              <td>Najpierw usuń/przenieś wszystkich przypisanych użytkowników</td>
            </tr>
            <tr>
              <td>Nie mam dostępu do firm/grup</td>
              <td>Tylko Root może zarządzać firmami. Owner i Root mogą zarządzać grupami</td>
            </tr>
            <tr>
              <td>Brak możliwości dodania grupy</td>
              <td>Upewnij się, że masz rangę Root lub Owner</td>
            </tr>
            <tr>
              <td>Nie mogę impersonować innych root</td>
              <td>To zabezpieczenie - nie możesz impersonować innych root</td>
            </tr>
            <tr>
              <td>Brak dostępu do modułu użytkowników</td>
              <td>Sprawdź swoją rangę - tylko root/owner/admin mają pełny dostęp</td>
            </tr>
            <tr>
              <td>Nie mogę zmienić rangi użytkownika</td>
              <td>Możesz zmieniać tylko na rangę niższą lub równą swojej</td>
            </tr>
            <tr>
              <td>Brak przycisku "Dodaj użytkownika"</td>
              <td>Upewnij się, że masz rangę root, owner lub admin</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="instructions-step">
        <p><strong>Potrzebujesz pomocy?</strong> Skontaktuj się z administratorem systemu.</p>
      </div>
    </div>
  `;
  
  return instructions;
}

function getEnglishInstructions(role) {
  let instructions = '';
  
  if (role === 'root' || role === 'owner') {
    instructions = `
      <div class="instructions-section">
        <h3>📋 Viewing Device List</h3>
        <div class="instructions-step">
          <h4>Step 1: Open Device List</h4>
          <p>Click the "Devices" button in the main system menu.</p>
          ${role === 'root' ? '<p><em>As Root you will see ALL devices in the system.</em></p>' : '<p><em>As Owner you will only see devices from your groups.</em></p>'}
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Understand the Table</h4>
          <p>A table with devices will appear:</p>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>UUID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>594c9fdf-7968-42eb-96ed-bfc948a37b5a</td>
                <td>Example name</td>
                <td><span class="status-badge status-online">Online</span></td>
                <td style="cursor:pointer; text-align:center;">✏️</td>
              </tr>
              <tr>
                <td>876c9fdf-7938-44eb-56ed-bfc543a37b7a</td>
                <td>Example name #2</td>
                <td><span class="status-badge status-offline">Offline</span></td>
                <td style="cursor:pointer; text-align:center;">✏️</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Step 3: Check Status</h4>
          <p>In the top right corner you will see counter: <strong>"Connected: X/Y"</strong></p>
          <ul>
            <li><strong>X</strong> - number of devices currently online</li>
            <li><strong>Y</strong> - total number of devices</li>
          </ul>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>🔑 Adding New Devices (Auto Deploy Token)</h3>
        <div class="instructions-step">
          <h4>Step 1: Open Token Generator</h4>
          <p>Click the <strong>"🔑 Auto Deploy Token"</strong> button in the devices panel.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Enter Password</h4>
          <p>In the "Your password" field, enter your current password for verification.</p>
          <p><em>This security measure protects against unauthorized token generation.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 3: Generate Token</h4>
          <p>Click the <strong>"Generate Token"</strong> button.</p>
          <p>The system will generate a unique token valid for one-time use only.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 4: Copy Token</h4>
          <p>After generating the token:</p>
          <ol>
            <li>Click the <strong>"Copy"</strong> button to copy the token to clipboard</li>
            <li>Or select token and use Ctrl+C</li>
          </ol>
          <div class="instructions-warning">
            <strong>⚠️ IMPORTANT:</strong> Token will be displayed only once! Save it in a secure place.
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Step 5: Register Device</h4>
          <p>Use the copied token in the telebim application:</p>
          <ol>
            <li>Open telebim application on the device</li>
            <li>Enter the generated token in the appropriate field</li>
            <li>The device will automatically connect to the system</li>
            <li>New device will appear on the list</li>
          </ol>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>✏️ Managing Existing Devices</h3>
        
        <div class="instructions-step">
          <h4>Step 1: Open Action Menu</h4>
          <p>Click the <strong>✏️</strong> icon next to the selected device in the "Actions" column.</p>
          <p>A modal window with management options will open.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Option 1: Changing Device Name</h4>
          <p><strong>How to do it:</strong></p>
          <ol>
            <li>Click the <strong>"Change Name"</strong> button</li>
            <li>Enter new name in the text field</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
          <p><strong>Requirements:</strong> New name must be at least 2 characters and different from current name.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Option 2: Changing Device Group</h4>
          <p><strong>How to do it:</strong></p>
          <ol>
            <li>Click the <strong>"${role === 'root' ? 'Change Device Group' : 'Change Device Group (Owner)'}"</strong> button</li>
            <li>Select new group from dropdown list</li>
            <li>Click <strong>"Save Group Change"</strong></li>
          </ol>
          ${role === 'owner' ? `
            <div class="instructions-note">
              <strong>ℹ️ Note for Owner:</strong> You can move devices ONLY between your own groups.
              Main group is marked with ⭐.
            </div>
          ` : ''}
        </div>
        
        <div class="instructions-step">
          <h4>Option 3: Deleting Device</h4>
          <p><strong>How to do it:</strong></p>
          <ol>
            <li>Click the <strong>"Delete Device"</strong> button</li>
            <li>Confirm deletion in the dialog window</li>
            <li>Click <strong>"Delete"</strong></li>
          </ol>
          <div class="instructions-warning">
            <strong>⚠️ WARNING:</strong> Deleted devices CANNOT be restored!
            This operation is irreversible.
          </div>
        </div>
      </div>
      
      <div class="instructions-section">
        <h3>🔄 Refreshing Device List</h3>
        <div class="instructions-step">
          <h4>Step 1: Find Refresh Button</h4>
          <p>Click the <strong>🔄</strong> button in the top right corner of the devices panel.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Wait for Update</h4>
          <p>The system will:</p>
          <ol>
            <li>Fetch current status of all devices (online/offline)</li>
            <li>Update the "Connected: X/Y" counter</li>
            <li>Refresh status in the table (green/blue for online, gray for offline)</li>
          </ol>
          <p><em>Automatic message will confirm successful refresh.</em></p>
        </div>
      </div>
    `;
  }
  
  if (role === 'admin' || role === 'user') {
    instructions = `
      <div class="instructions-section">
        <h3>❌ No Access to Device Management</h3>
        <div class="instructions-step">
          <h4>As ${role === 'admin' ? 'Administrator' : 'User'} you don't have permissions to:</h4>
          <ul>
            <li>View telebim list</li>
            <li>Add new devices</li>
            <li>Change device names</li>
            <li>Move devices between groups</li>
            <li>Delete devices</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you will see after clicking "Devices":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"You have no devices assigned to your groups"</strong></p>
            <p>These are normal messages for your role.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>What can you do?</h4>
          <p>Contact a person with <strong>Root</strong> or <strong>Owner</strong> role to:</p>
          <ol>
            <li>Assign you to appropriate device groups</li>
            <li>Grant you higher permissions if necessary</li>
          </ol>
        </div>
      </div>
    `;
  }
  
  instructions += `
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">📅 Schedules</h2>
  `;
  
  if (role === 'root' || role === 'owner' || role === 'admin') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Viewing Schedules</h3>
        <h4>Step 1: Open Schedules Module</h4>
        <p>Click the "Schedules" button in the main system menu.</p>
        <p>A panel with device selection and schedule list will open.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Select Device</h4>
        <p>From the dropdown list, select the billboard whose schedules you want to view.</p>
        ${role === 'admin' ? '<p><em>As Admin you only see devices from your groups.</em></p>' : ''}
        ${role === 'owner' ? '<p><em>As Owner you only see devices from your groups.</em></p>' : ''}
        ${role === 'root' ? '<p><em>As Root you see ALL devices in the system.</em></p>' : ''}
      </div>
      
      <div class="instructions-step">
        <h4>Step 3: Understand Schedule List</h4>
        <p>After selecting device, you'll see schedule list:</p>
        <ul>
          <li><strong>Task Name</strong> - schedule title</li>
          <li><strong>Status</strong> - active/paused</li>
          <li><strong>File Preview</strong> - image/video thumbnail</li>
          <li><strong>Dates</strong> - validity date range</li>
          <li><strong>Hours</strong> - display hours</li>
          <li><strong>Repeat</strong> - days of week</li>
          <li><strong>Actions</strong> - edit and delete buttons</li>
        </ul>
      </div>
      
      <div class="instructions-step">
        <h3>➕ Creating New Schedule</h3>
        <h4>Step 1: Open Form</h4>
        <p>Click the <strong>"➕ Add Schedule"</strong> button in top right corner.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Select File</h4>
        <p>You have two options for adding file:</p>
        <ul>
          <li><strong>Select from gallery</strong> - browse available images and videos</li>
          <li><strong>Upload new</strong> - drag file or click to select (max 50MB)</li>
        </ul>
        <p>Supported formats: JPG, PNG, GIF, WebP, SVG, BMP, MP4, WebM, AVI, MOV, MKV, OGG</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 3: Set Dates and Times</h4>
        <p>Configure display time:</p>
        <ol>
          <li><strong>Start/End Date</strong> - validity range</li>
          <li><strong>Start/End Time</strong> - format HH:MM:SS</li>
          <li><strong>Additional Hours</strong> - click "+ Add hour" for multiple time slots</li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Step 4: Select Repeat Days</h4>
        <p>Check days of week when schedule should repeat.</p>
        <p>You can use presets: "Everyday", "Weekdays", "Weekend".</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 5: Set Priority</h4>
        <p>Choose priority from 0 (lowest) to 2 (highest):</p>
        <div class="instructions-note">
          <ul>
            <li><strong>Priority 0:</strong> Cannot collide with any schedule</li>
            <li><strong>Priority 1:</strong> Can only collide with other Priority 1</li>
            <li><strong>Priority 2:</strong> Can only collide with other Priority 2</li>
          </ul>
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Editing Schedules</h3>
        <p>Click <strong>"Edit"</strong> button next to selected schedule.</p>
        <p>Schedules with same parameters are grouped - editing affects entire group.</p>
      </div>
      
      <div class="instructions-step">
        <h3>🗑️ Deleting Schedules</h3>
        <p>You have three deletion options:</p>
        <ol>
          <li><strong>Delete single</strong> - click "Delete" next to schedule</li>
          <li><strong>Bulk delete</strong> - select multiple schedules and use bulk actions bar</li>
          <li><strong>Delete file with schedules</strong> - click 🗑️ in gallery (deletes file and ALL related schedules!)</li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h3>👁️ Schedule Visualization</h3>
        <p>Click <strong>"👁️ Visualize"</strong> button to see weekly calendar.</p>
        <p>Colored blocks show schedules, outlines indicate collisions:</p>
        <ul>
          <li><strong>Red</strong> - priority 0 in collision</li>
          <li><strong>Orange</strong> - priority 1 in collision</li>
          <li><strong>Yellow</strong> - priority 2 in collision</li>
        </ul>
      </div>
      
      <div class="instructions-step">
        <h3>⚠️ Schedule Collisions</h3>
        <p>Collision occurs when two schedules have overlapping hours on same day.</p>
        <p>If system detects collision, it will show window with list of conflicting schedules.</p>
        <p>To resolve collision: change dates/times, days or priority.</p>
      </div>
    `;
  }
  
  if (role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ Limited Access to Schedules</h3>
        <p>As User you can only:</p>
        <ul>
          <li>View schedules for devices from your groups</li>
          <li>View schedule visualization</li>
        </ul>
        <p><strong>You CANNOT:</strong> create, edit, delete schedules or upload files.</p>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🏢 Companies</h2>
  `;
  
  if (role === 'root') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Viewing Company List</h3>
        <h4>Step 1: Open Companies Module</h4>
        <p>Click the "Companies" button in the main system menu.</p>
        <p><em>Only users with <strong>Root</strong> role have access to this module.</em></p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Understand the Company Table</h4>
        <p>A table with list of all companies in the system will appear:</p>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Example Sp. z o.o.</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
            <tr>
              <td>Another Company Sp. k.</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="instructions-step">
        <h3>➕ Adding New Company</h3>
        <h4>Step 1: Open Add Form</h4>
        <p>Click the <strong>"🏢 Add Company"</strong> button above the company list.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Enter Company Name</h4>
        <p>Enter the name of the new company in the text field.</p>
        <p><strong>Requirements:</strong> Name must be at least 2 characters.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 3: Confirm Addition</h4>
        <p>Click the <strong>"Add"</strong> button to create the company.</p>
        <p>New company will appear on the list after successful addition.</p>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Managing Companies</h3>
        <h4>Step 1: Open Action Menu</h4>
        <p>Click the <strong>✏️</strong> icon next to the selected company in the "Actions" column.</p>
        <p>A modal window with management options will open.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Option 1: Changing Company Name</h4>
        <p><strong>How to do it:</strong></p>
        <ol>
          <li>Click the <strong>"Change Name"</strong> button</li>
          <li>Enter new company name</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Option 2: Deleting Company</h4>
        <p><strong>How to do it:</strong></p>
        <ol>
          <li>Click the <strong>"Delete Company"</strong> button</li>
          <li>Confirm deletion in the dialog window</li>
          <li>Click <strong>"Delete"</strong></li>
        </ol>
        <div class="instructions-warning">
          <strong>⚠️ WARNING:</strong> Cannot delete company if it has assigned users!
          First move or delete all users from this company.
        </div>
      </div>
    `;
  }
  
  if (role === 'owner' || role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ No Access to Company Management</h3>
        <div class="instructions-step">
          <h4>As ${role === 'owner' ? 'Owner' : role === 'admin' ? 'Administrator' : 'User'} you don't have permissions to:</h4>
          <ul>
            <li>View company list</li>
            <li>Add new companies</li>
            <li>Change company names</li>
            <li>Delete companies</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you will see after clicking "Companies":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"Only root can manage companies"</strong></p>
            <p>This is a normal message for your role.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">👥 Groups</h2>
  `;
  
  if (role === 'root' || role === 'owner') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Viewing Groups</h3>
        <h4>Step 1: Open Groups Module</h4>
        <p>Click the "Groups" button in the main system menu.</p>
        ${role === 'root' ? '<p><em>As Root you see ALL groups in the system.</em></p>' : '<p><em>As Owner you only see your own groups.</em></p>'}
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Understand Group Structure</h4>
    `;
    
    if (role === 'root') {
      instructions += `
        <p>A table with all groups in the system will appear:</p>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Main Group</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
            <tr>
              <td>Additional Group 1</td>
              <td style="cursor:pointer; text-align:center;">✏️</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      instructions += `
        <p>You see division into two sections:</p>
        <div class="instructions-note">
          <ul>
            <li><strong>Main group ⭐</strong> - Your primary group (can have only one)</li>
            <li><strong>Additional groups</strong> - additional groups you belong to</li>
          </ul>
        </div>
      `;
    }
    
    instructions += `
      </div>
      
      <div class="instructions-step">
        <h3>➕ Creating New Group</h3>
        <h4>Step 1: Open Add Form</h4>
        <p>Click the <strong>"👥 Add Group"</strong> button above the group list.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Step 2: Enter Group Name</h4>
        <p>Enter the name of the new group in the text field.</p>
        <p><strong>Requirements:</strong> Name must be at least 2 characters.</p>
        ${role === 'owner' ? '<p><em>As Owner new group will be automatically added to your additional groups.</em></p>' : ''}
      </div>
      
      <div class="instructions-step">
        <h4>Step 3: Confirm Addition</h4>
        <p>Click the <strong>"Add"</strong> button to create the group.</p>
        <p>New group will appear on the list after successful addition.</p>
      </div>
      
      <div class="instructions-step">
        <h3>✏️ Managing Groups</h3>
        <h4>Step 1: Open Action Menu</h4>
        <p>Click the <strong>✏️</strong> icon next to the selected group.</p>
        <p>A modal window with management options will open.</p>
      </div>
      
      <div class="instructions-step">
        <h4>Option 1: Changing Group Name</h4>
        <p><strong>How to do it:</strong></p>
        <ol>
          <li>Click the <strong>"Change Name"</strong> button</li>
          <li>Enter new group name</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>
      </div>
      
      <div class="instructions-step">
        <h4>Option 2: Deleting Group</h4>
        <p><strong>How to do it:</strong></p>
        <ol>
          <li>Click the <strong>"Delete Group"</strong> button</li>
          <li>Confirm deletion in the dialog window</li>
          <li>Click <strong>"Delete"</strong></li>
        </ol>
        <div class="instructions-warning">
          <strong>⚠️ WARNING:</strong> Cannot delete group if it has assigned users!
          First move or delete all users from this group.
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>ℹ️ Group Information</h3>
        <div class="instructions-note">
          <ul>
            <li><strong>Groups are used to organize devices and users</strong></li>
            <li><strong>Devices can belong to only one group</strong></li>
            <li><strong>Users can have one main group and multiple additional groups</strong></li>
            <li><strong>Permissions depend on group membership</strong></li>
          </ul>
        </div>
      </div>
    `;
  }
  
  if (role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Viewing Assigned Groups</h3>
        <div class="instructions-step">
          <h4>As ${role === 'admin' ? 'Administrator' : 'User'} you can only:</h4>
          <ul>
            <li>View your groups (main and additional)</li>
            <li>See your permission structure</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you will see after clicking "Groups":</h4>
          <div class="instructions-note">
            <p>Your groups are divided into two sections:</p>
            <ol>
              <li><strong>Main group ⭐</strong> - Your primary group</li>
              <li><strong>Additional groups</strong> - additional groups you belong to</li>
            </ol>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>What you CANNOT do?</h4>
          <ul>
            <li>Create new groups</li>
            <li>Change group names</li>
            <li>Delete groups</li>
            <li>Modify group assignments</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>Need changes in groups?</h4>
          <p>Contact a person with <strong>Root</strong> or <strong>Owner</strong> role to:</p>
          <ol>
            <li>Assign you to other groups</li>
            <li>Change your main group</li>
            <li>Add new groups to your permissions</li>
          </ol>
        </div>
      </div>
    `;
  }
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🔄 Impersonation (Role Switching)</h2>
  `;

  if (role === 'root') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Viewing as Another User/Company</h3>
        <div class="instructions-step">
          <h4>Step 1: Open Impersonation Module</h4>
          <p>Click the <strong>"🔄 Impersonation"</strong> button in the main system menu.</p>
          <p><em>Only users with <strong>Root</strong> role have access to this module.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Choose Impersonation Type</h4>
          <p>The module has two tabs:</p>
          <ul>
            <li><strong>🏢 Companies</strong> - view system as a company (company owner view)</li>
            <li><strong>👥 Users</strong> - view system as specific user</li>
          </ul>
          <div class="instructions-note">
            <p><strong>Company View:</strong> You see system as Company Owner would see it.</p>
            <p><strong>User View:</strong> You see system with permissions and view of selected user.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Step 3: Select Company or User</h4>
          <p><strong>For companies:</strong></p>
          <ol>
            <li>Go to <strong>🏢 Companies</strong> tab</li>
            <li>You'll see list of all companies in system</li>
            <li>Each company shows:
              <ul>
                <li>Company name</li>
                <li>Number of users in company</li>
                <li>Owner availability status (✅ available / ⚠️ unavailable)</li>
              </ul>
            </li>
            <li>Click <strong>"View as Owner"</strong> or <strong>"View Company"</strong> next to selected company</li>
          </ol>
          
          <p><strong>For users:</strong></p>
          <ol>
            <li>Go to <strong>👥 Users</strong> tab</li>
            <li>You'll see list of all users in system (except other roots)</li>
            <li>Each user shows:
              <ul>
                <li>Username</li>
                <li>Company (if assigned)</li>
                <li>Role (owner/admin/user)</li>
              </ul>
            </li>
            <li>Click <strong>"Impersonate User"</strong> next to selected user</li>
          </ol>
        </div>
        
        <div class="instructions-step">
          <h4>Step 4: Confirm Impersonation</h4>
          <p>After selecting company/user, confirmation window will appear:</p>
          <ul>
            <li>Read information about whose role you're entering</li>
            <li>For companies: additional information about receiving root access to this company</li>
            <li>Click <strong>"Confirm"</strong> to continue</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h3>ℹ️ Impersonation Status Bar</h3>
          <p>After starting impersonation, yellow information bar will appear at top of screen:</p>
          <div class="instructions-note" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px;">
            <p><strong>🔄 Viewing as: [Company/User name]</strong></p>
            <p>Logged in as root: [Your root name]</p>
            <button style="background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Stop Viewing</button>
          </div>
          <p>This bar:
            <ul>
              <li>Shows who you're currently impersonating</li>
              <li>Reminds you that you're logged in as root</li>
              <li>Contains button for quick impersonation end</li>
            </ul>
          </p>
        </div>
        
        <div class="instructions-step">
          <h3>🚪 Ending Impersonation</h3>
          <p>You can end impersonation in three ways:</p>
          <ol>
            <li><strong>Status bar button:</strong> Click <strong>"Stop Viewing"</strong> on yellow bar</li>
            <li><strong>Impersonation module button:</strong> Click <strong>"End Impersonation"</strong> in module</li>
            <li><strong>Direct switch:</strong> Start new impersonation (previous one automatically ends)</li>
          </ol>
        </div>
        
        <div class="instructions-step">
          <h3>🎯 Purpose and Uses of Impersonation</h3>
          <div class="instructions-note">
            <p><strong>Impersonation is used for:</strong></p>
            <ul>
              <li><strong>Troubleshooting:</strong> Check what user reporting problem sees</li>
              <li><strong>Permission testing:</strong> Verify if permissions are correctly set</li>
              <li><strong>Technical support:</strong> Perform actions on behalf of user</li>
              <li><strong>Audit:</strong> Check system functionality from different perspectives</li>
              <li><strong>Company configuration:</strong> Configure settings for company from owner level</li>
            </ul>
          </div>
        </div>
        
        <div class="instructions-step">
          <h3>⚠️ Security and Limitations</h3>
          <div class="instructions-warning">
            <p><strong>IMPORTANT security rules:</strong></p>
            <ul>
              <li>You cannot impersonate other root users</li>
              <li>All actions are logged in system logs</li>
              <li>After ending impersonation you automatically return to your root account</li>
              <li>You cannot change password during impersonation</li>
              <li>You cannot delete or edit your own root account during impersonation</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  if (role === 'owner' || role === 'admin' || role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>❌ No Access to Impersonation</h3>
        <div class="instructions-step">
          <h4>As ${role === 'owner' ? 'Owner' : role === 'admin' ? 'Administrator' : 'User'} you don't have permissions to:</h4>
          <ul>
            <li>View system as other users</li>
            <li>View system as other companies</li>
            <li>Use impersonation module</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you will see after clicking "🔄 Impersonation":</h4>
          <div class="instructions-note" style="background: var(--danger-light); color: var(--danger); padding: 15px; border-radius: 8px;">
            <p><strong>"Only root can use impersonation"</strong> or button will be hidden</p>
            <p>This is normal message for your role.</p>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>If you see impersonation bar:</h4>
          <p>If you see yellow bar at top of screen with viewing information, it means:</p>
          <ol>
            <li>Root administrator is currently viewing system from your perspective</li>
            <li>This may be related to technical support or problem solving</li>
            <li>All your data is safe</li>
            <li>After support ends, bar will disappear</li>
          </ol>
        </div>
      </div>
    `;
  }

  instructions += `
    </div>
    
    <div class="instructions-section">
      <h2 style="margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">👥 Users</h2>
  `;

  if (role === 'root' || role === 'owner' || role === 'admin') {
    instructions += `
      <div class="instructions-step">
        <h3>📋 Viewing User List</h3>
        <div class="instructions-step">
          <h4>Step 1: Open Users Module</h4>
          <p>Click the "Users" button in the main system menu.</p>
          ${role === 'root' ? '<p><em>As Root you will see ALL users in the system.</em></p>' : ''}
          ${role === 'owner' ? '<p><em>As Owner you will only see users from your groups.</em></p>' : ''}
          ${role === 'admin' ? '<p><em>As Admin you will only see users from your group.</em></p>' : ''}
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Understand User Table</h4>
          <p>A table with users will appear:</p>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                ${role === 'root' || role === 'owner' ? '<th>Group</th>' : ''}
                ${role === 'root' ? '<th>Company</th>' : ''}
                ${role !== 'user' ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>john.doe <span style="color: var(--primary); font-weight: bold;">(You)</span></td>
                <td>${role === 'root' ? 'root' : role === 'owner' ? 'owner' : 'admin'}</td>
                ${role === 'root' || role === 'owner' ? '<td>Main Group ⭐ +2 additional</td>' : ''}
                ${role === 'root' ? '<td>Example Ltd.</td>' : ''}
                ${role !== 'user' ? '<td style="cursor:pointer; text-align:center;">✏️</td>' : ''}
              </tr>
              <tr>
                <td>anna.smith</td>
                <td>user</td>
                ${role === 'root' || role === 'owner' ? '<td>Main Group</td>' : ''}
                ${role === 'root' ? '<td>Another Company LLC</td>' : ''}
                ${role !== 'user' ? '<td style="cursor:pointer; text-align:center;">✏️</td>' : ''}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Step 3: Check Group Markings</h4>
          <p>In "Group" column you can see:</p>
          <ul>
            <li><strong>Group name ⭐</strong> - user's main group</li>
            <li><strong>+X additional</strong> - button showing additional groups (click to expand)</li>
            <li>As Root/Owner you see all user's groups</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h3>➕ Adding New User</h3>
          <h4>Step 1: Open Add Form</h4>
          <p>Click the <strong>"➕ Add User"</strong> button above user list.</p>
          <p><em>Button visible only for Root, Owner and Admin.</em></p>
        </div>
        
        <div class="instructions-step">
          <h4>Step 2: Enter User Data</h4>
          <p>Fill the form:</p>
          <ol>
            <li><strong>Username</strong> - unique name in system</li>
            <li><strong>Password</strong> - at least 3 characters</li>
            <li><strong>Role</strong> - choose from list (available roles depend on your role)</li>
            ${role === 'root' ? `
            <li><strong>Main group</strong> - mandatory, select main group</li>
            <li><strong>Company</strong> - optionally assign to company (only Root)</li>
            <li><strong>Additional groups</strong> - optionally add to additional groups</li>
            ` : ''}
            ${role === 'owner' ? `
            <li><strong>Group</strong> - automatically set to your main group</li>
            <li><strong>Additional groups</strong> - optionally add to your additional groups</li>
            ` : ''}
            ${role === 'admin' ? `
            <li><strong>Group</strong> - automatically set to your group</li>
            ` : ''}
          </ol>
        </div>
        
        <div class="instructions-step">
          <h4>Step 3: Confirm Addition</h4>
          <p>Click the <strong>"Add"</strong> button to create user.</p>
          <p>New user will appear on list and receive system access.</p>
        </div>
        
        <div class="instructions-step">
          <h3>✏️ Managing Users</h3>
          <h4>Step 1: Open Action Menu</h4>
          <p>Click the <strong>✏️</strong> icon next to selected user in "Actions" column.</p>
          <p>A modal window with management options will open.</p>
        </div>
        
        <div class="instructions-step">
          <h4>Options available depending on roles:</h4>
          <table class="instructions-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Root</th>
                <th>Owner</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Change Password</td>
                <td>✅ All (except other roots)</td>
                <td>✅ Only own admin/user</td>
                <td>✅ Only own user</td>
              </tr>
              <tr>
                <td>Change Name</td>
                <td>✅ All (except self)</td>
                <td>✅ Only own admin/user</td>
                <td>✅ Only own user</td>
              </tr>
              <tr>
                <td>Change Role</td>
                <td>✅ All (except self and other roots)</td>
                <td>✅ Only own admin/user (only to admin/user)</td>
                <td>✅ Only own user (only to user)</td>
              </tr>
              <tr>
                <td>Change Group</td>
                <td>✅ All</td>
                <td>✅ Only own admin/user (additional groups)</td>
                <td>❌ No access</td>
              </tr>
              <tr>
                <td>Change Company</td>
                <td>✅ All</td>
                <td>❌ No access</td>
                <td>❌ No access</td>
              </tr>
              <tr>
                <td>Manage Groups</td>
                <td>✅ All</td>
                <td>✅ Only own admin/user</td>
                <td>❌ No access</td>
              </tr>
              <tr>
                <td>Delete User</td>
                <td>✅ All (except self and other roots)</td>
                <td>✅ Only own admin/user</td>
                <td>✅ Only own user</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="instructions-step">
          <h4>Detailed option description:</h4>
          
          <div class="instructions-substep">
            <h5>1. Changing User Password</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Change Password"</strong> button</li>
              <li>Enter new password (minimum 3 characters)</li>
              <li>Click <strong>"Save"</strong></li>
            </ol>
            <p><em>User will be automatically logged out from all devices.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>2. Changing Username (login)</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Change Name"</strong> button</li>
              <li>Enter new name (minimum 2 characters, different from current)</li>
              <li>Click <strong>"Save"</strong></li>
            </ol>
            <p><em>You cannot change your own name.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>3. Changing User Role</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Change Role"</strong> button</li>
              <li>Select new role from list (available options depend on your role)</li>
              <li>Click <strong>"Save"</strong></li>
            </ol>
            <div class="instructions-warning">
              <p><strong>Role hierarchy:</strong> root → owner → admin → user</p>
              <p><strong>You can change role ONLY to lower or equal to yours.</strong></p>
              <p><strong>You cannot:</strong> give someone role higher than yours, change other roots' roles, change your own role.</p>
            </div>
          </div>
          
          <div class="instructions-substep">
            <h5>4. Changing User Group</h5>
            <p><strong>For Root:</strong></p>
            <ol>
              <li>You can change main group of any user</li>
              <li>You can add/remove user from additional groups</li>
              <li>User must have at least one group</li>
            </ol>
            
            <p><strong>For Owner:</strong></p>
            <ol>
              <li>You can manage only users from your main group</li>
              <li>You can add/remove them from your additional groups</li>
              <li>You cannot change their main group (unless it's your group)</li>
            </ol>
          </div>
          
          <div class="instructions-substep">
            <h5>5. Changing User Company (Root only)</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Change Company"</strong> button (only for Root)</li>
              <li>Select new company from list or "none"</li>
              <li>Click <strong>"Save"</strong></li>
            </ol>
            <p><em>Company assignment affects visibility in companies module and permissions.</em></p>
          </div>
          
          <div class="instructions-substep">
            <h5>6. Managing User Groups</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Manage Groups"</strong> button</li>
              <li>You'll see panel with:
                <ul>
                  <li>Main group (with change option for Root)</li>
                  <li>Additional groups list (check/uncheck)</li>
                </ul>
              </li>
              <li>Make changes and click <strong>"Save"</strong></li>
            </ol>
          </div>
          
          <div class="instructions-substep">
            <h5>7. Deleting User</h5>
            <p><strong>How to do it:</strong></p>
            <ol>
              <li>Select user and open action menu (✏️)</li>
              <li>Click the <strong>"Delete User"</strong> button</li>
              <li>Confirm deletion in dialog window</li>
              <li>Click <strong>"Delete"</strong></li>
            </ol>
            <div class="instructions-warning">
              <p><strong>⚠️ IMPORTANT:</strong></p>
              <ul>
                <li>Cannot delete yourself</li>
                <li>Cannot delete other root users</li>
                <li>Deleted user CANNOT be restored!</li>
                <li>All user data will be deleted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="instructions-step">
        <h3>👁️ Viewing Your Own Account</h3>
        <div class="instructions-step">
          <h4>How to recognize your account on list:</h4>
          <p>Your account is marked on list: <strong><span style="color: var(--primary);">(You)</span></strong></p>
          <p>In action menu for your account you see limited options:</p>
          <ul>
            <li><strong>Root:</strong> You can only change your password</li>
            <li><strong>Owner:</strong> You can change your password and name</li>
            <li><strong>Admin:</strong> You can change your password and name</li>
            <li><strong>User:</strong> No edit access (only viewing)</li>
          </ul>
        </div>
      </div>
    `;
  }

  if (role === 'user') {
    instructions += `
      <div class="instructions-step">
        <h3>👁️ Viewing Users (view only)</h3>
        <div class="instructions-step">
          <h4>As User you can only:</h4>
          <ul>
            <li>View list of users in your group</li>
            <li>See basic information about other users</li>
            <li>Recognize your account marked as <strong><span style="color: var(--primary);">(You)</span></strong></li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you CANNOT do?</h4>
          <ul>
            <li>Add new users</li>
            <li>Change other users' passwords</li>
            <li>Change names/logins</li>
            <li>Change other users' roles</li>
            <li>Change group assignments</li>
            <li>Delete users</li>
            <li>Modify your own account (only view)</li>
          </ul>
        </div>
        
        <div class="instructions-step">
          <h4>What you will see after clicking "Users":</h4>
          <div class="instructions-note">
            <p>You'll see table with users, but:</p>
            <ul>
              <li>No "Actions" column</li>
              <li>No "➕ Add User" button</li>
              <li>You can only view data</li>
            </ul>
          </div>
        </div>
        
        <div class="instructions-step">
          <h4>Need changes in your account?</h4>
          <p>Contact person with <strong>Root</strong>, <strong>Owner</strong> or <strong>Admin</strong> role in your group to:</p>
          <ol>
            <li>Change your password</li>
            <li>Change your username</li>
            <li>Solve access problems</li>
          </ol>
        </div>
      </div>
    `;
  }

if (role === 'root' || role === 'owner') {
    instructions += `
      <div class="instructions-section">
        <h2 style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">🖥️ New Telebim/Device Installation</h2>
        
        <div class="instructions-step">
          <h3>Receiver Software Installation Guide</h3>
          
          <div class="instructions-step">
            <h4>1. Installation</h4>
            <p>Depending on the system, install the latest version of VLC program and install JDK Java 22.</p>
            
            <p><strong>VLC:</strong> <a href="https://www.videolan.org/" target="_blank" style="color: var(--primary); text-decoration: underline;">https://www.videolan.org/</a></p>
            <p><strong>Java 22:</strong> <a href="https://www.oracle.com/java/technologies/javase/jdk22-archive-downloads.html" target="_blank" style="color: var(--primary); text-decoration: underline;">https://www.oracle.com/java/technologies/javase/jdk22-archive-downloads.html</a></p>
            
            <p>Then download the latest version of receiver software (click "Download .exe" button above) and run it.</p>
          </div>
          
          <div class="instructions-step">
            <h4>2. Configuration</h4>
            <p>On first run, the receiver will not be visible in the panel. To connect it you need to first provide the server address and the token of the group owner to which we want to assign it (you can find it in the "Device List" tab in the panel by clicking the "Auto Deploy Token" button and entering the group owner account password).</p>
            
            <p>After creating the token in the receiver application, press the keyboard shortcut <strong>ctrl+i</strong> opening the settings where we enter the address and token into their fields.</p>
            
            <p>After providing the server address and owner token, click the <strong>Confirm</strong> button.</p>
            
            <p>At this stage, the receiver should appear in the panel. If it did not happen, pay attention to whether the entered token and server address are correct and if so, restart the application.</p>
            
            <p>Optionally, you can set a default file to be displayed if no schedule is set by selecting it in the settings under the option <strong>"Select default file to be displayed"</strong>.</p>
          </div>
          
          <div class="instructions-step">
            <h4>3. Readiness</h4>
            <p>The receiver is ready for testing and use.</p>
          </div>
        </div>
      </div>
    `;
}
  
  instructions += `
    </div>
    
    <div class="instructions-section">
      <h3>📞 Technical Support</h3>
      <div class="instructions-step">
        <h4>Common Problems and Solutions:</h4>
        <table class="instructions-table">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Solution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>I don't see devices/schedules</td>
              <td>Check if you are assigned to device groups</td>
            </tr>
            <tr>
              <td>Auto Deploy token doesn't work</td>
              <td>Generate new token - each token is single-use</td>
            </tr>
            <tr>
              <td>Can't save schedule - collision</td>
              <td>Change dates, times, days or priority</td>
            </tr>
            <tr>
              <td>Device shows "Offline" status</td>
              <td>Check device internet connection</td>
            </tr>
            <tr>
              <td>File is too large</td>
              <td>Use file smaller than 50MB</td>
            </tr>
            <tr>
              <td>Cannot delete company/group</td>
              <td>First remove/move all assigned users</td>
            </tr>
            <tr>
              <td>No access to companies/groups</td>
              <td>Only Root can manage companies. Owner and Root can manage groups</td>
            </tr>
            <tr>
              <td>Cannot add group</td>
              <td>Make sure you have Root or Owner role</td>
            </tr>
            <tr>
              <td>Cannot impersonate other root</td>
              <td>This is security feature - you cannot impersonate other roots</td>
            </tr>
            <tr>
              <td>No access to users module</td>
              <td>Check your role - only root/owner/admin have full access</td>
            </tr>
            <tr>
              <td>Cannot change user role</td>
              <td>You can change only to role lower or equal to yours</td>
            </tr>
            <tr>
              <td>No "Add User" button</td>
              <td>Make sure you have root, owner or admin role</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="instructions-step">
        <p><strong>Need help?</strong> Contact system administrator.</p>
      </div>
    </div>
  `;
  
  return instructions;
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById("openInstructionsBtn")) {
    window.initializeInstructionsElements();
  }
});