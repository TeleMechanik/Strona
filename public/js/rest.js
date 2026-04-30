// ============================= COOKIE ===========================
window.setCookie = function(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()}`;
}

window.getCookie = function(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// ============================= TRANSLATIONS ===========================
window.translations = {
  pl: {
    dashboardTitle: "TeleMechanik Dashboard",
    dashboardSubtitle: "Twoje bezpieczne centrum zarządzania",
    logoutBtn: "Wyloguj się",
    
    billboardsTitle: "Urządzenia",
    billboardsStatus: "Aktywne:",
    billboardsBtn: "Zarządzaj",
    billboardsGroupStatus: "Brak",
    usersTitle: "Użytkownicy",
    usersDesc: "Tutaj znajdziesz wszystkich użytkowników panelu",
    usersBtn: "Zarządzaj",
    usersTag: "(Ty)",
    groupsTitle: "Grupy urządzeń",
    groupsDesc: "Zarządzaj grupami urządzeń",
    groupsBtn: "Zarządzaj",
    scheduleTitle: "Zadania",
    scheduleDesc: "Zaplanuj wyświetlanie treści na urządzeniach",
    scheduleBtn: "Zarządzaj",
    
    modalTitle: "Ustawienia",
    langLabel: "Język",
    themeLabel: "Motyw",
    closeBtn: "Zamknij",
    
    billboardsModalTitle: "Lista urządzeń",
    billboardsConnectedPrefix: "Połączonych urządzeń:",
    usersModalTitle: "Lista użytkowników",
    usersConnectedPrefix: "Użytkowników w bazie:",
    groupsModalTitle: "Lista grup urządzeń",
    groupsConnectedPrefix: "Grup w bazie:",
    scheduleModalTitle: "Zadania urządzeń",
    visualizationModalTitle: "Wizualizacja zadań",
    
    selectBillboardPlaceholder: "Wybierz urządzenie",
    addScheduleBtn: "+ Dodaj wpis",
    visualizeScheduleBtn: "📊 Wizualizacja wpisów",
    noScheduleSelected: "Wybierz urządzenie aby zobaczyć wpis",
    scheduleEditTitle: "Nowy wpis",
    taskNameLabel: "Nazwa zadania",
    contentLabel: "Treść do wyświetlenia",
    startDateLabel: "Data rozpoczęcia",
    endDateLabel: "Data zakończenia",
    repeatLabel: "Powtarzanie",
    repeatOnce: "Jednorazowo",
    repeatDaily: "Codziennie",
    repeatWeekly: "Co tydzień",
    repeatMonthly: "Co miesiąc",
    statusLabel: "Status",
    statusActive: "Aktywny",
    statusPaused: "Wstrzymany",
    statusCompleted: "Zakończony",
    editScheduleBtn: "Edytuj",
    deleteScheduleBtn: "Usuń",
    
    loading: "Ładowanie...",
    noneFound: "Brak elementów.",
    noSchedulesFound: "Brak wpisów dla tego urządzenia",
    errorLoading: "Błąd pobierania danych.",
    accessDenied: "Brak dostępu",
    
    tableUserId: "ID",
    tableUserName: "Nazwa",
    tableUserRole: "Ranga",
    tableUserGroup: "Grupa",
    tableUserActions: "Akcje",
    tableGroupId: "ID",
    tableGroupName: "Nazwa",
    tableGroupActions: "Akcje",
    tableBillboardUUID: "UUID",
    tableBillboardName: "Nazwa",
    tableBillboardActions: "Akcje",
    
    userActionsTitle: "Akcje dla użytkownika:",
    groupActionsTitle: "Akcje dla grupy:",
    billboardActionsTitle: "Akcje dla urządzenia:",
    changePasswordBtn: "Zmień hasło",
    changeRoleBtn: "Zmień rangę",
    changeGroupBtn: "Edytuj grupy",
    renameBtn: "Zmień nazwę",
    deleteUserBtn: "Usuń użytkownika",
    deleteGroupBtn: "Usuń grupę",
    deleteBillboardBtn: "Usuń urządzenie",
    
    addUserTitle: "Dodaj użytkownika",
    addUserUsernamePlaceholder: "Nazwa użytkownika",
    addUserPasswordPlaceholder: "Hasło",
    addUserRolePlaceholder: "Wybierz rangę",
    addUserSelectGroupPlaceholder: "Wybierz grupę",
    addUserMyGroupOption: "Moja grupa",
    addGroupTitle: "Dodaj grupę",
    addGroupNamePlaceholder: "Nazwa grupy",
    
    roleOwner: "Owner",  
    roleAdmin: "Admin",
    roleUser: "User",
    
    saveBtn: "Zapisz",
    addBtn: "Dodaj",
    cancelBtn: "Anuluj",
    confirmBtn: "Potwierdź",
    deleteBtn: "Usuń",
    
    validationError: "Uzupełnij wszystkie pola!",
    invalidPasswordLength: "Hasło musi mieć co najmniej 3 znaki",
    invalidNameLength: "Nazwa musi mieć co najmniej 2 znaki",
    fieldRequired: "To pole jest wymagane",
    noGroupSelected: "Nie wybrano grupy",
    noRoleSelected: "Nie wybrano rangi",
    selectBillboardFirst: "Wybierz najpierw urządzenie",
    fillRequiredFields: "Wypełnij wszystkie wymagane pola",
    
    success: "Sukces!",
    userAdded: "Użytkownik dodany!",
    groupAdded: "Grupa dodana!",
    passwordChanged: "Hasło zmienione!",
    roleChanged: "Ranga zmieniona!",
    groupChanged: "Grupa zmieniona!",
    nameChanged: "Nazwa zmieniona!",
    userDeleted: "Użytkownik usunięty",
    groupDeleted: "Grupa usunięta",
    billboardDeleted: "Urządzenie usunięte",
    scheduleSaved: "Wpis zapisany",
    scheduleDeleted: "Wpis usunięty",
    scheduleSuccessSaved: "Wpis pomyślnie zapisany",
    scheduleSuccessDeleted: "Wpis pomyślnie usunięty",
    
    error: "Błąd!",
    addUserError: "Błąd dodawania użytkownika",
    addGroupError: "Błąd dodawania grupy",
    changePasswordError: "Błąd zmiany hasła",
    changeRoleError: "Błąd zmiany rangi",
    changeGroupError: "Błąd zmiany grupy",
    deleteUserError: "Błąd usuwania użytkownika",
    deleteGroupError: "Błąd usuwania grupy",
    deleteBillboardError: "Błąd usuwania urządzenia",
    renameError: "Błąd zmiany nazwy",
    scheduleErrorLoading: "Błąd ładowania wpisów",
    scheduleErrorLoadingBillboards: "Błąd ładowania listy urządzeń",
    scheduleErrorSaving: "Błąd zapisywania wpisu",
    scheduleErrorDeleting: "Błąd usuwania wpisu",
    
    noGroupsError: "Musisz najpierw stworzyć co najmniej jedną grupę!",
    loadGroupsError: "Błąd podczas ładowania listy grup!",
    groupHasUsersError: "Nie można usunąć grupy, ponieważ ma przypisanych użytkowników",
    cannotDeleteRoot: "Nie można usunąć konta root!",
    cannotDeleteOtherRoot: "Nie można usunąć innego konta root!",
    noPermission: "Nie masz uprawnień",
    onlyRootCanChangeGroups: "Tylko root może zmieniać grupy",
    cannotEditSameOrHigherRank: "Nie możesz edytować użytkowników o równej lub wyższej randze",
    cannotEditYourself: "Nie możesz edytować swojego konta w ten sposób",
    
    deleteUserConfirm: "Czy na pewno chcesz usunąć użytkownika",
    deleteGroupConfirm: "Czy na pewno chcesz usunąć grupę",
    deleteBillboardConfirm: "Czy na pewno chcesz usunąć urządzenie",
    scheduleConfirmDelete: "Czy na pewno chcesz usunąć ten wpis?",
    operationIrreversible: "Ta operacja jest nieodwracalna!",
    
    enterNewPassword: "Wprowadź nowe hasło",
    enterNewName: "Wprowadź nową nazwę",
    selectNewRole: "Wybierz nową rangę",
    selectNewGroup: "Wybierz nową grupę",
      
    renameUserBtn: "Zmień nazwę",
    
    scheduleStatusActive: "Aktywny",
    scheduleStatusPaused: "Wstrzymany",
    scheduleStatusCompleted: "Zakończony",
    dateError: "Data rozpoczęcia musi być wcześniejsza niż data zakończenia",
      
    retryBtn: "Spróbuj ponownie",
    selectBillboardWithUuid: "Urządzenie (UUID)",
     
    selectFromGallery: "Wybierz z galerii",
    uploadNew: "Prześlij nowy",
    selectImageHint: "Kliknij na obrazek aby wybrać",
    clickToUpload: "Kliknij aby przesłać plik",
    uploadHint: "Obsługiwane formaty: JPG, PNG, GIF, WebP, MP4, WebM, PDF, ZIP, JS (max 50MB)",
    selected: "Wybrano",
    uploading: "Przesyłanie",
    uploadSuccess: "Plik przesłany pomyślnie!",
    uploadError: "Błąd przesyłania pliku",
    selectFile: "Wybierz plik",
    dragAndDrop: "lub przeciągnij i upuść",
    maxSize: "Maksymalny rozmiar: 50MB",
    imageType: "obrazek",
    videoType: "wideo",
    galleryTitle: "Galeria plików",
    noFilesAvailable: "Brak plików dla tego urządzenia",
    uploadFilesFirst: "Najpierw prześlij pliki w zakładce zarządzania",
    fileSelected: "Wybrany plik:",
    changeSelection: "Zmień wybór",
    cancelUpload: "Anuluj przesyłanie",
      
    bulkDeleteTitle: "Masowe usuwanie zadań",
    bulkDeleteConfirm: "Czy na pewno chcesz usunąć",
    scheduleSingle: "zadanie",
    schedulePlural: "zadań",
    selectAll: "Zaznacz wszystkie",
    deselectAll: "Odznacz wszystkie",
      
    deleting: "Usuwanie...",
      
    changeBillboardGroupBtn: "Zmień grupę",
    billboardGroupChangeSuccess: "Grupa urządzenia zmieniona pomyślnie",
    onlyRootCanChangeBillboardGroups: "Tylko root może zmieniać grupy urządzeń",
    selectNewGroupForBillboard: "Wybierz nową grupę dla urządzenia",
    group: "grupa",
    groups: "grupy",
    changeGroup: "Zmień grupę",
    selectGroup: "Wybierz grupę",
    noGroupsAvailable: "Brak dostępnych grup",
    groupChangeSuccess: "Grupa zmieniona pomyślnie",
    groupChangeError: "Błąd zmiany grupy",
    groupChangeWarning: "Po zmianie grupy, tylko użytkownicy z wybranej grupy będą mieli dostęp do tego urządzenia i jego plików.",
    groupChangeTitle: "Zmień grupę dla urządzenia",
    currentGroup: "Obecna grupa",
    newGroup: "Nowa grupa",
    saveGroupChange: "Zapisz",
    cancelGroupChange: "Anuluj",
      
    deployTokenBtn: "🔑 Auto Deploy Token",
    deployTokenHint: "Generuj token do automatycznego wdrażania urządzeń",
    deployTokenTitle: "🔑 Auto Deploy Token",
    deployTokenPasswordPrompt: "Wprowadź swoje hasło aby wygenerować token",
    deployTokenPasswordPlaceholder: "Twoje hasło",
    deployTokenGenerateBtn: "Generuj Token",
    deployTokenCancelBtn: "Anuluj",
    deployTokenGenerating: "Generowanie...",
    deployTokenSuccess: "Token wygenerowany pomyślnie!",
    deployTokenCopyHint: "Skopiuj ten token. Zostanie on wyświetlony tylko raz!",
    deployTokenWarning: "⚠️ Zapisz ten token w bezpiecznym miejscu. Nie będzie można go ponownie zobaczyć!",
    deployTokenCopyBtn: "Kopiuj",
    deployTokenCopied: "Skopiowano!",
    deployTokenCloseBtn: "Zamknij",
    deployTokenPasswordRequired: "Wprowadź hasło",
    deployTokenInvalidPassword: "Nieprawidłowe hasło",
    deployTokenGenerationError: "Błąd generowania tokenu",
    deployTokenGenerated: "Token wygenerowany",
    duration: "Czas trwania",
     
    capsWarning: "Caps Lock jest włączony",
    capsWarning2: "Caps Lock włączony",
    
    calendarMonthJanuary: "Styczeń",
    calendarMonthFebruary: "Luty",
    calendarMonthMarch: "Marzec",
    calendarMonthApril: "Kwiecień",
    calendarMonthMay: "Maj",
    calendarMonthJune: "Czerwiec",
    calendarMonthJuly: "Lipiec",
    calendarMonthAugust: "Sierpień",
    calendarMonthSeptember: "Wrzesień",
    calendarMonthOctober: "Październik",
    calendarMonthNovember: "Listopad",
    calendarMonthDecember: "Grudzień",
    
    calendarWeekdayMon: "Pn",
    calendarWeekdayTue: "Wt",
    calendarWeekdayWed: "Śr",
    calendarWeekdayThu: "Cz",
    calendarWeekdayFri: "Pt",
    calendarWeekdaySat: "So",
    calendarWeekdaySun: "Nd",
    everydayLabel: "Codziennie",
  weekdaysLabel: "Dni robocze (Pn-Pt)",
  weekendLabel: "Weekend (So-Nd)",
        daySingle: "dzień",
  daysPlural: "dni",
      calendarDateLabel: "Data:",
calendarHoursLabel: "Godziny:",
    
    calendarPrevMonth: "Poprzedni miesiąc",
    calendarNextMonth: "Następny miesiąc",
    calendarToday: "Dzisiaj",
    calendarTodayLegend: "Dzisiaj",
    calendarSelectedLegend: "Wybrany dzień",
    calendarHasSchedulesLegend: "Dzień z wpisami",
    calendarNoSchedulesForDay: "Brak wpisów na ten dzień",
    calendarSchedulesForDay: "Wpisy na dzień",
    calendarTotalSchedules: "Wszystkie wpisy",
    calendarActiveSchedules: "Aktywne",
    calendarPausedSchedules: "Wstrzymane",
    calendarCompletedSchedules: "Zakończone",
      
    calendarFrom: "od",
    calendarTo: "do",
    calendarMultiDay: "wielodniowy",
    calendarMultiDayLegend: "Wpis wielodniowy",
      
    videoPlayerTitle: "Odtwarzanie wideo",
    videoBrowserNotSupported: "Twoja przeglądarka nie obsługuje odtwarzania wideo.",
    videoPlayBtn: "Odtwórz",
      
    deleteFileError: "Błąd podczas usuwania pliku",
    deleteFileTitle: "Usuń ten plik",
    daysAbbreviation: " dni",
    selectedCountLabel: "zaznaczono",
    schedulesDeleted: "harmonogramów usuniętych",
    deletedWithErrors: "usunięto, ",
    failedToDelete: "nie udało się",
      
    invalidFileType: "Dozwolone tylko pliki obrazów, wideo, PDF, ZIP i JS",
  fileTooLarge: "Plik jest zbyt duży. Maksymalny rozmiar: 50MB",
      
impersonateTitle: "Podgląd Kont",
    impersonateDesc: "Podglądaj konta innych użytkowników",
    impersonateBtn: "Zarządzaj",
    impersonateModalTitle: "Podgląd Kont",
    impersonateHelp: "Wybierz użytkownika, którego konto chcesz podglądnąć. Będziesz miał pełny dostęp do jego uprawnień.",
    exitImpersonateBtn: "🏠 Wróć do konta root",
    impersonating: "PODGLĄD",
    currentlyViewing: "Przeglądasz:",
    loggedAsRoot: "Zalogowany jako root:",
    impersonateUserBtn: "👁️ Podgląd konta",
    currentlyActive: "AKTYWNY",
    noUsersForImpersonation: "Brak użytkowników dostępnych do podglądu.",
    noPermissionImpersonate: "Tylko root może korzystać z podglądu kont",
    impersonateWelcome: "Witaj",
    returnToRoot: "Wróć do konta root",
    
    confirmTitle: "Potwierdzenie",
    confirmBtn: "Potwierdź",
    cancelBtn: "Anuluj",
    impersonateConfirm: "Czy na pewno chcesz przejść do podglądu konta użytkownika \"{userName}\"?",
    exitImpersonateConfirm: "Czy na pewno chcesz wrócić do swojego konta root?",
      
      userGroupsTitle: "Zarządzanie grupami użytkownika",
    userGroupsPrimary: "Główna grupa",
    userGroupsAdditional: "Dodatkowe grupy",
    userGroupsAvailable: "Dostępne grupy",
    userGroupsSelected: "Wybrane grupy",
    userGroupsAddBtn: "Dodaj grupę",
    userGroupsRemoveBtn: "Usuń",
    userGroupsChangePrimaryBtn: "Zmień główną grupę",
    userGroupsSaveBtn: "Zapisz zmiany",
    userGroupsCancelBtn: "Anuluj",
    userGroupsSuccess: "Grupy zaktualizowane pomyślnie",
    userGroupsError: "Błąd aktualizacji grup",
    userGroupsMinOneError: "Użytkownik musi mieć przynajmniej 1 grupę",
    userGroupsCannotRemovePrimary: "Nie można usunąć głównej grupy",
    userGroupsNoAccess: "Brak dostępu do edycji grup",
    
    billboardChangeGroupOwner: "Zmień grupę urządzenia",
    billboardSelectNewGroup: "Wybierz nową grupę",
    billboardGroupChangeSuccess: "Grupa urządzenia zmieniona",
    billboardGroupChangeError: "Błąd zmiany grupy",
    billboardGroupNoAccess: "Brak dostępu do tej grupy",
      
      userGroupsPrimary: "Grupa główna",
    userGroupsAdditional: "Grupy dodatkowe",
    userGroupsAvailable: "Dostępne grupy",
      
       noPrimaryGroup: "Brak przypisanej głównej grupy",
  noAdditionalGroups: "Brak dodatkowych grup",
      
      ownerGroupAutoAssign: "Ta grupa zostanie automatycznie dodana do Twoich grup dodatkowych",
groupAddedAutoAssigned: "Grupa utworzona i dodana do Twoich grup dodatkowych",
      
      ownerGroupsNote: "Widzisz wszystkie swoje grupy (główną i dodatkowe)",
      selectedCountLabel: "wybrano",
      optional: "opcjonalne",
      
      impersonateCompaniesTab: "Firmy",
impersonateUsersTab: "Użytkownicy",
impersonateCompanyConfirm: "Czy na pewno chcesz przejść do podglądu firmy \"{companyName}\"? Będziesz miał widok jak Owner, ale zachowasz uprawnienia ROOT (możesz nawet usuwać ownerów).",
impersonatingAsCompany: "Podgląd firmy jako ROOT",
companyRootAccessNote: "Masz dostęp ROOT - możesz zarządzać nawet ownerami tej firmy",
confirmCompanyImpersonateBtn: "Wejdź jako firma",
impersonateCompanyBtn: "👁️ Podgląd firmy",
companyName: "Nazwa firmy",
companyUsersCount: "Użytkowników",
companyStatus: "Status",
companyAction: "Akcja",
companyViewAsOwner: "Podgląd jako Owner",
companyOwnerAvailable: "Dostępny Owner",
companyOwnerUnavailable: "Brak Owner (podgląd jako admin/user)",
noCompaniesForImpersonation: "Brak firm dostępnych do podglądu",
companyViewAsOwnerBtn: "👁️ Podgląd jako Owner",
      impersonateHelpcompany: "Wybierz firmę do podglądu. Będziesz miał widok jak Owner, ale zachowasz uprawnienia ROOT.",
      
          additional: "dodatkowe",
    userGroupsNoAdditional: "Brak dodatkowych grup",
    has: "ma",
    none: "brak",
      
      startTimeLabel: "Godzina rozpoczęcia",
endTimeLabel: "Godzina zakończenia",
dateTimeSection: "Data i czas",
timeFormatHint: "Format: HH:MM:SS",
additionalHoursLabel: "Dodatkowe godziny",
addHourBtn: "Dodaj godzinę",
additionalHoursHint: "Możesz dodać dodatkowe godziny w ciągu dnia",
      
      priorityLabel: "Priorytet",
    priorityHint: "0 = najniższy, 2 = najwyższy",
      
      companiesTitle: "Firmy",
companiesDesc: "Zarządzaj firmami użytkowników",
companiesBtn: "Zarządzaj",
companiesModalTitle: "Lista Firm",
companiesConnectedPrefix: "Firm w bazie:",
tableCompanyName: "Nazwa firmy",
tableCompanyActions: "Akcje",
companyActionsTitle: "Akcje dla firmy:",
addCompanyTitle: "Dodaj firmę",
addCompanyNamePlaceholder: "Nazwa firmy",
addCompanyError: "Błąd dodawania firmy",
companyAdded: "Firma dodana!",
companyDeleted: "Firma usunięta",
deleteCompanyBtn: "Usuń firmę",
deleteCompanyConfirm: "Czy na pewno chcesz usunąć firmę",
deleteCompanyError: "Błąd usuwania firmy",
companyHasUsersError: "Nie można usunąć firmy, ponieważ są przypisani do niej użytkownicy",
noCompaniesFound: "Brak firm w bazie danych",
onlyRootCanManageCompanies: "Tylko root może zarządzać firmami",
sameNameError: "Wprowadź inną nazwę niż obecna",
     withoutCompany: 'bez firmy',
       changeCompanyBtn: "Zmień firmę",
      current: "Aktualnie",
      
      instructionsTitle: "Instrukcja",
instructionsDesc: "Przewodnik użytkownika i dokumentacja",
instructionsBtn: "Otwórz",
instructionsModalTitle: "Instrukcja użytkownika",
      
      groupsStatus: "Aktywne:",
  groupsTitle: "Grupy",
  groupsBtn: "Zarządzaj",
  billboardsStatus: "Aktywne:",
  billboardsTitle: "Urządzenia",
  billboardsBtn: "Zarządzaj",
  refreshGroupsSuccess: "Grupy zostały odświeżone",
  refreshBillboardsSuccess: "Urządzenia zostały odświeżone",
  refreshing: "Odświeżanie...",
  refreshError: "Błąd podczas odświeżania",
  refreshTitle: "Odśwież",
  refreshBtn: "⟳",
      
       collisionErrorTitle: "Kolizja harmonogramów",
    collisionErrorMessage: "Nie można zapisać harmonogramu ze względu na kolizję z istniejącymi harmonogramami:",
    collisionErrorHint: "Proszę zmienić daty, godziny, dni tygodnia lub priorytet.",
    collisionRulesTitle: "Zasady kolizji:",
    collisionRule0: "Brak kolizji z żadnym harmonogramem",
    collisionRule1: "Kolizja tylko z innymi Priority 1",
    collisionRule2: "Kolizja tylko z innymi Priority 2"
  },
  en: {
    dashboardTitle: "TeleMechanik Dashboard",
    dashboardSubtitle: "Your secure management center",
    logoutBtn: "Logout",
    
    billboardsTitle: "Devices",
    billboardsStatus: "Active:",
    billboardsBtn: "Manage",
    billboardsGroupStatus: "None",
    usersTitle: "Users",
    usersDesc: "Here you can find all panel users",
    usersBtn: "Manage",
    usersTag: "(You)",
    groupsTitle: "Device groups",
    groupsDesc: "Manage device groups",
    groupsBtn: "Manage",
    scheduleTitle: "Schedule",
    scheduleDesc: "Schedule content display on devices",
    scheduleBtn: "Manage",
    
    modalTitle: "Settings",
    langLabel: "Language",
    themeLabel: "Theme",
    closeBtn: "Close",
    
    billboardsModalTitle: "Devices List",
    billboardsConnectedPrefix: "Connected devices:",
    usersModalTitle: "Users List",
    usersConnectedPrefix: "Users in database:",
    groupsModalTitle: "Device groups list",
    groupsConnectedPrefix: "Groups in database:",
    scheduleModalTitle: "Devices Tasks",
    visualizationModalTitle: "Tasks Visualization",
    
    selectBillboardPlaceholder: "Select device",
    addScheduleBtn: "+ Add schedule",
    visualizeScheduleBtn: "📊 Visualize entries",
    noScheduleSelected: "Select a device to view schedule",
    scheduleEditTitle: "New Schedule",
    taskNameLabel: "Task name",
    contentLabel: "Content to display",
    startDateLabel: "Start date",
    endDateLabel: "End date",
    repeatLabel: "Repeat",
    repeatOnce: "Once",
    repeatDaily: "Daily",
    repeatWeekly: "Weekly",
    repeatMonthly: "Monthly",
    statusLabel: "Status",
    statusActive: "Active",
    statusPaused: "Paused",
    statusCompleted: "Completed",
    editScheduleBtn: "Edit",
    deleteScheduleBtn: "Delete",
    
    loading: "Loading...",
    noneFound: "No items found.",
    noSchedulesFound: "No schedules for this device",
    errorLoading: "Failed to load data.",
    accessDenied: "Access denied",
    
    tableUserId: "ID",
    tableUserName: "Name",
    tableUserRole: "Role",
    tableUserGroup: "Group",
    tableUserActions: "Actions",
    tableGroupId: "ID",
    tableGroupName: "Name",
    tableGroupActions: "Actions",
    tableBillboardUUID: "UUID",
    tableBillboardName: "Name",
    tableBillboardActions: "Actions",
    
    userActionsTitle: "Actions for user:",
    groupActionsTitle: "Actions for group:",
    billboardActionsTitle: "Actions for device:",
    changePasswordBtn: "Change password",
    changeRoleBtn: "Change role",
    changeGroupBtn: "Edit group",
    renameBtn: "Rename",
    deleteUserBtn: "Delete user",
    deleteGroupBtn: "Delete group",
    deleteBillboardBtn: "Delete device",
    
    addUserTitle: "Add User",
    addUserUsernamePlaceholder: "Username",
    addUserPasswordPlaceholder: "Password",
    addUserRolePlaceholder: "Select role",
    addUserSelectGroupPlaceholder: "Select group",
    addUserMyGroupOption: "My group",
    addGroupTitle: "Add Group",
    addGroupNamePlaceholder: "Group name",
    
    roleOwner: "Owner",  
    roleAdmin: "Admin",
    roleUser: "User",
    
    saveBtn: "Save",
    addBtn: "Add",
    cancelBtn: "Cancel",
    confirmBtn: "Confirm",
    deleteBtn: "Delete",
    
    validationError: "Fill in all fields!",
    invalidPasswordLength: "Password must be at least 3 characters",
    invalidNameLength: "Name must be at least 2 characters",
    fieldRequired: "This field is required",
    noGroupSelected: "No group selected",
    noRoleSelected: "No role selected",
    selectBillboardFirst: "Select a device first",
    fillRequiredFields: "Fill all required fields",
    
    success: "Success!",
    userAdded: "User added!",
    groupAdded: "Group added!",
    passwordChanged: "Password changed!",
    roleChanged: "Role changed!",
    groupChanged: "Group changed!",
    nameChanged: "Name changed!",
    userDeleted: "User deleted",
    groupDeleted: "Group deleted",
    billboardDeleted: "Device deleted",
    scheduleSaved: "Schedule saved",
    scheduleDeleted: "Schedule deleted",
    scheduleSuccessSaved: "Schedule successfully saved",
    scheduleSuccessDeleted: "Schedule successfully deleted",
    
    error: "Error!",
    addUserError: "Error adding user",
    addGroupError: "Error adding group",
    changePasswordError: "Error changing password",
    changeRoleError: "Error changing role",
    changeGroupError: "Error changing group",
    deleteUserError: "Error deleting user",
    deleteGroupError: "Error deleting group",
    deleteBillboardError: "Error deleting device",
    renameError: "Error renaming",
    scheduleErrorLoading: "Error loading schedules",
    scheduleErrorLoadingBillboards: "Error loading devices list",
    scheduleErrorSaving: "Error saving schedule",
    scheduleErrorDeleting: "Error deleting schedule",
    
    noGroupsError: "You must first create at least one group!",
    loadGroupsError: "Error loading groups list!",
    groupHasUsersError: "Cannot delete group because it has assigned users",
    cannotDeleteRoot: "Cannot delete root account!",
    cannotDeleteOtherRoot: "Cannot delete other root account!",
    noPermission: "No permission",
    onlyRootCanChangeGroups: "Only root can change groups",
    cannotEditSameOrHigherRank: "Cannot edit users with same or higher rank",
    cannotEditYourself: "Cannot edit your own account this way",
    
    deleteUserConfirm: "Are you sure you want to delete user",
    deleteGroupConfirm: "Are you sure you want to delete group",
    deleteBillboardConfirm: "Are you sure you want to delete device",
    scheduleConfirmDelete: "Are you sure you want to delete this schedule?",
    operationIrreversible: "This operation is irreversible!",
    
    enterNewPassword: "Enter new password",
    enterNewName: "Enter new name",
    selectNewRole: "Select new role",
    selectNewGroup: "Select new group",
      
    renameUserBtn: "Change username",
      
    scheduleStatusActive: "Active",
    scheduleStatusPaused: "Paused",
    scheduleStatusCompleted: "Completed",
    dateError: "Start date must be earlier than end date",
      
    retryBtn: "Retry",
    selectBillboardWithUuid: "Device (UUID)",
     
    selectFromGallery: "Select from gallery",
    uploadNew: "Upload new",
    selectImageHint: "Click on image to select",
    clickToUpload: "Click to upload file",
    uploadHint: "Supported formats: JPG, PNG, GIF, WebP, MP4, WebM, PDF, ZIP, JS (max 50MB)",
    selected: "Selected",
    uploading: "Uploading",
    uploadSuccess: "File uploaded successfully!",
    uploadError: "File upload error",
    selectFile: "Select file",
    dragAndDrop: "or drag and drop",
    maxSize: "Max size: 50MB",
    imageType: "image",
    videoType: "video",
    galleryTitle: "File gallery",
    noFilesAvailable: "No files for this device",
    uploadFilesFirst: "Upload files first in the management section",
    fileSelected: "Selected file:",
    changeSelection: "Change selection",
    cancelUpload: "Cancel upload",
      
    bulkDeleteTitle: "Bulk Delete Tasks",
    bulkDeleteConfirm: "Are you sure you want to delete",
    scheduleSingle: "task",
    schedulePlural: "tasks",
    selectAll: "Select all",
    deselectAll: "Deselect all",
      
    deleting: "Deleting...",
      
    changeBillboardGroupBtn: "Change Group",
    billboardGroupChangeSuccess: "Device group changed successfully",
    onlyRootCanChangeBillboardGroups: "Only root can change device groups",
    selectNewGroupForBillboard: "Select new group for device",
    group: "group",
    groups: "groups",
    changeGroup: "Change group",
    selectGroup: "Select group",
    noGroupsAvailable: "No groups available",
    groupChangeSuccess: "Group changed successfully",
    groupChangeError: "Error changing group",
    groupChangeWarning: "After changing the group, only users from the selected group will have access to this device and its files.",
    groupChangeTitle: "Change group for device",
    currentGroup: "Current group",
    newGroup: "New group",
    saveGroupChange: "Save",
    cancelGroupChange: "Cancel",
      
    deployTokenBtn: "🔑 Auto Deploy Token",
    deployTokenHint: "Generate token for automatic device deployment",
    deployTokenTitle: "🔑 Auto Deploy Token",
    deployTokenPasswordPrompt: "Enter your password to generate token",
    deployTokenPasswordPlaceholder: "Your password",
    deployTokenGenerateBtn: "Generate Token",
    deployTokenCancelBtn: "Cancel",
    deployTokenGenerating: "Generating...",
    deployTokenSuccess: "Token generated successfully!",
    deployTokenCopyHint: "Copy this token. It will be displayed only once!",
    deployTokenWarning: "⚠️ Save this token in a safe place. You won't be able to see it again!",
    deployTokenCopyBtn: "Copy",
    deployTokenCopied: "Copied!",
    deployTokenCloseBtn: "Close",
    deployTokenPasswordRequired: "Enter password",
    deployTokenInvalidPassword: "Invalid password",
    deployTokenGenerationError: "Token generation error",
    deployTokenGenerated: "Token generated",
    duration: "Duration",
      
    capsWarning: "Caps Lock is on",
    capsWarning2: "Caps Lock enabled",
    
    calendarMonthJanuary: "January",
    calendarMonthFebruary: "February",
    calendarMonthMarch: "March",
    calendarMonthApril: "April",
    calendarMonthMay: "May",
    calendarMonthJune: "June",
    calendarMonthJuly: "July",
    calendarMonthAugust: "August",
    calendarMonthSeptember: "September",
    calendarMonthOctober: "October",
    calendarMonthNovember: "November",
    calendarMonthDecember: "December",
    
    calendarWeekdayMon: "Mon",
    calendarWeekdayTue: "Tue",
    calendarWeekdayWed: "Wed",
    calendarWeekdayThu: "Thu",
    calendarWeekdayFri: "Fri",
    calendarWeekdaySat: "Sat",
    calendarWeekdaySun: "Sun",
    everydayLabel: "Every day",
  weekdaysLabel: "Weekdays (Mon-Fri)",
  weekendLabel: "Weekend (Sat-Sun)",
        daySingle: "day",
  daysPlural: "days",
      calendarDateLabel: "Date:",
calendarHoursLabel: "Hours:",
    
    calendarPrevMonth: "Previous month",
    calendarNextMonth: "Next month",
    calendarToday: "Today",
    calendarTodayLegend: "Today",
    calendarSelectedLegend: "Selected day",
    calendarHasSchedulesLegend: "Day with entries",
    calendarNoSchedulesForDay: "No entries for this day",
    calendarSchedulesForDay: "Entries for day",
    calendarTotalSchedules: "All entries",
    calendarActiveSchedules: "Active",
    calendarPausedSchedules: "Paused",
    calendarCompletedSchedules: "Completed",
      
    calendarFrom: "from",
    calendarTo: "to",
    calendarMultiDay: "multi-day",
    calendarMultiDayLegend: "Multi-day entry",
      
    videoPlayerTitle: "Video Player",
    videoBrowserNotSupported: "Your browser does not support video playback.",
    videoPlayBtn: "Play",
      
    deleteFileError: "Error deleting file",
    deleteFileTitle: "Delete this file",
    daysAbbreviation: "d",
    selectedCountLabel: "selected",
    schedulesDeleted: "schedules deleted",
    deletedWithErrors: "deleted, ",
    failedToDelete: "failed",
      
    invalidFileType: "Only image, video, PDF, ZIP and JS files are allowed",
  fileTooLarge: "File is too large. Maximum size: 50MB",
      
impersonateTitle: "Account Impersonation",
    impersonateDesc: "View other user accounts",
    impersonateBtn: "Manage",
    impersonateModalTitle: "Account Impersonation",
    impersonateHelp: "Select a user whose account you want to view. You will have full access to their permissions.",
    exitImpersonateBtn: "🏠 Return to root account",
    impersonating: "IMPERSONATING",
    currentlyViewing: "Currently viewing:",
    loggedAsRoot: "Logged in as root:",
    impersonateUserBtn: "👁️ View Account",
    currentlyActive: "ACTIVE",
    noUsersForImpersonation: "No users available for impersonation.",
    noPermissionImpersonate: "Only root can use account impersonation",
    impersonateWelcome: "Welcome",
    returnToRoot: "Return to root account",
    
    confirmTitle: "Confirmation",
    confirmBtn: "Confirm",
    cancelBtn: "Cancel",
    impersonateConfirm: "Are you sure you want to switch to viewing the account of user \"{userName}\"?",
    exitImpersonateConfirm: "Are you sure you want to return to your root account?",
      
      userGroupsTitle: "User Groups Management",
    userGroupsPrimary: "Primary group",
    userGroupsAdditional: "Additional groups",
    userGroupsAvailable: "Available groups",
    userGroupsSelected: "Selected groups",
    userGroupsAddBtn: "Add group",
    userGroupsRemoveBtn: "Remove",
    userGroupsChangePrimaryBtn: "Change primary group",
    userGroupsSaveBtn: "Save changes",
    userGroupsCancelBtn: "Cancel",
    userGroupsSuccess: "Groups updated successfully",
    userGroupsError: "Error updating groups",
    userGroupsMinOneError: "User must have at least 1 group",
    userGroupsCannotRemovePrimary: "Cannot remove primary group",
    userGroupsNoAccess: "No access to edit groups",
    
    billboardChangeGroupOwner: "Change device group",
    billboardSelectNewGroup: "Select new group",
    billboardGroupChangeSuccess: "Device group changed",
    billboardGroupChangeError: "Error changing group",
    billboardGroupNoAccess: "No access to this group",
      
          userGroupsPrimary: "Primary group",
    userGroupsAdditional: "Additional groups",
    userGroupsAvailable: "Available groups",
      
        noPrimaryGroup: "No primary group assigned",
  noAdditionalGroups: "No additional groups",
      
      ownerGroupAutoAssign: "This group will be automatically added to your additional groups",
groupAddedAutoAssigned: "Group created and added to your additional groups",
      
      ownerGroupsNote: "You can see all your groups (main and additional)",
      selectedCountLabel: "selected",
      optional: "optional",
      
impersonateCompaniesTab: "Companies",
impersonateUsersTab: "Users",
impersonateCompanyConfirm: "Are you sure you want to switch to viewing company \"{companyName}\"? You will have view like Owner, but retain ROOT permissions (you can even delete owners).",
impersonatingAsCompany: "Company view as ROOT",
companyRootAccessNote: "You have ROOT access - you can manage even owners of this company",
confirmCompanyImpersonateBtn: "Enter as company",
impersonateCompanyBtn: "👁️ View company",
companyName: "Company Name",
companyUsersCount: "Users",
companyStatus: "Status",
companyAction: "Action",
companyViewAsOwner: "View as Owner",
companyOwnerAvailable: "Owner Available",
companyOwnerUnavailable: "No Owner (view as admin/user)",
noCompaniesForImpersonation: "No companies available for impersonation",
companyViewAsOwnerBtn: "👁️ View as Owner",
      impersonateHelpcompany: "Select a company to view. You will see it as the Owner, but retain ROOT permissions.",
      
          additional: "additional",
    userGroupsNoAdditional: "No additional groups",
    has: "has",
    none: "none",
      startTimeLabel: "Start time",
endTimeLabel: "End time",  
dateTimeSection: "Date and time",
timeFormatHint: "Format: HH:MM:SS",
additionalHoursLabel: "Additional hours",
addHourBtn: "Add hour",
additionalHoursHint: "You can add additional hours during the day",
      
          priorityLabel: "Priority",
    priorityHint: "0 = lowest, 2 = highest",
      
      companiesTitle: "Companies",
companiesDesc: "Manage users companies",
companiesBtn: "Manage",
companiesModalTitle: "Companies List",
companiesConnectedPrefix: "Companies in database:",
tableCompanyName: "Company name",
tableCompanyActions: "Actions",
companyActionsTitle: "Actions for company:",
addCompanyTitle: "Add Company",
addCompanyNamePlaceholder: "Company name",
addCompanyError: "Error adding company",
companyAdded: "Company added!",
companyDeleted: "Company deleted",
deleteCompanyBtn: "Delete company",
deleteCompanyConfirm: "Are you sure you want to delete company",
deleteCompanyError: "Error deleting company",
companyHasUsersError: "Cannot delete company because it has assigned users",
noCompaniesFound: "No companies in database",
onlyRootCanManageCompanies: "Only root can manage companies",
sameNameError: "Enter a different name than the current one",
      withoutCompany: 'without company',
      changeCompanyBtn: "Change Company",
       current: "Current",
      
      instructionsTitle: "Instructions",
instructionsDesc: "User guide and documentation",
instructionsBtn: "Open",
instructionsModalTitle: "User Instructions",
      
       groupsStatus: "Active:",
  groupsTitle: "Groups",
  groupsBtn: "Manage",
  billboardsStatus: "Active:",
  billboardsTitle: "Devices",
  billboardsBtn: "Manage",
  refreshGroupsSuccess: "Groups have been refreshed",
  refreshBillboardsSuccess: "Devices have been refreshed",
  refreshing: "Refreshing...",
  refreshError: "Error while refreshing",
  refreshTitle: "Refresh",
  refreshBtn: "⟳",
      
       collisionErrorTitle: "Schedule Collision",
    collisionErrorMessage: "Cannot save schedule due to collision with existing schedules:",
    collisionErrorHint: "Please change dates, times, weekdays or priority.",
    collisionRulesTitle: "Collision rules:",
    collisionRule0: "No collision with any schedule",
    collisionRule1: "Collision only with other Priority 1",
    collisionRule2: "Collision only with other Priority 2"
  }
};

// ============================= ELEMENTS (zadeklarowane globalnie) ===========================
let modal = null;
let openBtn = null;
let closeBtn = null;
let themeSwitcher = null;
let languageSwitcher = null;
let billboardsModal = null;
let openBillboardsBtn = null;
let closeBillboardsBtn = null;
let billboardsList = null;
let connectedCount = null;
let usersModal = null;
let usersList = null;
let connectedUsersCount = null;
let openUsersBtn = null;
let closeUsersBtn = null;
let groupsModal = null;
let groupsList = null;
let connectedGroupsCount = null;
let openGroupsBtn = null;
let closeGroupsBtn = null;
let userActionsModal = null;
let actionUsername = null;
let changePasswordBtn = null;
let changeRoleBtn = null;
let changeGroupBtn = null;
let deleteUserBtn = null;
let closeUserActions = null;
let groupActionsModal = null;
let actionGroupname = null;
let renameGroupBtn = null;
let deleteGroupBtn = null;
let closeGroupActions = null;
let billboardActionsModal = null;
let actionBillboardname = null;
let renameBillboardBtn = null;
let deleteBillboardBtn = null;
let closeBillboardActions = null;
let scheduleModal = null;
let openScheduleBtn = null;
let closeScheduleBtn = null;
let scheduleList = null;
let scheduleBillboardSelect = null;
let addScheduleBtn = null;
let visualizeBtn = null;
let visualizationModal = null;
let closeVisualizationBtn = null;
let visualizationBillboardName = null;
let calendarContainer = null;
let scheduleEditModal = null;
let scheduleEditTitle = null;
let saveScheduleBtn = null;
let cancelScheduleBtn = null;
let companiesModal = null;
let companiesList = null;
let connectedCompaniesCount = null;
let openCompaniesBtn = null;
let closeCompaniesBtn = null;
let companyActionsModal = null;
let actionCompanyname = null;
let renameCompanyBtn = null;
let deleteCompanyBtn = null;
let closeCompanyActions = null;

// ============================= GLOBAL VARIABLES ===========================
window.billboardsCount = 0;
window.totalBillboardsCount = 0;
window.billboardImages = [];
window.currentImageMode = 'select';
window.selectedUser = null;
window.selectedGroup = null;
window.selectedBillboard = null;
window.currentUser = null;
window.selectedBillboardForSchedule = null;
window.currentSchedule = null;
window.globalCapsLockOn = false;
window.currentCalendarMonth = new Date().getMonth();
window.currentCalendarYear = new Date().getFullYear();
window.selectedCalendarDay = null;
window.calendarSchedulesData = {};
window.currentVisualizationBillboardName = "";

//Do podglądu
window.impersonateModal = null;
window.openImpersonateBtn = null;
window.closeImpersonateBtn = null;
window.impersonateUserList = null;
window.impersonateCompanyList = null;
window.exitImpersonateBtn = null;
window.exitImpersonateBannerBtn = null;
window.impersonationBanner = null;
window.impersonateTile = null;

// ============================= INITIALIZE ELEMENTS ===========================
window.initializeElements = function() {
  console.log('🔧 DOMContentLoaded w rest.js');
  
  // ============================= ELEMENTY MODALI USTAWIEŃ ===========================
  modal = document.getElementById("settingsModal");
  openBtn = document.getElementById("openSettings");
  closeBtn = document.getElementById("closeSettings");
  themeSwitcher = document.getElementById("themeSwitcher");
  languageSwitcher = document.getElementById("languageSwitcher");

  // ============================= ELEMENTY MODALI GRUP ===========================
  groupsModal = document.getElementById("groupsModal");
  groupsList = document.getElementById("groupsList");
  connectedGroupsCount = document.getElementById("connectedGroupsCount");
  openGroupsBtn = document.getElementById("openGroupsBtn");
  closeGroupsBtn = document.getElementById("closeGroupsModal");

  // ============================= ELEMENTY MODALI FIRM ===========================
  companiesModal = document.getElementById("companiesModal");
  companiesList = document.getElementById("companiesList");
  connectedCompaniesCount = document.getElementById("connectedCompaniesCount");
  openCompaniesBtn = document.getElementById("openCompaniesBtn");
  closeCompaniesBtn = document.getElementById("closeCompaniesModal");

  // ============================= ELEMENTY MODALI URZĄDZEŃ ===========================
  billboardsModal = document.getElementById("billboardsModal");
  openBillboardsBtn = document.getElementById("openBillboardsModal");
  closeBillboardsBtn = document.getElementById("closeBillboardsModal");
  billboardsList = document.getElementById("billboardsList");
  connectedCount = document.getElementById("connectedCount");

  // ============================= ELEMENTY MODALI HARMONOGRAMÓW ===========================
  scheduleModal = document.getElementById("scheduleModal");
  openScheduleBtn = document.getElementById("openScheduleBtn");
  closeScheduleBtn = document.getElementById("closeScheduleModal");
  scheduleList = document.getElementById("scheduleList");
  scheduleBillboardSelect = document.getElementById("scheduleBillboardSelect");
  addScheduleBtn = document.getElementById("addScheduleBtn");
  visualizeBtn = document.getElementById("visualizeBtn");

  // ============================= ELEMENTY MODALI UŻYTKOWNIKÓW ===========================
  usersModal = document.getElementById("usersModal");
  usersList = document.getElementById("usersList");
  connectedUsersCount = document.getElementById("connectedUsersCount");
  openUsersBtn = document.getElementById("openUsersBtn");
  closeUsersBtn = document.getElementById("closeUsersModal");

  // ============================= ELEMENTY AKCJI UŻYTKOWNIKÓW ===========================
  userActionsModal = document.getElementById("userActionsModal");
  actionUsername = document.getElementById("actionUsername");
  changePasswordBtn = document.getElementById("changePasswordBtn");
  changeRoleBtn = document.getElementById("changeRoleBtn");
  changeGroupBtn = document.getElementById("changeGroupBtn");
  deleteUserBtn = document.getElementById("deleteUserBtn");
  closeUserActions = document.getElementById("closeUserActions");
  renameUserBtn = document.getElementById("renameUserBtn");
 changeCompanyBtn = document.getElementById("changeCompanyBtn");

  // ============================= ELEMENTY AKCJI GRUP ===========================
  groupActionsModal = document.getElementById("groupActionsModal");
  actionGroupname = document.getElementById("actionGroupname");
  renameGroupBtn = document.getElementById("renameGroupBtn");
  deleteGroupBtn = document.getElementById("deleteGroupBtn");
  closeGroupActions = document.getElementById("closeGroupActions");

  // ============================= ELEMENTY AKCJI FIRM ===========================
  companyActionsModal = document.getElementById("companyActionsModal");
  actionCompanyname = document.getElementById("actionCompanyname");
  renameCompanyBtn = document.getElementById("renameCompanyBtn");
  deleteCompanyBtn = document.getElementById("deleteCompanyBtn");
  closeCompanyActions = document.getElementById("closeCompanyActions");

  // ============================= ELEMENTY AKCJI URZĄDZEŃ ===========================
  billboardActionsModal = document.getElementById("billboardActionsModal");
  actionBillboardname = document.getElementById("actionBillboardname");
  renameBillboardBtn = document.getElementById("renameBillboardBtn");
  deleteBillboardBtn = document.getElementById("deleteBillboardBtn");
  closeBillboardActions = document.getElementById("closeBillboardActions");

  // ============================= ELEMENTY WIZUALIZACJI ===========================
  visualizationModal = document.getElementById("visualizationModal");
  closeVisualizationBtn = document.getElementById("closeVisualizationModal");
  visualizationBillboardName = document.getElementById("visualizationBillboardName");
  calendarContainer = document.getElementById("calendarContainer");

  // ============================= ELEMENTY EDYCJI HARMONOGRAMU ===========================
  scheduleEditModal = document.getElementById("scheduleEditModal");
    
  // ============================= ELEMENTY IMPERSONACJI ===========================
  window.impersonateModal = document.getElementById("impersonateModal");
  window.openImpersonateBtn = document.getElementById("openImpersonateBtn");
  window.closeImpersonateBtn = document.getElementById("closeImpersonateModal");
  window.impersonateUserList = document.getElementById("impersonateUserList");
  window.impersonateCompanyList = document.getElementById("impersonateCompanyList");
  window.exitImpersonateBtn = document.getElementById("exitImpersonateBtn");
  window.exitImpersonateBannerBtn = document.getElementById("exitImpersonateBannerBtn");
  window.impersonationBanner = document.getElementById("impersonationBanner");
  window.impersonateTile = document.getElementById("impersonateTile");

  // ============================= EVENT LISTENERS DLA USTAWIEN ===========================
  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
      openBtn.style.transform = "rotate(20deg) scale(1.07)";
    });

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      openBtn.style.transform = "";
    });

    modal.addEventListener("click", e => {
      if(e.target === modal){
        modal.style.display = "none";
        openBtn.style.transform = "";
      }
    });
  }

  // ============================= EVENT LISTENERS DLA GRUP ===========================
  if (openGroupsBtn && groupsModal) {
    openGroupsBtn.addEventListener("click", () => {
      groupsModal.style.display = "flex";
      if (typeof window.loadGroups === 'function') {
        window.loadGroups();
      }
    });
  }

  if (closeGroupsBtn) {
    closeGroupsBtn.addEventListener("click", () => groupsModal.style.display = "none");
  }
  
  if (groupsModal) {
    groupsModal.addEventListener("click", e => { 
      if(e.target===groupsModal) groupsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA FIRM ===========================
  if (openCompaniesBtn && companiesModal) {
    openCompaniesBtn.addEventListener("click", () => {
      companiesModal.style.display = "flex";
      if (typeof window.loadCompanies === 'function') {
        window.loadCompanies();
      }
    });
  }

  if (closeCompaniesBtn) {
    closeCompaniesBtn.addEventListener("click", () => companiesModal.style.display = "none");
  }
  
  if (companiesModal) {
    companiesModal.addEventListener("click", e => { 
      if(e.target===companiesModal) companiesModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA URZĄDZEŃ ===========================
  if (openBillboardsBtn && billboardsModal) {
    openBillboardsBtn.addEventListener("click", () => {
      billboardsModal.style.display = "flex";
      if (typeof window.loadBillboards === 'function') {
        window.loadBillboards();
      }
    });
  }

  if (closeBillboardsBtn) {
    closeBillboardsBtn.addEventListener("click", () => billboardsModal.style.display = "none");
  }
  
  if (billboardsModal) {
    billboardsModal.addEventListener("click", e => { 
      if(e.target===billboardsModal) billboardsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA HARMONOGRAMÓW ===========================
  if (openScheduleBtn && scheduleModal) {
    openScheduleBtn.addEventListener("click", async () => {
      scheduleModal.style.display = "flex";
      
      if (typeof window.loadBillboardsForSchedule === 'function') {
        await window.loadBillboardsForSchedule();
      } else {
        console.error('Funkcja loadBillboardsForSchedule nie jest zdefiniowana!');
        window.showToast("Błąd ładowania urządzeń", "error");
      }
    });
  }

  if (closeScheduleBtn) {
    closeScheduleBtn.addEventListener("click", () => scheduleModal.style.display = "none");
  }
  
  if (scheduleModal) {
    scheduleModal.addEventListener("click", e => { 
      if(e.target === scheduleModal) scheduleModal.style.display = "none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA UŻYTKOWNIKÓW ===========================
  if (openUsersBtn && usersModal) {
    openUsersBtn.addEventListener("click", () => {
      usersModal.style.display = "flex";
      if (typeof window.loadUsers === 'function') {
        window.loadUsers();
      }
    });
  }

  if (closeUsersBtn) {
    closeUsersBtn.addEventListener("click", () => usersModal.style.display="none");
  }
  
  if (usersModal) {
    usersModal.addEventListener("click", e => { 
      if(e.target===usersModal) usersModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA AKCJI UŻYTKOWNIKÓW ===========================
  if (closeUserActions) {
    closeUserActions.addEventListener("click", () => userActionsModal.style.display="none");
  }
  
  if (userActionsModal) {
    userActionsModal.addEventListener("click", e => { 
      if(e.target===userActionsModal) userActionsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA AKCJI GRUP ===========================
  if (closeGroupActions) {
    closeGroupActions.addEventListener("click", () => groupActionsModal.style.display="none");
  }
  
  if (groupActionsModal) {
    groupActionsModal.addEventListener("click", e => { 
      if(e.target===groupActionsModal) groupActionsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA AKCJI FIRM ===========================
  if (closeCompanyActions) {
    closeCompanyActions.addEventListener("click", () => companyActionsModal.style.display="none");
  }
  
  if (companyActionsModal) {
    companyActionsModal.addEventListener("click", e => { 
      if(e.target===companyActionsModal) companyActionsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA AKCJI URZĄDZEŃ ===========================
  if (closeBillboardActions) {
    closeBillboardActions.addEventListener("click", () => billboardActionsModal.style.display="none");
  }
  
  if (billboardActionsModal) {
    billboardActionsModal.addEventListener("click", e => { 
      if(e.target===billboardActionsModal) billboardActionsModal.style.display="none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA WIZUALIZACJI ===========================
  if (closeVisualizationBtn) {
    closeVisualizationBtn.addEventListener("click", () => {
      visualizationModal.style.display = "none";
    });
  }
  
  if (visualizationModal) {
    visualizationModal.addEventListener("click", e => { 
      if(e.target === visualizationModal) visualizationModal.style.display = "none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA EDYCJI HARMONOGRAMU ===========================
  if (scheduleEditModal) {
    scheduleEditModal.addEventListener("click", e => { 
      if(e.target === scheduleEditModal) scheduleEditModal.style.display = "none"; 
    });
  }

  // ============================= EVENT LISTENERS DLA PRZYCISKÓW AKCJI ===========================
  if (renameGroupBtn) {
    renameGroupBtn.addEventListener("click", function() {
      if (typeof window.renameGroup === 'function') {
        window.renameGroup();
      }
    });
  }

  if (deleteGroupBtn) {
    deleteGroupBtn.addEventListener("click", function() {
      if (typeof window.deleteGroup === 'function') {
        window.deleteGroup();
      }
    });
  }

  if (renameCompanyBtn) {
    renameCompanyBtn.addEventListener("click", function() {
      if (typeof window.renameCompany === 'function') {
        window.renameCompany();
      }
    });
  }

  if (deleteCompanyBtn) {
    deleteCompanyBtn.addEventListener("click", function() {
      if (typeof window.deleteCompany === 'function') {
        window.deleteCompany();
      }
    });
  }

  if (renameBillboardBtn) {
    renameBillboardBtn.addEventListener("click", function() {
      if (typeof window.renameBillboard === 'function') {
        window.renameBillboard();
      }
    });
  }

  if (deleteBillboardBtn) {
    deleteBillboardBtn.addEventListener("click", function() {
      if (typeof window.deleteBillboard === 'function') {
        window.deleteBillboard();
      }
    });
  }

  // ============================= EVENT LISTENERS DLA MOTYWU I JĘZYKA ===========================
  if (themeSwitcher) {
    themeSwitcher.addEventListener("change", () => updateTheme(themeSwitcher.value));
  }
  
  if (languageSwitcher) {
    languageSwitcher.addEventListener("change", () => updateLanguage(languageSwitcher.value));
  }

  // ============================= EVENT LISTENERS DLA WYLOGOWANIA ===========================
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = '/logout';
    });
  }
    
  // ============================= EVENT LISTENERS DLA IMPERSONACJI ===========================
  if (window.openImpersonateBtn && window.impersonateModal) {
    window.openImpersonateBtn.addEventListener("click", () => {
      window.impersonateModal.style.display = "flex";
      
      if (typeof window.updateImpersonationModalTexts === 'function') {
        window.updateImpersonationModalTexts();
      }
      
      setTimeout(() => {
        if (typeof window.switchImpersonationTab === 'function') {
          window.switchImpersonationTab('companies');
        }
      }, 50);
    });
  }

  if (window.closeImpersonateBtn) {
    window.closeImpersonateBtn.addEventListener("click", () => {
      if (window.impersonateModal) {
        window.impersonateModal.style.display = "none";
      }
    });
  }
  
  if (window.impersonateModal) {
    window.impersonateModal.addEventListener("click", e => { 
      if(e.target === window.impersonateModal) {
        window.impersonateModal.style.display = "none"; 
      }
    });
  }
  
  if (window.exitImpersonateBtn) {
    window.exitImpersonateBtn.addEventListener("click", function() {
      if (typeof window.exitImpersonation === 'function') {
        window.exitImpersonation();
      }
    });
  }

  if (window.exitImpersonateBannerBtn) {
    window.exitImpersonateBannerBtn.addEventListener("click", function() {
      if (typeof window.exitImpersonation === 'function') {
        window.exitImpersonation();
      }
    });
  }
  
  const companiesTab = document.getElementById('impersonateTabCompanies');
  const usersTab = document.getElementById('impersonateTabUsers');
  
  if (companiesTab && usersTab) {
    companiesTab.addEventListener('click', function() {
      if (typeof window.switchImpersonationTab === 'function') {
        window.switchImpersonationTab('companies');
      }
    });
    
    usersTab.addEventListener('click', function() {
      if (typeof window.switchImpersonationTab === 'function') {
        window.switchImpersonationTab('users');
      }
    });
  }
    
    // ============================= PRZYCISKI ODŚWIEŻANIA ===========================
const refreshGroupsBtn = document.getElementById("refreshGroupsBtn");
const refreshBillboardsBtn = document.getElementById("refreshBillboardsBtn");


if (refreshGroupsBtn) {
  refreshGroupsBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const btn = this;
    const lang = getCookie("language") || "pl";
    const t = translations[lang];
    
    btn.classList.add("loading");
    btn.disabled = true;
    
    try {
      if (typeof window.updateGroupsCount === 'function') {
        await window.updateGroupsCount();
      }
      
      if (groupsModal && groupsModal.style.display === "flex") {
        if (typeof window.loadGroups === 'function') {
          await window.loadGroups();
        }
      }
      
      window.showToast(t.refreshGroupsSuccess, "success");
      
    } catch (err) {
      console.error("Błąd odświeżania grup:", err);
      window.showToast(t.refreshError, "error");
    } finally {
      setTimeout(() => {
        btn.classList.remove("loading");
        btn.disabled = false;
      }, 300);
    }
  });
}

if (refreshBillboardsBtn) {
  refreshBillboardsBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const btn = this;
    const lang = getCookie("language") || "pl";
    const t = translations[lang];
    
    btn.classList.add("loading");
    btn.disabled = true;
    
    try {
      if (typeof window.updateBillboardsCount === 'function') {
        await window.updateBillboardsCount();
      }
      
      if (billboardsModal && billboardsModal.style.display === "flex") {
        if (typeof window.loadBillboards === 'function') {
          await window.loadBillboards();
        }
      }
      
      window.showToast(t.refreshBillboardsSuccess, "success");
      
    } catch (err) {
      console.error("Błąd odświeżania urządzeń:", err);
      window.showToast(t.refreshError, "error");
    } finally {
      setTimeout(() => {
        btn.classList.remove("loading");
        btn.disabled = false;
      }, 300);
    }
  });
}
    
};

// ============================= ODSWIEZANIE LICZNIKA GRUP ===========================
window.updateGroupsCount = async function() {
  try {
    const response = await fetch('/api/groupslist', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const groups = await response.json();
    
    if (Array.isArray(groups)) {
      const groupsCount = groups.length;
      
      const groupsCountElement = document.getElementById('groupsCount');
      if (groupsCountElement) {
        groupsCountElement.textContent = groupsCount;
      }
      
      const lang = getCookie("language") || "pl";
      const t = translations[lang];
      
      const groupsTile = document.querySelector('.tile:first-child p');
      if (groupsTile) {
        groupsTile.innerHTML = `${t.groupsStatus} <span class="status-active" id="groupsCount">${groupsCount}</span>`;
      }
    }
  } catch (err) {
    console.error('Nie udało się pobrać liczby grup:', err);
  }
}

window.refreshGroupsTile = function() {
  const tiles = document.querySelectorAll(".tile");
  if (!tiles || tiles.length < 1) return;
  
  const groupsTile = tiles[0];
  const lang = getCookie("language") || "pl";
  const t = translations[lang];
  
  const p = groupsTile.querySelector("p");
  if (p) {
    const groupsCountElement = document.getElementById('groupsCount');
    const groupsCount = groupsCountElement ? groupsCountElement.textContent : "0";
    
    p.innerHTML = `${t.groupsStatus} <span class="status-active" id="groupsCount">${groupsCount}</span>`;
  }
}

window.updateBillboardsCount = async function() {
  try {
    const res = await fetch("/api/telebimlist", {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error("Błąd serwera");
    }
    
    const billboards = await res.json();
    
    if (Array.isArray(billboards)) {
      const onlineCount = billboards.filter(b => b.is_connected === 1).length;
      const totalCount = billboards.length;
      
      window.billboardsCount = onlineCount;
      window.totalBillboardsCount = totalCount;
      
      const billboardsCountElement = document.getElementById('billboardsCount');
      if (billboardsCountElement) {
        billboardsCountElement.textContent = `${onlineCount}/${totalCount}`;
      }
      
      if (window.refreshBillboardsTile) {
        window.refreshBillboardsTile();
      }
      
      const lang = getCookie("language") || "pl";
      const t = translations[lang];
      
      const billboardsTile = document.querySelector('.tile:nth-child(2) p');
      if (billboardsTile) {
        billboardsTile.innerHTML = `${t.billboardsStatus} <span class="status-active" id="billboardsCount">${onlineCount}/${totalCount}</span>`;
      }
    }
  } catch (err) {
    console.error('Nie udało się pobrać liczby urządzeń:', err);
    
    const billboardsCountElement = document.getElementById('billboardsCount');
    if (billboardsCountElement) {
      billboardsCountElement.textContent = "?/?";
    }
  }
}

window.refreshBillboardsTile = function() {
  const tiles = document.querySelectorAll(".tile");
  if (!tiles || tiles.length < 2) return;
  
  const deviceTile = tiles[1];
  const lang = getCookie("language") || "pl";
  const t = translations[lang];
  
  const p = deviceTile.querySelector("p");
  if (p) {
    const onlineCount = window.billboardsCount || 0;
    const totalCount = window.totalBillboardsCount || 0;
    
    p.innerHTML = `${t.billboardsStatus} <span class="status-active" id="billboardsCount">${onlineCount}/${totalCount}</span>`;
  }
}

// ============================= THEME ===========================
window.updateTheme = function(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  setCookie("theme", theme);
}

// ============================= LANGUAGE ===========================
window.updateLanguage = function(lang) {
  const t = translations[lang];

  document.getElementById("htmlLang").lang = lang;
  document.querySelector(".dashboard-header h1").textContent = t.dashboardTitle;
  document.querySelector(".dashboard-header p").textContent = t.dashboardSubtitle;

  const tiles = document.querySelectorAll(".tile");
    
  if (tiles[0]) {
    tiles[0].querySelector("h3").textContent = t.groupsTitle;
    const groupsCountElement = document.getElementById('groupsCount');
    const groupsCount = groupsCountElement ? groupsCountElement.textContent : "0";
    tiles[0].querySelector("p").innerHTML = `${t.groupsStatus} <span class="status-active" id="groupsCount">${groupsCount}</span>`;
    tiles[0].querySelector(".tile-btn").textContent = t.groupsBtn;
  }
    
  if (tiles[1]) {
    tiles[1].querySelector("h3").textContent = t.billboardsTitle;
    const billboardsCountElement = document.getElementById('billboardsCount');
    if (billboardsCountElement) {
      const onlineCount = window.billboardsCount || 0;
      const totalCount = window.totalBillboardsCount || 0;
      billboardsCountElement.textContent = `${onlineCount}/${totalCount}`;
      tiles[1].querySelector("p").innerHTML = `${t.billboardsStatus} <span class="status-active" id="billboardsCount">${onlineCount}/${totalCount}</span>`;
    }
    tiles[1].querySelector(".tile-btn").textContent = t.billboardsBtn;
  }
    
  if (tiles[2]) {
    tiles[2].querySelector("h3").textContent = t.scheduleTitle;
    tiles[2].querySelector("p").textContent = t.scheduleDesc;
    tiles[2].querySelector(".tile-btn").textContent = t.scheduleBtn;
  }

  if (tiles[3]) {
    tiles[3].querySelector("h3").textContent = t.usersTitle;
    tiles[3].querySelector("p").textContent = t.usersDesc;
    tiles[3].querySelector(".tile-btn").textContent = t.usersBtn;
  }

  const companiesTile = document.getElementById('companiesTile');
  if (companiesTile) {
    companiesTile.querySelector('h3').textContent = t.companiesTitle;
    companiesTile.querySelector('p').textContent = t.companiesDesc;
    companiesTile.querySelector('.tile-btn').textContent = t.companiesBtn;
  }

  if (impersonateTile) {
    impersonateTile.querySelector("h3").textContent = t.impersonateTitle;
    impersonateTile.querySelector("p").textContent = t.impersonateDesc;
    impersonateTile.querySelector(".tile-btn").textContent = t.impersonateBtn;
  }
  
  if (document.getElementById("settingsTitle")) {
    document.getElementById("settingsTitle").textContent = t.modalTitle;
  }
  
  if (document.getElementById("langLabel")) {
    document.getElementById("langLabel").textContent = t.langLabel;
  }
  
  if (document.getElementById("themeLabel")) {
    document.getElementById("themeLabel").textContent = t.themeLabel;
  }
  
  if (document.getElementById("closeSettings")) {
    document.getElementById("closeSettings").textContent = t.closeBtn;
  }

  if (themeSwitcher) {
    themeSwitcher.options[0].text = lang === "pl" ? "Jasny" : "Light";
    themeSwitcher.options[1].text = lang === "pl" ? "Ciemny" : "Dark";
  }

  if (document.querySelector("#billboardsModal h2")) {
    document.querySelector("#billboardsModal h2").textContent = t.billboardsModalTitle;
  }
  
  if (document.getElementById("connectedCount")) {
    const prevSibling = document.getElementById("connectedCount").previousSibling;
    if (prevSibling && prevSibling.nodeType === 3) {
      prevSibling.textContent = t.billboardsConnectedPrefix + " ";
    }
  }
  
  if (closeBillboardsBtn) {
    closeBillboardsBtn.textContent = t.closeBtn;
  }

  if (document.querySelector("#usersModal h2")) {
    document.querySelector("#usersModal h2").textContent = t.usersModalTitle;
  }
  
  if (document.getElementById("connectedUsersCount")) {
    const prevSibling = document.getElementById("connectedUsersCount").previousSibling;
    if (prevSibling && prevSibling.nodeType === 3) {
      prevSibling.textContent = t.usersConnectedPrefix + " ";
    }
  }
  
  if (closeUsersBtn) {
    closeUsersBtn.textContent = t.closeBtn;
  }

  if (document.querySelector("#groupsModal h2")) {
    document.querySelector("#groupsModal h2").textContent = t.groupsModalTitle;
  }
  
  if (document.getElementById("connectedGroupsCount")) {
    const prevSibling = document.getElementById("connectedGroupsCount").previousSibling;
    if (prevSibling && prevSibling.nodeType === 3) {
      prevSibling.textContent = t.groupsConnectedPrefix + " ";
    }
  }
  
  if (closeGroupsBtn) {
    closeGroupsBtn.textContent = t.closeBtn;
  }

  if (document.querySelector("#companiesModal h2")) {
    document.querySelector("#companiesModal h2").textContent = t.companiesModalTitle;
  }
  
  if (document.getElementById("connectedCompaniesCount")) {
    const prevSibling = document.getElementById("connectedCompaniesCount").previousSibling;
    if (prevSibling && prevSibling.nodeType === 3) {
      prevSibling.textContent = t.companiesConnectedPrefix + " ";
    }
  }
  
  if (closeCompaniesBtn) {
    closeCompaniesBtn.textContent = t.closeBtn;
  }

  if (scheduleModal) {
    if (document.querySelector("#scheduleModal h2")) {
      document.querySelector("#scheduleModal h2").textContent = t.scheduleModalTitle;
    }
    
    if (scheduleBillboardSelect) {
      const placeholderOption = scheduleBillboardSelect.querySelector('option[value=""]');
      if (placeholderOption) placeholderOption.textContent = t.selectBillboardPlaceholder;
    }
    
    if (addScheduleBtn) addScheduleBtn.textContent = t.addScheduleBtn;
    if (visualizeBtn) visualizeBtn.textContent = t.visualizeScheduleBtn;
    
    if (closeScheduleBtn) {
      closeScheduleBtn.textContent = t.closeBtn;
    }
  }

  if (visualizationModal) {
    if (document.querySelector("#visualizationModal h2")) {
      document.querySelector("#visualizationModal h2").textContent = t.visualizationModalTitle;
    }
    
    if (closeVisualizationBtn) {
      closeVisualizationBtn.textContent = t.closeBtn;
    }
  }

  if (scheduleEditModal) {
    const scheduleEditTitle = scheduleEditModal.querySelector("h3");
    if (scheduleEditTitle) scheduleEditTitle.textContent = t.scheduleEditTitle;

    const scheduleLabels = scheduleEditModal.querySelectorAll("label");
    if (scheduleLabels[0]) scheduleLabels[0].textContent = t.taskNameLabel;
    if (scheduleLabels[1]) scheduleLabels[1].textContent = t.contentLabel;
    if (scheduleLabels[2]) scheduleLabels[2].textContent = t.startDateLabel;
    if (scheduleLabels[3]) scheduleLabels[3].textContent = t.endDateLabel;
    if (scheduleLabels[4]) scheduleLabels[4].textContent = t.repeatLabel;
    if (scheduleLabels[5]) scheduleLabels[5].textContent = t.statusLabel;

    const repeatSelect = document.getElementById("scheduleRepeat");
    if (repeatSelect) {
      repeatSelect.options[0].text = t.repeatOnce;
      repeatSelect.options[1].text = t.repeatDaily;
      repeatSelect.options[2].text = t.repeatWeekly;
      repeatSelect.options[3].text = t.repeatMonthly;
    }

    const statusSelect = document.getElementById("scheduleStatus");
    if (statusSelect) {
      statusSelect.options[0].text = t.statusActive;
      statusSelect.options[1].text = t.statusPaused;
      statusSelect.options[2].text = t.statusCompleted;
    }

    const saveScheduleBtn = document.getElementById("saveScheduleBtn");
    const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");
    if (saveScheduleBtn) saveScheduleBtn.textContent = t.saveBtn;
    if (cancelScheduleBtn) cancelScheduleBtn.textContent = t.cancelBtn;
  }
  
  const instructionsTile = document.querySelector('.tile:nth-child(7)');
  if (instructionsTile) {
    const tileTitle = instructionsTile.querySelector('h3');
    const tileDesc = instructionsTile.querySelector('p');
    const tileBtn = instructionsTile.querySelector('.tile-btn');
    
    if (tileTitle) tileTitle.textContent = t.instructionsTitle;
    if (tileDesc) tileDesc.textContent = t.instructionsDesc;
    if (tileBtn) tileBtn.textContent = t.instructionsBtn;
  }

  const instructionsModalTitle = document.getElementById('instructionsModalTitle');
  if (instructionsModalTitle) {
    instructionsModalTitle.textContent = t.instructionsModalTitle;
  }
    
  if (closeUserActions) closeUserActions.textContent = t.closeBtn;
  if (closeGroupActions) closeGroupActions.textContent = t.closeBtn;
  if (closeBillboardActions) closeBillboardActions.textContent = t.closeBtn;
  if (closeCompanyActions) closeCompanyActions.textContent = t.closeBtn;
  if (closeImpersonateBtn) closeImpersonateBtn.textContent = t.closeBtn;

  if (actionUsername) actionUsername.textContent = t.userActionsTitle;
  if (changePasswordBtn) changePasswordBtn.textContent = t.changePasswordBtn;
  if (changeRoleBtn) changeRoleBtn.textContent = t.changeRoleBtn;
  if (changeGroupBtn) changeGroupBtn.textContent = t.changeGroupBtn;
  if (deleteUserBtn) deleteUserBtn.textContent = t.deleteUserBtn;
  if (renameUserBtn) renameUserBtn.textContent = t.renameUserBtn;
  if (changeCompanyBtn) changeCompanyBtn.textContent = t.changeCompanyBtn;

  if (actionGroupname) actionGroupname.textContent = t.groupActionsTitle;
  if (renameGroupBtn) renameGroupBtn.textContent = t.renameBtn;
  if (deleteGroupBtn) deleteGroupBtn.textContent = t.deleteGroupBtn;

  if (actionBillboardname) actionBillboardname.textContent = t.billboardActionsTitle;
  if (renameBillboardBtn) renameBillboardBtn.textContent = t.renameBtn;
  if (deleteBillboardBtn) deleteBillboardBtn.textContent = t.deleteBillboardBtn;
  
  if (actionCompanyname) actionCompanyname.textContent = t.companyActionsTitle;
  if (renameCompanyBtn) renameCompanyBtn.textContent = t.renameBtn;
  if (deleteCompanyBtn) deleteCompanyBtn.textContent = t.deleteCompanyBtn;
  
  const changeBillboardGroupBtn = document.getElementById("changeBillboardGroupBtn");
  if (changeBillboardGroupBtn) {
    changeBillboardGroupBtn.textContent = t.changeBillboardGroupBtn;
  }
    
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.textContent = t.logoutBtn;
  }
    
  if (visualizationModal && visualizationModal.style.display === "flex") {
    if (window.renderCalendar) {
      window.renderCalendar();
    }
  }
    
  const impersonatingLabel = document.getElementById('impersonatingLabel');
  const currentlyViewingText = document.getElementById('currentlyViewingText');
  const loggedAsRootText = document.getElementById('loggedAsRootText');
  const returnToRootText = document.getElementById('returnToRootText');
  
  if (impersonatingLabel) impersonatingLabel.textContent = `👁️ ${t.impersonating}`;
  if (currentlyViewingText) currentlyViewingText.textContent = t.currentlyViewing;
  if (loggedAsRootText) loggedAsRootText.textContent = t.loggedAsRoot;
  if (returnToRootText) returnToRootText.textContent = t.returnToRoot;
  
  setCookie("language", lang);
};

// ============================= INITIAL LANGUAGE & THEME ===========================
window.initializeApp = function() {
  const currentLang = getCookie("language") || "pl";
  const currentTheme = getCookie("theme") || "light";

  if (languageSwitcher) languageSwitcher.value = currentLang;
  if (themeSwitcher) themeSwitcher.value = currentTheme;

  updateTheme(currentTheme);
  updateLanguage(currentLang);
  
  if (typeof window.updateGroupsCount === 'function') {
    window.updateGroupsCount();
  }
}

// ============================= CURRENT USER ===========================
window.loadCurrentUser = async function() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Nie zalogowany');
    return await res.json();
  } catch (err) { 
    console.error(err); 
    return null; 
  }
}

// ============================= MODAL UTILITIES ===========================
window.createModal = function(title, contentHtml, buttons) {
  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "1001";

  modal.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <h3>${title}</h3>
      <div id="modalContent">${contentHtml}</div>
      <div class="modal-btn-container" style="margin-top: 20px;">
        ${buttons.map(btn => 
          `<button class="modal-btn ${btn.class}" id="${btn.id}">${btn.text}</button>`
        ).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

window.closeModal = function(modal) {
  if (modal && modal.parentNode) {
    modal.remove();
  }
}

window.showToast = function(message, type = "info") {
  const lang = getCookie("language") || "pl";
  const t = translations[lang];
  
  document.querySelectorAll(".toast").forEach(toast => toast.remove());

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "";
  if (type === "success") icon = "✅ ";
  else if (type === "error") icon = "❌ ";
  else if (type === "info") icon = "ℹ️ ";
  
  let title = "";
  if (type === "success") title = t.success + ": ";
  else if (type === "error") title = t.error + ": ";
  else if (type === "info") title = ": ";
  
  toast.textContent = icon + title + message;
  
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}

// ============================= HELPER FUNCTIONS ===========================
window.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.truncateFilename = function(filename, maxLength) {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.length - extension.length - 1);
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
  
  return `${truncatedName}...${extension}`;
}

window.formatDate = function(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

window.formatDateTimeLocal = function(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

window.getRepeatLabel = function(repeatData, lang = 'pl') {
  if (!repeatData) {
    const t = window.translations[lang];
    return t.repeatOnce || 'Once';
  }
  
  try {
    let daysArray;
    if (typeof repeatData === 'string') {
      daysArray = JSON.parse(repeatData);
    } else {
      daysArray = repeatData;
    }
    
    if (!Array.isArray(daysArray)) {
      daysArray = [1,2,3,4,5,6,7];
    }
    
    const allDays = [1,2,3,4,5,6,7];
    const weekdays = [1,2,3,4,5];
    const weekend = [6,7];
    
    if (daysArray.length === 7 && daysArray.every(day => allDays.includes(day))) {
      const t = window.translations[lang];
      return t.everydayLabel || 'Every day';
    }
    
    if (daysArray.length === 5 && daysArray.every(day => weekdays.includes(day))) {
      const t = window.translations[lang];
      return t.weekdaysLabel || 'Weekdays';
    }
    
    if (daysArray.length === 2 && daysArray.every(day => weekend.includes(day))) {
      const t = window.translations[lang];
      return t.weekendLabel || 'Weekend';
    }
    
    return window.formatRepeatDays(daysArray);
    
  } catch (e) {
    console.error("Błąd parsowania repeat:", e);
    const t = window.translations[lang];
    return t.everydayLabel || 'Every day';
  }
};

window.getStatusLabel = function(status, lang = null) {
  if (!lang) lang = getCookie("language") || "pl";
  const t = translations[lang];
  
  const labels = {
    active: t.statusActive,
    paused: t.statusPaused
  };
  return labels[status] || status;
}

window.calculateDuration = function(startDate, endDate) {
  const diffMs = endDate - startDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts = [];
  if (diffDays > 0) parts.push(`${diffDays} day${diffDays !== 1 ? 's' : ''}`);
  if (diffHours > 0) parts.push(`${diffHours} hour${diffHours !== 1 ? 's' : ''}`);
  if (diffMinutes > 0) parts.push(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(', ') : 'Less than a minute';
}

window.formatDayKey = function(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

window.formatTime = function(date) {
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

window.formatDateForCalendar = function(date) {
  const lang = getCookie("language") || "pl";
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  if (lang === 'pl') {
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } else {
    let formattedHours = parseInt(hours);
    const ampm = formattedHours >= 12 ? 'PM' : 'AM';
    formattedHours = formattedHours % 12;
    formattedHours = formattedHours ? formattedHours : 12;
    
    return `${month}/${day}/${year} ${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
}

