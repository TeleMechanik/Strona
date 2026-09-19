# 📺 TeleMechanik

System do zarządzania siecią telebimów / ekranów digital signage — panel webowy do sterowania treścią wyświetlaną na wielu urządzeniach jednocześnie, wraz z harmonogramowaniem, zarządzaniem użytkownikami, grupami urządzeń i firmami.

> 🎓 **Projekt szkolny.** Aplikacja została stworzona podczas praktyk szkolnych, jako projekt zaliczeniowy praktyk zawodowych. Powstała w celach edukacyjnych — część rozwiązań (np. dane logowania do bazy, sekret sesji) jest uproszczona i **nie nadaje się do użytku produkcyjnego bez dodatkowej konfiguracji bezpieczeństwa** (patrz sekcja [Znane problemy](#-znane-problemy--do-poprawy)).

---

## ✨ Funkcje

- **Panel administracyjny** (`dashboard.html`) z kafelkami do zarządzania poszczególnymi modułami
- **Zarządzanie telebimami** — podgląd statusu (online/offline), zmiana nazwy, przypisywanie do grup, usuwanie
- **Harmonogramy wyświetlania** — planowanie, kiedy i na którym urządzeniu ma pojawić się dana treść (zakres dat, godzin, powtarzanie w wybrane dni tygodnia, priorytety, wykrywanie kolizji terminów)
- **Zarządzanie plikami** — upload plików (obrazy, wideo, PDF, ZIP) przypisanych do konkretnego telebimu, pojedynczo lub masowo
- **Grupy urządzeń** — organizacja telebimów w grupy i przypisywanie do nich użytkowników
- **Zarządzanie użytkownikami** — role, hasła, przypisania do grup i firm
- **Firmy** — obsługa wielu firm/klientów w jednym systemie (widoczne tylko dla roli `root`)
- **Podgląd konta (impersonacja)** — administrator może "wcielić się" w innego użytkownika lub firmę, by zobaczyć panel z jego perspektywy
- **System ról** — hierarchia uprawnień: `user` → `admin` → `owner` → `root`
- **Tokeny wdrożeniowe** — generowanie tokenów, którymi nowe urządzenie paruje się z kontem/grupą
- **Komunikacja w czasie rzeczywistym przez WebSocket** — urządzenia łączą się z serwerem, pobierają aktualny harmonogram i status połączenia
- **Kreator pierwszego uruchomienia** — utworzenie pierwszego konta administratora (`root`) przy pustej bazie danych
- **Wielojęzyczność interfejsu** — polski / angielski (przełącznik języka, tłumaczenia w `rest.js`)
- **Jasny / ciemny motyw** interfejsu
- **Aplikacja kliencka na Windows** (`TelemechanikOdbiornik.exe`) instalowana na urządzeniu wyświetlającym, łącząca się z serwerem

---

## 🧰 Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Backend | Node.js, Express 5 |
| Baza danych | MySQL (`mysql2`) |
| Komunikacja live | WebSocket (`ws`) |
| Sesje | `express-session` |
| Upload plików | `multer` |
| Archiwa | `archiver`, `adm-zip` |
| Transfer plików | `ssh2-sftp-client` |
| Frontend | HTML, CSS, Vanilla JS (bez frameworka) |
| Klient urządzenia | Aplikacja Windows (`.exe`) |

---

## 📁 Struktura projektu

```
Strona-main/
├── index.js                 # Główny serwer Express (routing, logika API)
├── db.js                    # Konfiguracja i inicjalizacja połączenia z MySQL
├── ws.js                    # Serwer WebSocket – komunikacja z telebimami
├── configpanel.json         # Stan konfiguracji panelu (np. czy setup ukończony)
├── package.json
├── logs/                    # Logi aplikacji
├── obrazki/                 # Katalog na przesłane pliki multimedialne
└── public/                  # Pliki statyczne serwowane przez Express
    ├── login.html           # Strona logowania
    ├── dashboard.html        # Główny panel
    ├── dashboard.css
    ├── obrazy/               # Grafiki interfejsu (logo, ikony)
    ├── js/
    │   ├── billboards.js     # Zarządzanie telebimami
    │   ├── schedule.js       # Harmonogramy
    │   ├── calendar.js       # Widok kalendarza
    │   ├── groups.js         # Grupy urządzeń
    │   ├── users.js          # Użytkownicy
    │   ├── company.js        # Firmy
    │   ├── impersonate.js    # Podgląd kont (impersonacja)
    │   ├── instructions.js   # Instrukcje / pomoc w panelu
    │   └── rest.js           # Wspólne narzędzia, tłumaczenia, motyw
    └── TelemechanikOdbiornik.exe   # Aplikacja odbiornika (klient Windows)
```

---

## ⚙️ Wymagania

- [Node.js](https://nodejs.org/) (zalecana wersja 18+)
- Serwer **MySQL** (lokalny lub zdalny)
- npm

---

## 🚀 Instalacja

1. Sklonuj repozytorium:
   ```bash
   git clone <adres-repozytorium>
   cd Strona-main
   ```

2. Zainstaluj zależności:
   ```bash
   npm install
   ```

3. Skonfiguruj połączenie z bazą danych — patrz sekcja [Konfiguracja](#-konfiguracja) poniżej.

4. Uruchom serwer:
   ```bash
   node index.js
   ```

5. Panel będzie dostępny pod adresem:
   ```
   http://localhost:10210
   ```

6. Przy pierwszym uruchomieniu (pusta baza danych) aplikacja przekieruje do kreatora zakładania pierwszego konta administratora (`root`).

---

## 🔧 Konfiguracja

### Baza danych

Dane dostępowe do MySQL znajdują się w `db.js`:

```js
const dbConfig = {
  host: 'host',
  port: 10211,
  user: 'login',
  password: 'haslo',
  database: 'baza',
  dateStrings: true
};
```

Przed uruchomieniem projektu **podmień te wartości** na dane swojego serwera MySQL. Tabele (`users`, `firmy`, `grupy`, `telebimy_machine`, `harmonogramy`, `tokeny` i inne) są tworzone automatycznie przy starcie serwera, jeśli jeszcze nie istnieją.

### Port serwera

Domyślny port (`10210`) ustawiony jest na sztywno w `index.js` (`const PORT = 10210`).

### Sekret sesji

Klucz sesji (`express-session`) jest obecnie zapisany bezpośrednio w kodzie w `index.js` — przed wdrożeniem produkcyjnym warto przenieść go do zmiennej środowiskowej.

---

## 🗄️ Model danych

Główne tabele tworzone automatycznie w MySQL:

| Tabela | Opis |
|---|---|
| `users` | Konta użytkowników panelu (login, hasło, rola, firma, grupa) |
| `firmy` | Firmy/klienci korzystający z systemu |
| `grupy` | Grupy, do których przypisywane są telebimy i użytkownicy |
| `telebimy_machine` | Zarejestrowane urządzenia wyświetlające (UUID, nazwa, status połączenia, grupa) |
| `harmonogramy` | Zaplanowane wyświetlenia treści na danym telebimie |
| `tokeny` | Tokeny wdrożeniowe do parowania nowych urządzeń z kontem |

---

## 🔌 Jak łączy się urządzenie (protokół WebSocket)

1. Aplikacja `TelemechanikOdbiornik.exe` na urządzeniu wyświetlającym łączy się z serwerem przez WebSocket.
2. Wysyła pakiet z tokenem wdrożeniowym lub istniejącym UUID.
3. Serwer weryfikuje token/UUID, rejestruje lub aktualizuje urządzenie w bazie i odsyła jego UUID oraz przypisaną grupę.
4. Urządzenie okresowo wysyła `updateRequest`, w odpowiedzi na co serwer przesyła aktualny harmonogram na najbliższe 24h (pliki, zakresy godzin, priorytety).
5. Zamknięcie połączenia oznacza urządzenie jako rozłączone (`is_connected = 0`).

---

## 🔐 System ról

Role są hierarchiczne, każda wyższa dziedziczy uprawnienia niższych:

```
user → admin → owner → root
```

- **user** — podstawowy dostęp do przypisanych telebimów i grup
- **admin** — zarządzanie użytkownikami/grupami w ramach swojej firmy
- **owner** — pełne zarządzanie firmą (użytkownicy, grupy, telebimy)
- **root** — pełny dostęp do systemu, w tym zarządzanie firmami i impersonacja dowolnego konta

---

## 🌍 Wielojęzyczność

Interfejs obsługuje język polski i angielski. Wybrany język zapisywany jest w ciasteczku (`language`), a tłumaczenia znajdują się w `public/js/rest.js`.

---

## ⚠️ Znane problemy / do poprawy

Ponieważ jest to projekt edukacyjny, przed wykorzystaniem w innym środowisku warto zwrócić uwagę na:

- **Dane logowania do bazy danych i sekret sesji są zapisane wprost w kodzie** (`db.js`, `index.js`) — zalecane jest przeniesienie ich do zmiennych środowiskowych (np. przez `dotenv`) i dodanie `.env` do `.gitignore`.
- **`package.json` nie zawiera pola `"type": "module"`** mimo że kod korzysta ze składni `import`/`export` (ESM) — może być konieczne dodanie tego pola, aby `node index.js` uruchamiał się bez błędu, w zależności od wersji Node.
- **Brak sekcji `scripts`** w `package.json` (np. `"start": "node index.js"`).
- Port serwera (`10210`) jest ustawiony na stałe w kodzie zamiast być konfigurowalny.

---

## 📄 Licencja

Projekt edukacyjny — brak formalnej licencji. Wykorzystanie na własną odpowiedzialność.

---

## 👤 Autor
.creperowski. (Odpowiedzialny za cały panel)
majster2nn (Odpowiedzialny za tylko websockety)

Projekt zrealizowany w ramach praktyk szkolnych, jako forma zaliczenia praktyk zawodowych.
