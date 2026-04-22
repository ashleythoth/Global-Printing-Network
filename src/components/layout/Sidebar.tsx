import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Package, X, Printer, Settings, TrendingUp, Wallet, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, Language } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const adminLinks = [
    { to: '/admin', label: t('nav_dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/shops', label: t('nav_print_shops'), icon: Store, end: false },
    { to: '/admin/products', label: t('nav_products'), icon: Package, end: false },
    { to: '/admin/payouts', label: t('nav_payouts'), icon: Wallet, end: false },
    { to: '/admin/settings', label: t('nav_settings'), icon: Settings, end: false },
  ];

  const shopLinks = [
    { to: '/shop', label: t('nav_dashboard'), icon: LayoutDashboard, end: true },
    { to: '/shop/products', label: t('nav_my_products'), icon: Package, end: false },
    { to: '/shop/earnings', label: t('nav_earnings'), icon: TrendingUp, end: false },
  ];

  const links = role === 'admin' ? adminLinks : shopLinks;

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-[#1E3A5F] text-white z-30 flex flex-col transition-transform duration-300',
          'md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 border-b border-white/10" style={{ paddingTop: `calc(1.25rem + env(safe-area-inset-top))`, paddingBottom: '1.25rem' }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="GPN Logo" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-sm font-bold tracking-tight leading-tight">Global Printing<br/>Network</span>
          </div>
          <button onClick={onClose} className="md:hidden text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Language switcher */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={13} className="text-white/40" />
            <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{t('login_language')}</span>
          </div>
          <div className="flex gap-1.5">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center',
                  language === lang.code
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">Global Printing Network v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