window.formatDayKeyToDDMMYYYY = function(dayKey) {
  const parts = dayKey.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dayKey;
}

window.normalizeFilename = function(filename) {
  if (!filename) return Date.now().toString();
  
  const polishMap = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
    'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  
  const extMatch = filename.match(/\.[^/.]+$/);
  const originalExt = extMatch ? extMatch[0].toLowerCase() : '';
  const nameWithoutExt = extMatch ? filename.slice(0, -extMatch[0].length) : filename;
  
  let normalized = nameWithoutExt
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishMap[char] || char)
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

window.getUniqueFilename = function(filesList, filename) {
  const extMatch = filename.match(/\.[^/.]+$/);
  const ext = extMatch ? extMatch[0] : '';
  const nameWithoutExt = extMatch ? filename.slice(0, -extMatch[0].length) : filename;
  
  let counter = 1;
  let uniqueName = filename;
  const fileExists = (name) => {
    return filesList.some(file => file.filename.toLowerCase() === name.toLowerCase());
  };
  
  while (fileExists(uniqueName)) {
    uniqueName = `${nameWithoutExt}_${counter}${ext}`;
    counter++;
  }
  
  return uniqueName;
}

// ============================= CAPSLOCK ===========================
document.addEventListener('keydown', function(e) {
  if (e.getModifierState('CapsLock')) {
    window.globalCapsLockOn = true;
    window.updateAllCapsWarnings();
  }
});

