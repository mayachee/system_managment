import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the available languages
export type Language = "en" | "fr" | "es" | "ar";

// Create translation records for each language
const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    "app.name": "Car Rental System",
    "app.loading": "Loading...",
    "app.error": "An error occurred",
    "app.save": "Save",
    "app.cancel": "Cancel",
    "app.delete": "Delete",
    "app.edit": "Edit",
    "app.add": "Add",
    "app.search": "Search",
    "app.filter": "Filter",
    "app.sort": "Sort",
    "app.all": "All",
    "app.view": "View",
    "app.back": "Back",
    "app.next": "Next",
    "app.previous": "Previous",
    "app.submit": "Submit",
    "app.reset": "Reset",
    "app.yes": "Yes",
    "app.no": "No",
    "app.confirm": "Confirm",
    "app.user": "User",
    "app.administrator": "Administrator",
    "app.toggleTheme": "Toggle theme",
    "app.notifications": "Notifications",
    "app.help": "Help",
    "app.lastUpdated": "Last updated",
    "app.currentTime": "Current time",
    "app.auto": "AUTO",
    "app.timeSchedule": "Time-based theme schedule",
    "app.themeLight": "Light",
    "app.themeDark": "Dark",
    "app.suggests": "suggests",
    "app.mode": "mode",
    "app.themeMismatch": "Your theme doesn't match the time suggestion.",
    "app.enableAutoSwitch": "Enable auto switching in Settings",
    "app.autoSwitchEnabled": "Auto switching is enabled. Theme will adjust automatically.",
    "app.wakeUp": "wake up",
    "app.productivity": "productivity",
    "app.transition": "transition",
    "app.windDown": "wind down",
    "app.sleepQuality": "sleep quality",
    
    // Common Elements
    "common.cancel": "Cancel",
    "common.error": "Error",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.cars": "Cars",
    "nav.rentals": "Rentals",
    "nav.locations": "Locations",
    "nav.maintenance": "Maintenance",
    "nav.users": "Users",
    "nav.loyaltyProgram": "Loyalty Program",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.stats": "Statistics",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.popularCars": "Popular Cars",
    
    // Cars
    "cars.title": "Cars",
    "cars.addCar": "Add Car",
    "cars.make": "Make",
    "cars.model": "Model",
    "cars.year": "Year",
    "cars.status": "Status",
    "cars.location": "Location",
    "cars.id": "Car ID",
    "cars.details": "Car Details",
    "cars.available": "Available",
    "cars.rented": "Rented",
    "cars.maintenance": "Maintenance",
    
    // Rentals
    "rentals.title": "Rentals",
    "rentals.createRental": "Create Rental",
    "rentals.active": "Active Rentals",
    "rentals.completed": "Completed Rentals",
    "rentals.cancelled": "Cancelled Rentals",
    "rentals.startDate": "Start Date",
    "rentals.endDate": "End Date",
    "rentals.status": "Status",
    "rentals.user": "User",
    "rentals.car": "Car",
    
    // Settings
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.notifications": "Notifications",
    "settings.appearance": "Appearance",
    "settings.security": "Security",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.themeLight": "Light",
    "settings.themeDark": "Dark",
    "settings.themeSystem": "System",
    "settings.themeAuto": "Auto",
    "settings.dateFormat": "Date Format",
    "settings.timeFormat": "Time Format",
    "settings.timeFormat12h": "12-hour",
    "settings.timeFormat24h": "24-hour",
    "settings.accountInfo": "Account Information",
    "settings.dataManagement": "Data Management",
    "settings.downloadData": "Download My Data",
    "settings.deleteAccount": "Delete My Account",
    "settings.savedSuccess": "Settings saved successfully",
    
    // Languages
    "language.english": "English",
    "language.french": "French",
    "language.spanish": "Spanish",
    "language.arabic": "Arabic",
    
    // Loyalty Program
    "loyalty.title": "Loyalty Program",
    "loyalty.subtitle": "Earn and redeem points for rewards",
    "loyalty.overview": "Program Overview",
    "loyalty.tiers": "Membership Tiers",
    "loyalty.members": "Members",
    "loyalty.transactions": "Transactions",
    "loyalty.noProgram": "No loyalty program is currently active",
    "loyalty.createFirst": "Create your first loyalty program",
    "loyalty.errorLoading": "Error loading loyalty program data",
    
    // Loyalty Program - Program Details
    "loyalty.programDetails": "Program Details",
    "loyalty.membership": "Membership Details",
    "loyalty.membership.currentStatus": "Current Status",
    "loyalty.membership.totalPoints": "Total Points",
    "loyalty.membership.tier": "Current Tier",
    "loyalty.membership.notEnrolled": "Not Enrolled",
    "loyalty.membership.enrolled": "Enrolled",
    "loyalty.membership.enrollNow": "Enroll Now",
    "loyalty.membership.earnedPoints": "Points Earned",
    "loyalty.membership.redeemedPoints": "Points Redeemed",
    "loyalty.membership.earnRate": "Earn Rate",
    "loyalty.membership.pointsPerDollar": "points per dollar spent",
    
    // Loyalty Program - Admin
    "loyalty.admin.programStats": "Program Statistics",
    "loyalty.admin.programStatsDesc": "Overall program performance",
    "loyalty.admin.members": "Members",
    "loyalty.admin.activePoints": "Active Points",
    "loyalty.admin.pointsIssued": "Points Issued",
    "loyalty.admin.pointsRedeemed": "Points Redeemed",
    "loyalty.admin.redemptionRate": "Redemption Rate",
    "loyalty.admin.noStats": "No statistics available",
    "loyalty.admin.membershipByTier": "Membership by Tier",
    "loyalty.admin.membershipByTierDesc": "Distribution of members across tiers",
    "loyalty.admin.membersCount": "members",
    "loyalty.admin.noTierData": "No tier data available",
    "loyalty.admin.programMembers": "Program Members",
    "loyalty.admin.programMembersDesc": "Members enrolled in this loyalty program",
    "loyalty.admin.noMembers": "No members enrolled yet",
    
    // Loyalty Program - Rewards
    "loyalty.rewards.title": "Available Rewards",
    "loyalty.rewards.subtitle": "Redeem your points for these rewards",
    "loyalty.rewards.enrollPrompt": "Enroll in the program to view rewards",
    "loyalty.rewards.points": "points",
    "loyalty.rewards.value": "Value",
    "loyalty.rewards.redeem": "Redeem",
    
    // Loyalty Program - Transactions
    "loyalty.transactions.title": "My Transactions",
    "loyalty.transactions.subtitle": "History of points earned and redeemed",
    "loyalty.transactions.pointsAvailable": "Points Available",
    "loyalty.transactions.noTransactions": "No transactions found",
    
    // Loyalty Program - Tiers
    "loyalty.tiers.yourTier": "Your Tier",
    "loyalty.tiers.pointsRequired": "points required",
    "loyalty.tiers.discountOnRentals": "discount on rentals",
    "loyalty.tiers.benefits": "Benefits",
    "loyalty.tiers.morePointsNeeded": "more points needed",
    
    // Loyalty Program - Create
    "loyalty.createProgram.title": "Create Loyalty Program",
    "loyalty.createProgram.description": "Create a new loyalty program for your customers. This will allow them to earn and redeem points.",
    "loyalty.createProgram.programName": "Program Name",
    "loyalty.createProgram.programNamePlaceholder": "Premium Rewards",
    "loyalty.createProgram.pointsPerDollar": "Points Per Dollar",
    "loyalty.createProgram.pointsPerDollarHelp": "How many points customers earn per dollar spent",
    "loyalty.createProgram.active": "Active",
    "loyalty.createProgram.activeHelp": "Make this program available to customers",
    "loyalty.createProgram.submit": "Create Program",
    
    // Loyalty Program - Redeem Points
    "loyalty.redeemPoints.title": "Redeem Points",
    "loyalty.redeemPoints.description": "Use your loyalty points to get rewards and discounts.",
    "loyalty.redeemPoints.pointsToRedeem": "Points to Redeem",
    "loyalty.redeemPoints.currentBalance": "Current Balance",
    "loyalty.redeemPoints.remainingAfter": "Remaining After Redemption",
    "loyalty.redeemPoints.points": "points",
    "loyalty.redeemPoints.reward": "Reward",
    "loyalty.redeemPoints.customReward": "Custom reward",
    "loyalty.redeemPoints.cannotRedeem": "Cannot Redeem",
    "loyalty.redeemPoints.eligibilityError": "Failed to check redemption eligibility. Please try again.",
    "loyalty.redeemPoints.submit": "Redeem Points",
  },
  
  fr: {
    // General
    "app.name": "Système de Location de Voitures",
    "app.loading": "Chargement...",
    "app.error": "Une erreur est survenue",
    "app.save": "Enregistrer",
    "app.cancel": "Annuler",
    "app.delete": "Supprimer",
    "app.edit": "Modifier",
    "app.add": "Ajouter",
    "app.search": "Rechercher",
    "app.filter": "Filtrer",
    "app.sort": "Trier",
    "app.all": "Tous",
    "app.view": "Voir",
    "app.back": "Retour",
    "app.next": "Suivant",
    "app.previous": "Précédent",
    "app.submit": "Soumettre",
    "app.reset": "Réinitialiser",
    "app.yes": "Oui",
    "app.no": "Non",
    "app.confirm": "Confirmer",
    "app.user": "Utilisateur",
    "app.administrator": "Administrateur",
    "app.toggleTheme": "Changer de thème",
    "app.notifications": "Notifications",
    "app.help": "Aide",
    "app.lastUpdated": "Dernière mise à jour",
    "app.currentTime": "Heure actuelle",
    "app.auto": "AUTO",
    "app.timeSchedule": "Planification des thèmes basée sur l'heure",
    "app.themeLight": "Clair",
    "app.themeDark": "Sombre",
    "app.suggests": "suggère",
    "app.mode": "mode",
    "app.themeMismatch": "Votre thème ne correspond pas à la suggestion basée sur l'heure.",
    "app.enableAutoSwitch": "Activez le changement automatique dans les Paramètres",
    "app.autoSwitchEnabled": "Le changement automatique est activé. Le thème s'ajustera automatiquement.",
    "app.wakeUp": "réveil",
    "app.productivity": "productivité",
    "app.transition": "transition",
    "app.windDown": "détente",
    "app.sleepQuality": "qualité du sommeil",
    
    // Common Elements
    "common.cancel": "Annuler",
    "common.error": "Erreur",
    "common.refresh": "Rafraîchir",
    
    // Loyalty Program
    "loyalty.title": "Programme de Fidélité",
    "loyalty.subtitle": "Gérer et participer aux programmes de fidélité",
    "loyalty.errorLoading": "Une erreur est survenue lors du chargement des données du programme de fidélité. Veuillez rafraîchir.",
    "loyalty.newProgram": "Nouveau Programme",
    
    // Navigation
    "nav.dashboard": "Tableau de Bord",
    "nav.cars": "Voitures",
    "nav.rentals": "Locations",
    "nav.locations": "Emplacements",
    "nav.maintenance": "Maintenance",
    "nav.users": "Utilisateurs",
    "nav.loyaltyProgram": "Programme de Fidélité",
    "nav.settings": "Paramètres",
    "nav.logout": "Déconnexion",
    
    // Dashboard
    "dashboard.title": "Tableau de Bord",
    "dashboard.welcome": "Bienvenue",
    "dashboard.stats": "Statistiques",
    "dashboard.recentActivity": "Activité Récente",
    "dashboard.popularCars": "Voitures Populaires",
    
    // Cars
    "cars.title": "Voitures",
    "cars.addCar": "Ajouter une Voiture",
    "cars.make": "Marque",
    "cars.model": "Modèle",
    "cars.year": "Année",
    "cars.status": "Statut",
    "cars.location": "Emplacement",
    "cars.id": "ID de Voiture",
    "cars.details": "Détails de la Voiture",
    "cars.available": "Disponible",
    "cars.rented": "Louée",
    "cars.maintenance": "En Maintenance",
    
    // Rentals
    "rentals.title": "Locations",
    "rentals.createRental": "Créer une Location",
    "rentals.active": "Locations Actives",
    "rentals.completed": "Locations Terminées",
    "rentals.cancelled": "Locations Annulées",
    "rentals.startDate": "Date de Début",
    "rentals.endDate": "Date de Fin",
    "rentals.status": "Statut",
    "rentals.user": "Utilisateur",
    "rentals.car": "Voiture",
    
    // Settings
    "settings.title": "Paramètres",
    "settings.general": "Général",
    "settings.notifications": "Notifications",
    "settings.appearance": "Apparence",
    "settings.security": "Sécurité",
    "settings.language": "Langue",
    "settings.theme": "Thème",
    "settings.themeLight": "Clair",
    "settings.themeDark": "Sombre",
    "settings.themeSystem": "Système",
    "settings.themeAuto": "Auto",
    "settings.dateFormat": "Format de Date",
    "settings.timeFormat": "Format d'Heure",
    "settings.timeFormat12h": "12 heures",
    "settings.timeFormat24h": "24 heures",
    "settings.accountInfo": "Informations du Compte",
    "settings.dataManagement": "Gestion des Données",
    "settings.downloadData": "Télécharger Mes Données",
    "settings.deleteAccount": "Supprimer Mon Compte",
    "settings.savedSuccess": "Paramètres enregistrés avec succès",
    
    // Languages
    "language.english": "Anglais",
    "language.french": "Français",
    "language.spanish": "Espagnol",
    "language.arabic": "Arabe",
  },
  
  es: {
    // General
    "app.name": "Sistema de Alquiler de Coches",
    "app.loading": "Cargando...",
    "app.error": "Ha ocurrido un error",
    "app.save": "Guardar",
    "app.cancel": "Cancelar",
    "app.delete": "Eliminar",
    "app.edit": "Editar",
    "app.add": "Añadir",
    "app.search": "Buscar",
    "app.filter": "Filtrar",
    "app.sort": "Ordenar",
    "app.all": "Todo",
    "app.view": "Ver",
    "app.back": "Atrás",
    "app.next": "Siguiente",
    "app.previous": "Anterior",
    "app.submit": "Enviar",
    "app.reset": "Reiniciar",
    "app.yes": "Sí",
    "app.no": "No",
    "app.confirm": "Confirmar",
    "app.user": "Usuario",
    "app.administrator": "Administrador",
    "app.toggleTheme": "Cambiar tema",
    "app.notifications": "Notificaciones",
    "app.help": "Ayuda",
    "app.lastUpdated": "Última actualización",
    "app.currentTime": "Hora actual",
    "app.auto": "AUTO",
    "app.timeSchedule": "Programación de tema basada en horario",
    "app.themeLight": "Claro",
    "app.themeDark": "Oscuro",
    "app.suggests": "sugiere",
    "app.mode": "modo",
    "app.themeMismatch": "Tu tema no coincide con la sugerencia horaria.",
    "app.enableAutoSwitch": "Activa el cambio automático en Ajustes",
    "app.autoSwitchEnabled": "El cambio automático está activado. El tema se ajustará automáticamente.",
    "app.wakeUp": "despertar",
    "app.productivity": "productividad",
    "app.transition": "transición",
    "app.windDown": "relajación",
    "app.sleepQuality": "calidad del sueño",
    
    // Common Elements
    "common.cancel": "Cancelar",
    "common.error": "Error",
    "common.refresh": "Actualizar",
    
    // Loyalty Program
    "loyalty.title": "Programa de Fidelidad",
    "loyalty.subtitle": "Gestionar y participar en programas de fidelidad",
    "loyalty.errorLoading": "Hubo un error al cargar los datos del programa de fidelidad. Por favor, intente actualizar.",
    "loyalty.newProgram": "Nuevo Programa",
    
    // Navigation
    "nav.dashboard": "Panel de Control",
    "nav.cars": "Coches",
    "nav.rentals": "Alquileres",
    "nav.locations": "Ubicaciones",
    "nav.maintenance": "Mantenimiento",
    "nav.users": "Usuarios",
    "nav.loyaltyProgram": "Programa de Fidelidad",
    "nav.settings": "Ajustes",
    "nav.logout": "Cerrar Sesión",
    
    // Dashboard
    "dashboard.title": "Panel de Control",
    "dashboard.welcome": "Bienvenido de nuevo",
    "dashboard.stats": "Estadísticas",
    "dashboard.recentActivity": "Actividad Reciente",
    "dashboard.popularCars": "Coches Populares",
    
    // Cars
    "cars.title": "Coches",
    "cars.addCar": "Añadir Coche",
    "cars.make": "Marca",
    "cars.model": "Modelo",
    "cars.year": "Año",
    "cars.status": "Estado",
    "cars.location": "Ubicación",
    "cars.id": "ID del Coche",
    "cars.details": "Detalles del Coche",
    "cars.available": "Disponible",
    "cars.rented": "Alquilado",
    "cars.maintenance": "En Mantenimiento",
    
    // Rentals
    "rentals.title": "Alquileres",
    "rentals.createRental": "Crear Alquiler",
    "rentals.active": "Alquileres Activos",
    "rentals.completed": "Alquileres Completados",
    "rentals.cancelled": "Alquileres Cancelados",
    "rentals.startDate": "Fecha de Inicio",
    "rentals.endDate": "Fecha de Fin",
    "rentals.status": "Estado",
    "rentals.user": "Usuario",
    "rentals.car": "Coche",
    
    // Settings
    "settings.title": "Ajustes",
    "settings.general": "General",
    "settings.notifications": "Notificaciones",
    "settings.appearance": "Apariencia",
    "settings.security": "Seguridad",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.themeLight": "Claro",
    "settings.themeDark": "Oscuro",
    "settings.themeSystem": "Sistema",
    "settings.themeAuto": "Auto",
    "settings.dateFormat": "Formato de Fecha",
    "settings.timeFormat": "Formato de Hora",
    "settings.timeFormat12h": "12 horas",
    "settings.timeFormat24h": "24 horas",
    "settings.accountInfo": "Información de la Cuenta",
    "settings.dataManagement": "Gestión de Datos",
    "settings.downloadData": "Descargar Mis Datos",
    "settings.deleteAccount": "Eliminar Mi Cuenta",
    "settings.savedSuccess": "Ajustes guardados correctamente",
    
    // Languages
    "language.english": "Inglés",
    "language.french": "Francés",
    "language.spanish": "Español",
    "language.arabic": "Árabe",
  },
  
  ar: {
    // General
    "app.name": "نظام تأجير السيارات",
    "app.loading": "جاري التحميل...",
    "app.error": "حدث خطأ",
    "app.save": "حفظ",
    "app.cancel": "إلغاء",
    "app.delete": "حذف",
    "app.edit": "تعديل",
    "app.add": "إضافة",
    "app.search": "بحث",
    "app.filter": "تصفية",
    "app.sort": "ترتيب",
    "app.all": "الكل",
    "app.view": "عرض",
    "app.back": "رجوع",
    "app.next": "التالي",
    "app.previous": "السابق",
    "app.submit": "إرسال",
    "app.reset": "إعادة ضبط",
    "app.yes": "نعم",
    "app.no": "لا",
    "app.confirm": "تأكيد",
    "app.user": "مستخدم",
    "app.administrator": "مدير النظام",
    "app.toggleTheme": "تبديل المظهر",
    "app.notifications": "الإشعارات",
    "app.help": "مساعدة",
    "app.lastUpdated": "آخر تحديث",
    "app.currentTime": "الوقت الحالي",
    "app.auto": "تلقائي",
    "app.timeSchedule": "جدول المظهر المستند إلى الوقت",
    "app.themeLight": "فاتح",
    "app.themeDark": "داكن",
    "app.suggests": "يقترح",
    "app.mode": "وضع",
    "app.themeMismatch": "المظهر الخاص بك لا يتطابق مع اقتراح الوقت.",
    "app.enableAutoSwitch": "تمكين التبديل التلقائي في الإعدادات",
    "app.autoSwitchEnabled": "تم تمكين التبديل التلقائي. سيتم ضبط المظهر تلقائيًا.",
    "app.wakeUp": "الاستيقاظ",
    "app.productivity": "الإنتاجية",
    "app.transition": "الانتقال",
    "app.windDown": "الاسترخاء",
    "app.sleepQuality": "جودة النوم",
    
    // Common Elements
    "common.cancel": "إلغاء",
    "common.error": "خطأ",
    "common.refresh": "تحديث",
    
    // Loyalty Program
    "loyalty.title": "برنامج الولاء",
    "loyalty.subtitle": "إدارة والمشاركة في برامج الولاء",
    "loyalty.errorLoading": "حدث خطأ أثناء تحميل بيانات برنامج الولاء. يرجى المحاولة مرة أخرى.",
    "loyalty.newProgram": "برنامج جديد",
    
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.cars": "السيارات",
    "nav.rentals": "التأجير",
    "nav.locations": "المواقع",
    "nav.maintenance": "الصيانة",
    "nav.users": "المستخدمين",
    "nav.loyaltyProgram": "برنامج الولاء",
    "nav.settings": "الإعدادات",
    "nav.logout": "تسجيل الخروج",
    
    // Dashboard
    "dashboard.title": "لوحة التحكم",
    "dashboard.welcome": "مرحبًا بعودتك",
    "dashboard.stats": "الإحصائيات",
    "dashboard.recentActivity": "النشاط الأخير",
    "dashboard.popularCars": "السيارات الشائعة",
    
    // Cars
    "cars.title": "السيارات",
    "cars.addCar": "إضافة سيارة",
    "cars.make": "الشركة المصنعة",
    "cars.model": "الطراز",
    "cars.year": "السنة",
    "cars.status": "الحالة",
    "cars.location": "الموقع",
    "cars.id": "معرف السيارة",
    "cars.details": "تفاصيل السيارة",
    "cars.available": "متاحة",
    "cars.rented": "مؤجرة",
    "cars.maintenance": "قيد الصيانة",
    
    // Rentals
    "rentals.title": "التأجير",
    "rentals.createRental": "إنشاء تأجير",
    "rentals.active": "التأجير النشط",
    "rentals.completed": "التأجير المكتمل",
    "rentals.cancelled": "التأجير الملغي",
    "rentals.startDate": "تاريخ البدء",
    "rentals.endDate": "تاريخ الانتهاء",
    "rentals.status": "الحالة",
    "rentals.user": "المستخدم",
    "rentals.car": "السيارة",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.general": "عام",
    "settings.notifications": "الإشعارات",
    "settings.appearance": "المظهر",
    "settings.security": "الأمان",
    "settings.language": "اللغة",
    "settings.theme": "السمة",
    "settings.themeLight": "فاتحة",
    "settings.themeDark": "داكنة",
    "settings.themeSystem": "النظام",
    "settings.themeAuto": "تلقائي",
    "settings.dateFormat": "تنسيق التاريخ",
    "settings.timeFormat": "تنسيق الوقت",
    "settings.timeFormat12h": "12 ساعة",
    "settings.timeFormat24h": "24 ساعة",
    "settings.accountInfo": "معلومات الحساب",
    "settings.dataManagement": "إدارة البيانات",
    "settings.downloadData": "تنزيل بياناتي",
    "settings.deleteAccount": "حذف حسابي",
    "settings.savedSuccess": "تم حفظ الإعدادات بنجاح",
    
    // Languages
    "language.english": "الإنجليزية",
    "language.french": "الفرنسية",
    "language.spanish": "الإسبانية",
    "language.arabic": "العربية",
  }
};

