import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, ArrowRight, DollarSign, Clock, FileText, Camera, Loader2, Trash2, TrendingUp } from 'lucide-react';
import { fetchShops } from '@/lib/shopsService';
import { fetchOrders, updateOrderStatus, deleteOrder, SupabaseOrder } from '@/lib/ordersService';
import { getSetting } from '@/lib/settingsService';
import { PrintShop } from '@/lib/types';
import { getProducts } from '@/lib/store';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_OPTIONS = ['SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; bg: string }> = ({ label, value, icon, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
    <div className={`${bg} rounded-xl p-3`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  const products = getProducts();

  const STATUS_META = {
    SUBMITTED:   { label: t('dash_status_submitted'),   color: 'text-amber-700',   bg: 'bg-amber-50 border border-amber-200',    dot: 'bg-amber-400' },
    IN_PROGRESS: { label: t('dash_status_in_progress'), color: 'text-blue-700',    bg: 'bg-blue-50 border border-blue-200',      dot: 'bg-blue-500' },
    COMPLETED:   { label: t('dash_status_completed'),   color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', dot: 'bg-emerald-500' },
    CANCELLED:   { label: t('dash_status_cancelled'),   color: 'text-gray-500',    bg: 'bg-gray-100 border border-gray-200',     dot: 'bg-gray-400' },
  } as Record<string, { label: string; color: string; bg: string; dot: string }>;

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const meta = STATUS_META[status] ?? STATUS_META['SUBMITTED'];
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    );
  };

  const loadData = async () => {
    setLoading(true);
    const [shopsData, ordersData, feeSetting] = await Promise.all([
      fetchShops(),
      fetchOrders(),
      getSetting('platform_fee_pct'),
    ]);
    setShops(shopsData);
    setOrders(ordersData);
    if (feeSetting) setPlatformFeePct(parseFloat(feeSetting));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const activeShops = shops.filter(s => s.status === 'active').length;
  const activeProducts = products.filter(p => p.isActive).length;
  const activeOrders = orders.filter(o => o.status === 'SUBMITTED' || o.status === 'IN_PROGRESS');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total_price), 0);
  const platformEarnings = totalRevenue * (platformFeePct / 100);
  const displayedOrders = activeTab === 'active' ? activeOrders : orders;

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('dash_delete_order_confirm'))) return;
    await deleteOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const statusOptionLabel = (s: string) => {
    const map: Record<string, string> = {
      SUBMITTED: t('dash_status_submitted'),
      IN_PROGRESS: t('dash_status_in_progress'),
      COMPLETED: t('dash_status_completed'),
      CANCELLED: t('dash_status_cancelled'),
    };
    return map[s] ?? s;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">{t('dash_title')}</h1>
        <p className="text-gray-500 mt-1">{t('dash_subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('dash_active_shops')}    value={loading ? '…' : activeShops}                         icon={<Store size={20} className="text-[#1E3A5F]" />}       bg="bg-[#1E3A5F]/10" />
        <StatCard label={t('dash_active_products')} value={loading ? '…' : activeProducts}                      icon={<Package size={20} className="text-[#2563EB]" />}     bg="bg-[#2563EB]/10" />
        <StatCard label={t('dash_active_orders')}   value={loading ? '…' : activeOrders.length}                 icon={<Clock size={20} className="text-amber-500" />}       bg="bg-amber-50" />
        <StatCard label={t('dash_gross_revenue')}   value={loading ? '…' : `$${totalRevenue.toFixed(0)}`}       icon={<DollarSign size={20} className="text-emerald-500" />} bg="bg-emerald-50" />
      </div>

      {/* Platform earnings banner */}
      {!loading && (
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2.5">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">{t('dash_platform_earnings')} ({platformFeePct}% fee)</p>
              <p className="text-3xl font-bold">${platformEarnings.toFixed(2)}</p>
              <p className="text-xs text-white/60 mt-0.5">
                {t('dash_platform_earnings_sub')
                  .replace('{count}', String(completedOrders.length))
                  .replace('{gross}', totalRevenue.toFixed(2))}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            {t('dash_adjust_fee')} <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E293B]">{t('dash_print_orders')}</h2>
          <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-xl p-1">
            {(['active', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
                }`}
              >
                {tab === 'active' ? t('dash_active_tab') : t('dash_all_orders_tab')}
                {tab === 'active' && activeOrders.length > 0 && (
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">{t('dash_loading_orders')}</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{t('dash_no_orders')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_shop')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_product')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_details')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_total')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_status')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_date')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('dash_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedOrders.map(order => {
                  const isPhoto = order.product_print_type === 'photo';
                  const details = isPhoto
                    ? [order.size, order.finish, order.total_quantity ? `×${order.total_quantity}` : ''].filter(Boolean).join(' · ')
                    : [order.total_quantity ? `${order.total_quantity} pg` : '', order.copies > 1 ? `×${order.copies}` : '', order.color_mode, order.sides].filter(Boolean).join(' · ');

                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1E293B]">{order.shop_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}>
                            {isPhoto ? <Camera size={13} /> : <FileText size={13} />}
                          </span>
                          <span className="text-xs text-gray-600">{order.product_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{details || '—'}</td>
                      <td className="px-6 py-4 font-semibold text-[#1E293B]">${Number(order.total_price).toFixed(2)}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{statusOptionLabel(s)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">{t('dash_quick_shops')}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('dash_quick_shops_sub').replace('{total}', String(shops.length)).replace('{active}', String(activeShops))}
            </p>
          </div>
          <button onClick={() => navigate('/admin/shops')} className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
            {t('dash_manage')} <ArrowRight size={15} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">{t('dash_quick_products')}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('dash_quick_products_sub').replace('{total}', String(products.length)).replace('{active}', String(activeProducts))}
            </p>
          </div>
          <button onClick={() => navigate('/admin/products')} className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
            {t('dash_manage')} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