document.addEventListener('keyup', function(e) {
  if (!e.getModifierState('CapsLock')) {
    window.globalCapsLockOn = false;
    window.updateAllCapsWarnings();
  }
});

window.updateAllCapsWarnings = function() {
  document.querySelectorAll('.caps-lock-warning').forEach(warning => {
    const input = warning.previousElementSibling;
    if (input && input.type === 'password' && document.activeElement === input) {
      if (window.globalCapsLockOn) {
        warning.style.visibility = 'visible';
        warning.style.opacity = '1';
      } else {
        warning.style.visibility = 'hidden';
        warning.style.opacity = '0';
      }
    } else {
      warning.style.visibility = 'hidden';
      warning.style.opacity = '0';
    }
  });
}

window.addCapsLockWarningToInput = function(input) {
  if (!input || input.type !== 'password') return;
  
  const lang = getCookie("language") || "pl";
  const t = translations[lang];
  
  if (input.nextElementSibling && input.nextElementSibling.classList.contains('caps-lock-warning')) {
    return;
  }
  
  const capsWarning = document.createElement('div');
  capsWarning.className = 'caps-lock-warning';
  capsWarning.id = 'capsWarning-' + (input.id || Math.random().toString(36).substr(2, 9));
  
  const warningIcon = document.createElement('span');
  warningIcon.textContent = '⚠';
  warningIcon.style.fontSize = '14px';
  
  const warningText = document.createElement('span');
  warningText.textContent = t.capsWarning;
  
  capsWarning.appendChild(warningIcon);
  capsWarning.appendChild(warningText);
  
  input.parentNode.insertBefore(capsWarning, input.nextSibling);
  
  input.addEventListener('focus', function() {
    if (window.globalCapsLockOn) {
      capsWarning.style.visibility = 'visible';
      capsWarning.style.opacity = '1';
    }
    window.updateAllCapsWarnings();
  });
  
  input.addEventListener('keyup', function(e) {
    if (e.getModifierState('CapsLock')) {
      window.globalCapsLockOn = true;
    } else {
      window.globalCapsLockOn = false;
    }
    window.updateAllCapsWarnings();
  });
  
  input.addEventListener('blur', function() {
    capsWarning.style.visibility = 'hidden';
    capsWarning.style.opacity = '0';
  });
}

