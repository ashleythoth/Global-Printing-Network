import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { getShops, getProducts } from '@/lib/store';

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
    <div className={`${bg} rounded-xl p-3`}>{icon}</div>
    <div>
      <p className="text-3xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState(getShops());
  const [products, setProducts] = useState(getProducts());

  useEffect(() => {
    setShops(getShops());
    setProducts(getProducts());
  }, []);

  const activeShops = shops.filter(s => s.status === 'active').length;
  const activeProducts = products.filter(p => p.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Print Shops"
          value={shops.length}
          icon={<Store size={22} className="text-[#1E3A5F]" />}
          color="text-[#1E3A5F]"
          bg="bg-[#1E3A5F]/10"
        />
        <StatCard
          label="Active Shops"
          value={activeShops}
          icon={<TrendingUp size={22} className="text-[#10B981]" />}
          color="text-[#10B981]"
          bg="bg-[#10B981]/10"
        />
        <StatCard
          label="Total Products"
          value={products.length}
          icon={<Package size={22} className="text-[#2563EB]" />}
          color="text-[#2563EB]"
          bg="bg-[#2563EB]/10"
        />
        <StatCard
          label="Active Products"
          value={activeProducts}
          icon={<CheckCircle size={22} className="text-[#10B981]" />}
          color="text-[#10B981]"
          bg="bg-[#10B981]/10"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Print Shops</h2>
            <Store size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-5">
            Manage print shop accounts, create new shops, and control access.
          </p>
          <button
            onClick={() => navigate('/admin/shops')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Manage Shops <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Products</h2>
            <Package size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-5">
            Define platform-wide products across documents, business cards, and large format.
          </p>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Manage Products <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Recent Shops */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1E293B]">Recent Print Shops</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {shops.slice(0, 5).map(shop => (
            <div key={shop.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1E293B]">{shop.name}</p>
                <p className="text-sm text-gray-500">{shop.email}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                shop.status === 'active'
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {shop.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;