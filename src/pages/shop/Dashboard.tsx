import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CheckCircle, ArrowRight, Plus, Clock, Briefcase, Download, TrendingUp, Loader2, FileText, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getShopProductsByShopId } from '@/lib/store';
import { fetchShops } from '@/lib/shopsService';
import { fetchOrdersByShopId, updateOrderStatus, deleteOrder, SupabaseOrder } from '@/lib/ordersService';

const STATUS_OPTIONS = ['pending', 'ready', 'completed', 'cancelled'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',     color: 'bg-amber-100 text-amber-700' },
  ready:     { label: 'Ready',       color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500' },
  SUBMITTED:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'Ready',     color: 'bg-blue-100 text-blue-700' },
  COMPLETED:   { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:   { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

function isActive(status: string) {
  return ['pending', 'ready', 'SUBMITTED', 'IN_PROGRESS'].includes(status);
}

function isCompleted(status: string) {
  return status === 'completed' || status === 'COMPLETED';
}

function orderDetails(order: SupabaseOrder): string {
  const isPhoto = order.product_print_type === 'photo';
  if (isPhoto) {
    return [order.size, order.finish, order.total_quantity ? `×${order.total_quantity}` : ''].filter(Boolean).join(' · ');
  }
  return [
    order.total_quantity ? `${order.total_quantity} pg` : '',
    order.copies > 1 ? `×${order.copies}` : '',
    order.color_mode,
    order.sides,
  ].filter(Boolean).join(' · ');
}

const ShopDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [supabaseShopId, setSupabaseShopId] = useState<string | null>(null);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  // localStorage-based products (for the product catalog quick link)
  const shopProducts = supabaseShopId ? getShopProductsByShopId(supabaseShopId) : [];
  const enabledCount = shopProducts.filter(sp => sp.isEnabled).length;
  const configuredCount = shopProducts.filter(sp => sp.isEnabled && sp.pricingTiers.length > 0).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const shops = await fetchShops();
      const matched = shops.find(s => s.email === currentUser?.email)
        ?? shops.find(s => s.id === currentUser?.shopId);
      if (!matched) { setLoading(false); return; }
      setShopName(matched.name);
      setSupabaseShopId(matched.id);
      const ordersData = await fetchOrdersByShopId(matched.id);
      setOrders(ordersData);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const activeOrders = orders.filter(o => isActive(o.status));
  const completedOrders = orders.filter(o => isCompleted(o.status));
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total_price), 0);
  const displayedOrders = activeTab === 'active' ? activeOrders : orders;

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('shop_dash_delete_job_confirm'))) return;
    await deleteOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleExport = () => {
    const rows = [
      ['Date', 'Product', 'Details', 'Total', 'Status'],
      ...displayedOrders.map(o => [
        new Date(o.created_at).toLocaleDateString(),
        o.product_name,
        orderDetails(o),
        `$${Number(o.total_price).toFixed(2)}`,
        o.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            {shopName || currentUser?.email || t('nav_dashboard')}
          </h1>
          <p className="text-gray-500 mt-1">{t('shop_dash_subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-amber-50 rounded-xl p-2.5"><Clock size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{loading ? '…' : activeOrders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_active_jobs')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-emerald-50 rounded-xl p-2.5"><DollarSign size={20} className="text-emerald-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{loading ? '…' : `$${totalRevenue.toFixed(0)}`}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_revenue')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-[#2563EB]/10 rounded-xl p-2.5"><Briefcase size={20} className="text-[#2563EB]" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{loading ? '…' : orders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_total_jobs')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-[#10B981]/10 rounded-xl p-2.5"><CheckCircle size={20} className="text-[#10B981]" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{loading ? '…' : completedOrders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('status_completed')}</p>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'active' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              {t('shop_dash_tab_active')}
              {activeOrders.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {activeOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              {t('shop_dash_tab_all')}
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={displayedOrders.length === 0}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1E293B] border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} /> {t('shop_dash_export_csv')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">{t('loading')}</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{t('jobs_no_jobs')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_product')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_details')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_files')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_total')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_status')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_date')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedOrders.map(order => {
                  const isPhoto = order.product_print_type === 'photo';
                  const meta = STATUS_LABELS[order.status] ?? STATUS_LABELS['pending'];
                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}>
                            {isPhoto ? <Camera size={13} /> : <FileText size={13} />}
                          </span>
                          <span className="text-xs font-medium text-gray-700">{order.product_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{orderDetails(order) || '—'}</td>
                      <td className="px-6 py-4">
                        {order.file_paths?.length > 0 ? (
                          <span className="text-xs text-[#2563EB] font-medium">{order.file_paths.length} file{order.file_paths.length !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1E293B]">${Number(order.total_price).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
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

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">{t('shop_dash_product_catalog')}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('shop_dash_catalog_sub')
                .replace('{enabled}', String(enabledCount))
                .replace('{configured}', String(configuredCount))}
            </p>
          </div>
          <button
            onClick={() => navigate('/shop/products')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            {t('shop_dash_manage')} <ArrowRight size={15} />
          </button>
        </div>
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2.5">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{t('shop_dash_earnings')}</p>
              <p className="text-sm text-white/70 mt-0.5">
                {t('shop_dash_earnings_sub').replace('{revenue}', totalRevenue.toFixed(2))}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/shop/earnings')}
            className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
          >
            {t('shop_dash_view')} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