// ============================= VIDEO PLAYER ===========================
window.openVideoInNewTab = function(videoUrl) {
  const t = translations[getCookie("language") || "pl"];
  const fullUrl = videoUrl.startsWith('http') ? videoUrl : window.location.origin + videoUrl;
  const videoPage = `
    <!DOCTYPE html>
    <html lang="${getCookie("language") || "pl"}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.videoPlayerTitle || "Video Player"}</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: #111;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        video {
          max-width: 90vw;
          max-height: 90vh;
          background: #000;
          border-radius: 12px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        }
        .back-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          background: var(--primary, #2563eb);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          z-index: 1000;
          font-size: 14px;
          transition: transform 0.2s, background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .back-btn:hover {
          background: var(--primary-hover, #1d4ed8);
          transform: translateY(-2px);
        }
        .error-message {
          color: #f87171;
          text-align: center;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <button class="back-btn" onclick="window.close()">← ${t.closeBtn}</button>
      <video controls autoplay playsinline>
        <source src="${fullUrl}" type="video/mp4">
        <div class="error-message">
          ${t.videoBrowserNotSupported}
        </div>
      </video>
    </body>
    </html>
  `;
  
  try {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(videoPage);
      newWindow.document.close();
    } else {
      throw new Error('Nie można otworzyć nowego okna');
    }
  } catch (err) {
    console.error('Błąd otwierania wideo:', err);
    alert(t.videoBrowserNotSupported || 'Nie można otworzyć wideo. Sprawdź czy wyskakujące okna nie są zablokowane.');
  }
}

