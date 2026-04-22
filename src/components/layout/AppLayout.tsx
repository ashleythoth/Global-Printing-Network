import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import Sidebar from './Sidebar';
import { getShopById } from '@/lib/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const shopName = currentUser?.shopId ? getShopById(currentUser.shopId)?.name : null;
  const displayName = role === 'admin' ? t('layout_administrator') : (shopName ?? currentUser?.email ?? '');

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#1E293B]">{displayName}</p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                role === 'admin'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-[#2563EB]/10 text-[#2563EB]'
              }`}
            >
              {role === 'admin' ? t('login_admin') : t('layout_print_shop')}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#F43F5E] transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('layout_logout')}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;