// Define the context type
type LocalizationContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  dir: () => "ltr" | "rtl"; // Direction based on language
  availableLanguages: { value: Language; label: string }[];
};

// Create the context
const LocalizationContext = createContext<LocalizationContextType | null>(null);

// Function to safely get items from localStorage
const getLocalStorageItem = (key: string, defaultValue: string): string => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.warn("Error accessing localStorage:", error);
    return defaultValue;
  }
};

// Function to safely set items in localStorage
const setLocalStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Error writing to localStorage:", error);
  }
};

// Provider component
export function LocalizationProvider({
  children,
  defaultLanguage = "en",
}: {
  children: ReactNode;
  defaultLanguage?: Language;
}) {
  // Get the stored language or use the default
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLanguage = getLocalStorageItem("app-language", defaultLanguage);
    return storedLanguage as Language;
  });

  // Update the language in localStorage when it changes
  useEffect(() => {
    setLocalStorageItem("app-language", language);
    // Update html dir attribute for RTL support
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  // Available languages list
  const availableLanguages = [
    { value: "en" as Language, label: "English" },
    { value: "fr" as Language, label: "Français" },
    { value: "es" as Language, label: "Español" },
    { value: "ar" as Language, label: "العربية" },
  ];

  // Set language function
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    // Get the translation for the current language
    const translation = translations[language]?.[key] || key;
    
    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => 
          acc.replace(new RegExp(`{{${paramKey}}}`, "g"), paramValue),
        translation
      );
    }
    
    return translation;
  };

  // Direction function
  const dir = (): "ltr" | "rtl" => {
    return language === "ar" ? "rtl" : "ltr";
  };

  // Create the context value
  const value = {
    language,
    setLanguage,
    t,
    dir,
    availableLanguages,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

// Custom hook to use localization
export function useLocalization() {
  const context = useContext(LocalizationContext);
  
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  
  return context;
}