// ============================= GLOBAL ESCAPE HANDLER ===========================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      if (modal.style.display === 'flex' && !modal.classList.contains('no-escape')) {
        modal.style.display = 'none';
      }
    });
  }
});

// ============================= Przesył plików wspomaganie ===========================
window.clearFileUploadInput = function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const fileInput = modalContent.querySelector('#fileUpload');
  const uploadProgress = modalContent.querySelector('#uploadProgress');
  const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
  
  if (fileInput) fileInput.value = '';
  if (uploadProgress) {
    uploadProgress.style.display = 'none';
    uploadProgress.innerHTML = '';
  }
  if (selectedFileDiv) {
    const lang = window.getCookie("language") || "pl";
    const t = window.translations[lang];
    selectedFileDiv.innerHTML = `
      <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">
        ${t.selectFile} ${t.dragAndDrop || 'lub przeciągnij i upuść tutaj'}
      </div>
    `;
  }
};
// ============================= HARMONOGRAMY I KALENDARZ WSPÓLNE ===========================
window.formatDateTimeLocal = function(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

window.splitDateTime = function(datetimeStr) {
  if (!datetimeStr) return { date: '', time: '' };

  const stripped = String(datetimeStr)
    .replace('Z', '')
    .replace(/\+\d{2}:\d{2}$/, '')
    .replace(/\-\d{2}:\d{2}$/, '')
    .trim();

  const matchT = stripped.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (matchT) return { date: matchT[1], time: matchT[2] };

  const matchSpace = stripped.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
  if (matchSpace) return { date: matchSpace[1], time: matchSpace[2] };

    const matchDate = stripped.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchDate) return { date: matchDate[1], time: '00:00:00' };

  return { date: '', time: '' };
};

