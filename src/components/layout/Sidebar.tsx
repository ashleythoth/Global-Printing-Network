import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Package, X, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/shops', label: 'Print Shops', icon: Store, end: false },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
];

const shopLinks = [
  { to: '/shop', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/shop/products', label: 'My Products', icon: Package, end: false },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const links = role === 'admin' ? adminLinks : shopLinks;

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
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-[#2563EB] rounded-lg p-1.5">
              <Printer size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">PrintHub</span>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">PrintHub v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;