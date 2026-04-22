import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

const translations = {
  en: {
    // Nav
    nav_dashboard: 'Dashboard',
    nav_print_shops: 'Print Shops',
    nav_products: 'Products',
    nav_payouts: 'Payouts',
    nav_settings: 'Settings',
    nav_my_products: 'My Products',
    nav_earnings: 'Earnings',

    // Login
    login_title: 'PrintHub',
    login_subtitle: 'Print Shop Management Platform',
    login_heading: 'Sign in to your account',
    login_email: 'Email address',
    login_password: 'Password',
    login_submit: 'Sign In',
    login_loading: 'Signing in...',
    login_error: 'Invalid email or password. Please try again.',
    login_demo: 'Demo Credentials',
    login_admin: 'Admin',
    login_shop: 'Shop',
    login_language: 'Language',

    // Payouts page (admin)
    payouts_title: 'Payouts',
    payouts_subtitle: 'Record and track payments sent to print shops',
    payouts_record_btn: 'Record Payout',
    payouts_shop: 'Shop',
    payouts_amount: 'Amount',
    payouts_date: 'Date',
    payouts_note: 'Note',
    payouts_actions: 'Actions',
    payouts_no_records: 'No payouts recorded yet.',
    payouts_total_paid: 'Total Paid Out',
    payouts_pending_balance: 'Pending Balance',
    payouts_shops_paid: 'Shops Paid',
    payouts_all_shops: 'All Shops',
    payouts_modal_title: 'Record Payout',
    payouts_modal_shop: 'Print Shop',
    payouts_modal_amount: 'Amount ($)',
    payouts_modal_date: 'Payment Date',
    payouts_modal_note: 'Note (optional)',
    payouts_modal_note_placeholder: 'e.g. Bank transfer, check #1234...',
    payouts_modal_cancel: 'Cancel',
    payouts_modal_save: 'Record Payout',
    payouts_modal_saving: 'Saving...',
    payouts_available: 'Available to Pay',
    payouts_already_paid: 'Already Paid',
    payouts_delete_confirm: 'Delete this payout record?',
    payouts_filter_all: 'All Time',
    payouts_filter_30: 'Last 30 Days',
    payouts_filter_90: 'Last 90 Days',

    // Earnings page (shop)
    earnings_title: 'Earnings',
    earnings_subtitle: 'Your revenue breakdown after fees',
    earnings_gross: 'Gross Revenue',
    earnings_fees: 'Fees Deducted',
    earnings_payout: 'Your Payout',
    earnings_pending: 'Pending',
    earnings_completed_orders: 'Completed Orders',
    earnings_pending_payout: 'Pending Payout',
    earnings_no_completed: 'No completed orders in this period.',
    earnings_totals: 'Totals',
    earnings_date: 'Date',
    earnings_product: 'Product',
    earnings_details: 'Details',
    earnings_gross_col: 'Gross',
    earnings_square_col: 'Square',
    earnings_platform_col: 'Platform',
    earnings_your_payout: 'Your Payout',
    earnings_export: 'Export',
    earnings_payout_history: 'Payout History',
    earnings_payout_history_sub: 'Payments sent to your account by admin',
    earnings_no_payouts: 'No payouts recorded yet.',
    earnings_paid_on: 'Paid on',
    earnings_total_received: 'Total Received',

    // Common
    all_time: 'All time',
    last_30: 'Last 30 days',
    last_90: 'Last 90 days',
    this_year: 'This year',
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    status_submitted: 'Submitted',
    status_in_progress: 'In Progress',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
  },
  es: {
    // Nav
    nav_dashboard: 'Panel',
    nav_print_shops: 'Imprentas',
    nav_products: 'Productos',
    nav_payouts: 'Pagos',
    nav_settings: 'Configuración',
    nav_my_products: 'Mis Productos',
    nav_earnings: 'Ganancias',

    // Login
    login_title: 'PrintHub',
    login_subtitle: 'Plataforma de Gestión de Imprentas',
    login_heading: 'Inicia sesión en tu cuenta',
    login_email: 'Correo electrónico',
    login_password: 'Contraseña',
    login_submit: 'Iniciar Sesión',
    login_loading: 'Iniciando sesión...',
    login_error: 'Correo o contraseña incorrectos. Inténtalo de nuevo.',
    login_demo: 'Credenciales de Prueba',
    login_admin: 'Admin',
    login_shop: 'Tienda',
    login_language: 'Idioma',

    // Payouts page (admin)
    payouts_title: 'Pagos',
    payouts_subtitle: 'Registra y rastrea los pagos enviados a las imprentas',
    payouts_record_btn: 'Registrar Pago',
    payouts_shop: 'Imprenta',
    payouts_amount: 'Monto',
    payouts_date: 'Fecha',
    payouts_note: 'Nota',
    payouts_actions: 'Acciones',
    payouts_no_records: 'Aún no hay pagos registrados.',
    payouts_total_paid: 'Total Pagado',
    payouts_pending_balance: 'Saldo Pendiente',
    payouts_shops_paid: 'Imprentas Pagadas',
    payouts_all_shops: 'Todas las Imprentas',
    payouts_modal_title: 'Registrar Pago',
    payouts_modal_shop: 'Imprenta',
    payouts_modal_amount: 'Monto ($)',
    payouts_modal_date: 'Fecha de Pago',
    payouts_modal_note: 'Nota (opcional)',
    payouts_modal_note_placeholder: 'ej. Transferencia bancaria, cheque #1234...',
    payouts_modal_cancel: 'Cancelar',
    payouts_modal_save: 'Registrar Pago',
    payouts_modal_saving: 'Guardando...',
    payouts_available: 'Disponible para Pagar',
    payouts_already_paid: 'Ya Pagado',
    payouts_delete_confirm: '¿Eliminar este registro de pago?',
    payouts_filter_all: 'Todo el Tiempo',
    payouts_filter_30: 'Últimos 30 Días',
    payouts_filter_90: 'Últimos 90 Días',

    // Earnings page (shop)
    earnings_title: 'Ganancias',
    earnings_subtitle: 'Desglose de ingresos después de comisiones',
    earnings_gross: 'Ingresos Brutos',
    earnings_fees: 'Comisiones Deducidas',
    earnings_payout: 'Tu Pago',
    earnings_pending: 'Pendiente',
    earnings_completed_orders: 'Órdenes Completadas',
    earnings_pending_payout: 'Pago Pendiente',
    earnings_no_completed: 'No hay órdenes completadas en este período.',
    earnings_totals: 'Totales',
    earnings_date: 'Fecha',
    earnings_product: 'Producto',
    earnings_details: 'Detalles',
    earnings_gross_col: 'Bruto',
    earnings_square_col: 'Square',
    earnings_platform_col: 'Plataforma',
    earnings_your_payout: 'Tu Pago',
    earnings_export: 'Exportar',
    earnings_payout_history: 'Historial de Pagos',
    earnings_payout_history_sub: 'Pagos enviados a tu cuenta por el administrador',
    earnings_no_payouts: 'Aún no hay pagos registrados.',
    earnings_paid_on: 'Pagado el',
    earnings_total_received: 'Total Recibido',

    // Common
    all_time: 'Todo el tiempo',
    last_30: 'Últimos 30 días',
    last_90: 'Últimos 90 días',
    this_year: 'Este año',
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    status_submitted: 'Enviado',
    status_in_progress: 'En Progreso',
    status_completed: 'Completado',
    status_cancelled: 'Cancelado',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = 'printhub_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