window.joinDateTime = function(date, time) {
  if (!date) return '';
  if (!time) time = '00:00:00';
  let parts = time.split(':');
  while (parts.length < 3) parts.push('00');
  const paddedTime = parts.map(p => p.padStart(2, '0')).join(':');
  return `${date}T${paddedTime}`;
};

window.setupModalEvents = function() {
  const modalContent = window.scheduleEditModal ? window.scheduleEditModal.querySelector('.modal') : null;
  if (!modalContent) return;
  
  const fileUpload = modalContent.querySelector('#fileUpload');
  const uploadSection = modalContent.querySelector('#uploadSection');
  
  if (fileUpload) {
    fileUpload.addEventListener('change', window.handleFileUpload);
  }
  
  if (uploadSection) {
    uploadSection.addEventListener('click', () => {
      if (fileUpload) fileUpload.click();
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadSection.addEventListener(eventName, () => {
        uploadSection.style.background = 'var(--primary-light)';
        uploadSection.style.borderColor = 'var(--primary)';
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(eventName, () => {
        uploadSection.style.background = '';
        uploadSection.style.borderColor = 'var(--border)';
      }, false);
    });
    
    uploadSection.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length > 0) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        
        const file = files[0];
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        
        if (file.size > 50 * 1024 * 1024) {
          window.showToast(t.fileTooLarge || 'File is too large. Maximum size: 50MB', 'error');
          return;
        }
        
        fileUpload.files = dataTransfer.files;
        
        const event = new Event('change', { bubbles: true });
        fileUpload.dispatchEvent(event);
      }
    });
  }
  
  const imageGallery = modalContent.querySelector('#imageGallery');
  if (imageGallery) {
    imageGallery.replaceWith(imageGallery.cloneNode(true));
    
    const newImageGallery = modalContent.querySelector('#imageGallery');
    
    if (newImageGallery) {
      newImageGallery.addEventListener('click', (e) => {
        const imageItem = e.target.closest('.image-item');
        if (imageItem) {
          const filename = imageItem.dataset.filename;
          const type = imageItem.dataset.type;
          window.selectImage(filename, type);
        }
      });
    }
  }
  
  const selectFromGalleryBtn = modalContent.querySelector("#selectFromGalleryBtn");
  const uploadNewBtn = modalContent.querySelector("#uploadNewBtn");
  
  if (selectFromGalleryBtn) {
    selectFromGalleryBtn.addEventListener("click", () => {
      const galleryContainer = modalContent.querySelector('#galleryContainer');
      const uploadContainer = modalContent.querySelector('#uploadContainer');
      
      selectFromGalleryBtn.style.backgroundColor = 'var(--primary)';
      if (uploadNewBtn) uploadNewBtn.style.backgroundColor = 'var(--text-secondary)';
      
      if (galleryContainer) {
        galleryContainer.style.display = 'block';
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        
        galleryContainer.innerHTML = `
          <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">
            ${t.galleryTitle || 'Gallery'}
          </div>
          ${window.renderImageGallery()}
        `;
        
        setTimeout(() => {
          window.setupModalEvents();
        }, 50);
      }
      if (uploadContainer) uploadContainer.style.display = 'none';
    });
  }
  
  if (uploadNewBtn) {
    uploadNewBtn.addEventListener("click", () => {
      const galleryContainer = modalContent.querySelector('#galleryContainer');
      const uploadContainer = modalContent.querySelector('#uploadContainer');
      const selectedFileDiv = modalContent.querySelector('#selectedFileInfo');
      
      uploadNewBtn.style.backgroundColor = 'var(--primary)';
      if (selectFromGalleryBtn) selectFromGalleryBtn.style.backgroundColor = 'var(--text-secondary)';
      
      if (galleryContainer) galleryContainer.style.display = 'none';
      if (uploadContainer) uploadContainer.style.display = 'block';
      
      if (selectedFileDiv) {
        const lang = window.getCookie("language") || "pl";
        const t = window.translations[lang];
        selectedFileDiv.innerHTML = `
          <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: 10px;">
            ${t.selectFile} ${t.dragAndDrop || 'lub przeciągnij i upuść tutaj'}
          </div>
        `;
      }
      
      modalContent.querySelectorAll('.image-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      const selectedImageInput = modalContent.querySelector('#selectedImage');
      const selectedImageTypeInput = modalContent.querySelector('#selectedImageType');
      if (selectedImageInput) selectedImageInput.value = '';
      if (selectedImageTypeInput) selectedImageTypeInput.value = '';
    });
  }
};

window.setupScheduleEventListeners = function() {
  const itemsContainer = document.getElementById('schedulesItemsContainer');
  if (!itemsContainer) return;
  
  itemsContainer.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.matches('[data-action="delete"]')) {
      const scheduleIds = target.dataset.ids;
      const scheduleName = target.dataset.name;
      window.deleteScheduleGroup(scheduleIds, scheduleName);
    }
    
    if (target.matches('[data-action="edit"]')) {
      const scheduleIds = target.dataset.ids;
      window.editSchedule(scheduleIds);
    }
  });
  
  itemsContainer.addEventListener('change', (e) => {
    if (e.target.matches('.schedule-select-checkbox')) {
      window.updateBulkActions();
    }
  });
  
  itemsContainer.addEventListener('click', (e) => {
    if (e.target.matches('.schedule-checkbox label')) {
      const checkbox = e.target.previousElementSibling;
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      }
    }
  });
};

window.getSelectedSchedules = function() {
  const selected = [];
  document.querySelectorAll('.schedule-select-checkbox:checked').forEach(checkbox => {
    const ids = checkbox.dataset.ids ? checkbox.dataset.ids.split(',') : [];
    ids.forEach(id => {
      selected.push({
        id: id.trim(),
        name: checkbox.dataset.name
      });
    });
  });
  return selected;
};

window.initBulkActions = function() {
  const bulkActionsContainer = document.getElementById('bulkActionsContainer');
  const bulkSelectAllBtn = document.getElementById('bulkSelectAllBtn');
  const bulkDeselectBtn = document.getElementById('bulkDeselectBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  
  if (!bulkActionsContainer || !bulkSelectAllBtn) return;
  
  bulkSelectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.schedule-select-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
    window.updateBulkActions();
  });
  
  bulkDeselectBtn.addEventListener('click', () => {
    document.querySelectorAll('.schedule-select-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    window.updateBulkActions();
  });
  
  bulkDeleteBtn.addEventListener('click', () => {
    const selectedSchedules = window.getSelectedSchedules();
    if (selectedSchedules.length > 0) {
      window.bulkDeleteSchedules(selectedSchedules);
    }
  });
  
  window.updateBulkActions();
};

window.getSelectedSchedules = function() {
  const selected = [];
  document.querySelectorAll('.schedule-select-checkbox:checked').forEach(checkbox => {
    selected.push({
      id: checkbox.dataset.id,
      name: checkbox.dataset.name
    });
  });
  return selected;
};

window.updateBulkActions = function() {
  const bulkActionsContainer = document.getElementById('bulkActionsContainer');
  const selectedCountEl = document.getElementById('selectedCount');
  const deleteCountEl = document.getElementById('deleteCount');
  
  if (!bulkActionsContainer) return;
  
  const selectedSchedules = window.getSelectedSchedules();
  const selectedCount = selectedSchedules.length;
  
  if (selectedCount > 0) {
    bulkActionsContainer.style.display = 'block';
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (deleteCountEl) deleteCountEl.textContent = selectedCount;
  } else {
    bulkActionsContainer.style.display = 'none';
  }
};

// ============================= INIT ON DOM CONTENT LOADED ===========================
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeApp();
  
  setTimeout(() => {
    console.log('⏰ Sprawdzam dostępność funkcji z innych plików...');
    
      if (typeof window.checkImpersonationStatus === 'function') {
    window.checkImpersonationStatus();
    setInterval(window.checkImpersonationStatus, 30000);
  }
      
    if (typeof window.updateBillboardsCount === 'function') {
      console.log('✅ updateBillboardsCount dostępny, uruchamiam...');
      window.updateBillboardsCount();
      setInterval(window.updateBillboardsCount, 60000);
    } else {
      console.log('❌ updateBillboardsCount NIE dostępny (jeszcze)');
      setTimeout(() => {
        if (typeof window.updateBillboardsCount === 'function') {
          window.updateBillboardsCount();
          setInterval(window.updateBillboardsCount, 60000);
        }
      }, 500);
    }
    
    if (typeof window.addCapsLockWarningToInput === 'function') {
      console.log('✅ addCapsLockWarningToInput dostępny');
      document.querySelectorAll('input[type="password"]').forEach(input => {
        window.addCapsLockWarningToInput(input);
      });
    }
    
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            const passwordInputs = node.querySelectorAll ? node.querySelectorAll('input[type="password"]') : [];
            passwordInputs.forEach(input => {
              setTimeout(() => {
                if (typeof window.addCapsLockWarningToInput === 'function') {
                  window.addCapsLockWarningToInput(input);
                }
              }, 10);
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
  }, 100);
});