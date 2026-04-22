import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, PowerOff, Power, Trash2, X, Store, Loader2,
  AlertCircle, Eye, EyeOff, DollarSign, Clock, CheckCircle,
  TrendingUp, MapPin, Phone, Mail, ChevronDown, ChevronUp, KeyRound,
} from 'lucide-react';
import { PrintShop } from '@/lib/types';
import { fetchShops, insertShop, patchShop, removeShop, resetShopPassword } from '@/lib/shopsService';
import { fetchOrders, SupabaseOrder } from '@/lib/ordersService';
import { getSetting } from '@/lib/settingsService';
import { useLanguage } from '@/context/LanguageContext';

const SQUARE_RATE = 2.9;
const SQUARE_FIXED = 0.30;

function calcPayout(gross: number, platformPct: number) {
  const squareFee = (gross * SQUARE_RATE) / 100 + SQUARE_FIXED;
  const platformFee = (gross * platformPct) / 100;
  return gross - squareFee - platformFee;
}

interface ShopStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  grossRevenue: number;
  netPayout: number;
}

function computeStats(shopId: string, orders: SupabaseOrder[], platformPct: number): ShopStats {
  const shopOrders = orders.filter(o => o.shop_id === shopId);
  const completed = shopOrders.filter(o => o.status === 'COMPLETED' || o.status === 'completed');
  const active = shopOrders.filter(o =>
    o.status === 'SUBMITTED' || o.status === 'IN_PROGRESS' ||
    o.status === 'pending' || o.status === 'in-progress' || o.status === 'ready'
  );
  const gross = completed.reduce((s, o) => s + Number(o.total_price), 0);
  return {
    totalOrders: shopOrders.length,
    activeOrders: active.length,
    completedOrders: completed.length,
    grossRevenue: gross,
    netPayout: completed.reduce((s, o) => s + calcPayout(Number(o.total_price), platformPct), 0),
  };
}

const emptyForm = { name: '', email: '', phone: '', address: '', password: '' };

const AdminShops: React.FC = () => {
  const { t } = useLanguage();

  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editShop, setEditShop] = useState<PrintShop | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetShop, setResetShop] = useState<PrintShop | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopsData, ordersData, feeSetting] = await Promise.all([
        fetchShops(),
        fetchOrders(),
        getSetting('platform_fee_pct'),
      ]);
      setShops(shopsData);
      setOrders(ordersData);
      if (feeSetting) setPlatformFeePct(parseFloat(feeSetting));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditShop(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (shop: PrintShop) => {
    setEditShop(shop);
    setForm({ name: shop.name, email: shop.email, phone: shop.phone, address: shop.address, password: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openReset = (shop: PrintShop) => {
    setResetShop(shop);
    setResetPassword('');
    setResetError('');
    setResetSuccess(false);
    setShowResetPassword(false);
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetShop) return;
    if (!resetPassword.trim() || resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    setResetSaving(true);
    setResetError('');
    try {
      await resetShopPassword(resetShop.id, resetShop.email, resetPassword);
      setResetSuccess(true);
      setTimeout(() => setResetModalOpen(false), 1500);
    } catch (e: unknown) {
      setResetError(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setResetSaving(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('shops_err_name');
    if (!form.email.trim()) e.email = t('shops_err_email');
    if (!form.phone.trim()) e.phone = t('shops_err_phone');
    if (!form.address.trim()) e.address = t('shops_err_address');
    if (!editShop && !form.password.trim()) e.password = t('shops_err_password');
    if (!editShop && form.password.length > 0 && form.password.length < 8) e.password = t('shops_err_password_length');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      if (editShop) {
        await patchShop(editShop.id, { name: form.name, phone: form.phone, address: form.address });
      } else {
        await insertShop({ name: form.name, email: form.email, phone: form.phone, address: form.address, status: 'active' }, form.password);
      }
      await load();
      setModalOpen(false);
    } catch (e: unknown) {
      setFormErrors({ submit: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (shop: PrintShop) => {
    try {
      await patchShop(shop.id, { status: shop.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch { setError('Failed to update status'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this print shop?')) return;
    try { await removeShop(id); await load(); }
    catch { setError('Failed to delete shop'); }
  };

  // Summary totals across all shops
  const totalGross = orders.filter(o => o.status === 'COMPLETED' || o.status === 'completed')
    .reduce((s, o) => s + Number(o.total_price), 0);
  const totalActive = orders.filter(o =>
    o.status === 'SUBMITTED' || o.status === 'IN_PROGRESS' ||
    o.status === 'pending' || o.status === 'in-progress' || o.status === 'ready'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('shops_title')}</h1>
          <p className="text-gray-500 mt-1">
            {loading ? t('shops_loading') : `${shops.length} shop${shops.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> {t('shops_create_btn')}
        </button>
      </div>

      {/* Platform summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className="bg-[#1E3A5F]/10 rounded-xl p-2.5"><Store size={18} className="text-[#1E3A5F]" /></div>
            <div>
              <p className="text-2xl font-bold text-[#1E293B]">{shops.filter(s => s.status === 'active').length}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('shops_active')}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className="bg-amber-50 rounded-xl p-2.5"><Clock size={18} className="text-amber-500" /></div>
            <div>
              <p className="text-2xl font-bold text-[#1E293B]">{totalActive}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('shops_active_orders')}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className="bg-emerald-50 rounded-xl p-2.5"><DollarSign size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold text-[#1E293B]">${totalGross.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('shops_gross')}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 flex items-center gap-3 shadow-sm">
            <div className="bg-white/20 rounded-xl p-2.5"><TrendingUp size={18} className="text-white" /></div>
            <div>
              <p className="text-2xl font-bold text-white">${(totalGross * platformFeePct / 100).toFixed(0)}</p>
              <p className="text-xs text-white/70 mt-0.5">{t('shops_platform_earnings')} ({platformFeePct}%)</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Shop cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">{t('shops_loading')}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-12 text-center text-gray-400">
              {t('shops_empty')}
            </div>
          )}
          {shops.map(shop => {
            const stats = computeStats(shop.id, orders, platformFeePct);
            const isExpanded = expandedId === shop.id;
            const shopOrders = orders.filter(o => o.shop_id === shop.id);

            return (
              <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${shop.status === 'active' ? 'bg-[#1E3A5F]/10' : 'bg-gray-100'}`}>
                      <Store size={18} className={shop.status === 'active' ? 'text-[#1E3A5F]' : 'text-gray-400'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#1E293B]">{shop.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {shop.status === 'active' ? t('shops_active_badge') : t('prod_inactive')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{shop.email}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{shop.phone}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{shop.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap shrink-0">
                    <div className="text-center px-3 py-2 bg-[#F8FAFC] rounded-xl min-w-[64px]">
                      <p className="text-lg font-bold text-[#1E293B]">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-400">{t('shops_orders')}</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-amber-50 rounded-xl min-w-[64px]">
                      <p className="text-lg font-bold text-amber-600">{stats.activeOrders}</p>
                      <p className="text-xs text-gray-400">{t('shops_active_badge')}</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-emerald-50 rounded-xl min-w-[64px]">
                      <p className="text-lg font-bold text-emerald-600">${stats.grossRevenue.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">{t('shops_gross_badge')}</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-[#1E3A5F]/10 rounded-xl min-w-[64px]">
                      <p className="text-lg font-bold text-[#1E3A5F]">${stats.netPayout.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">{t('shops_payout_badge')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : shop.id)} className="p-2 text-gray-400 hover:text-[#1E293B] hover:bg-gray-100 rounded-lg transition-colors" title="View orders">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => openEdit(shop)} className="p-2 text-gray-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors" title={t('edit')}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => openReset(shop)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title={t('shops_reset_title')}>
                      <KeyRound size={15} />
                    </button>
                    <button
                      onClick={() => toggleStatus(shop)}
                      className={`p-2 rounded-lg transition-colors ${shop.status === 'active' ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-emerald-500 hover:bg-green-50'}`}
                      title={shop.status === 'active' ? t('prod_inactive') : t('prod_active')}
                    >
                      {shop.status === 'active' ? <PowerOff size={15} /> : <Power size={15} />}
                    </button>
                    <button onClick={() => handleDelete(shop.id)} className="p-2 text-gray-400 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors" title={t('delete')}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {shopOrders.length === 0 ? (
                      <p className="px-6 py-6 text-sm text-gray-400 text-center">{t('shops_no_orders')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-gray-100">
                              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_date')}</th>
                              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_product')}</th>
                              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_details')}</th>
                              <th className="text-right px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_gross')}</th>
                              <th className="text-right px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_payout')}</th>
                              <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('shops_col_status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {shopOrders.map(order => {
                              const isPhoto = order.product_print_type === 'photo';
                              const details = isPhoto
                                ? [order.size, order.finish, order.total_quantity ? `×${order.total_quantity}` : ''].filter(Boolean).join(' · ')
                                : [order.total_quantity ? `${order.total_quantity} pg` : '', order.color_mode, order.sides].filter(Boolean).join(' · ');
                              const payout = calcPayout(Number(order.total_price), platformFeePct);
                              const isCompleted = order.status === 'COMPLETED' || order.status === 'completed';
                              const statusMap: Record<string, string> = {
                                SUBMITTED: t('status_submitted'), submitted: t('status_submitted'),
                                IN_PROGRESS: t('status_in_progress'), 'in-progress': t('status_in_progress'),
                                COMPLETED: t('status_completed'), completed: t('status_completed'),
                                CANCELLED: t('status_cancelled'), cancelled: t('status_cancelled'),
                                pending: t('status_submitted'),
                                ready: 'Ready',
                              };
                              const statusLabel = statusMap[order.status] ?? order.status;
                              const statusColor = isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : order.status === 'CANCELLED' || order.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-amber-100 text-amber-700';

                              return (
                                <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                                  <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                                  <td className="px-6 py-3.5 text-xs text-gray-700 font-medium">{order.product_name}</td>
                                  <td className="px-6 py-3.5 text-xs text-gray-500">{details || '—'}</td>
                                  <td className="px-6 py-3.5 text-right font-medium text-[#1E293B]">${Number(order.total_price).toFixed(2)}</td>
                                  <td className="px-6 py-3.5 text-right font-bold text-emerald-600">
                                    {isCompleted ? `$${payout.toFixed(2)}` : <span className="text-gray-400 font-normal">—</span>}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-[#F8FAFC] border-t-2 border-gray-200">
                              <td colSpan={3} className="px-6 py-3 text-sm font-bold text-[#1E293B]">{t('shops_totals')}</td>
                              <td className="px-6 py-3 text-right font-bold text-[#1E293B]">${stats.grossRevenue.toFixed(2)}</td>
                              <td className="px-6 py-3 text-right font-bold text-emerald-600">${stats.netPayout.toFixed(2)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editShop ? t('shops_modal_edit') : t('shops_modal_create')}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" />{formErrors.submit}
                </div>
              )}
              {([
                ['name', t('shops_field_name')],
                ['email', t('shops_field_email')],
                ['phone', t('shops_field_phone')],
                ['address', t('shops_field_address')],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{label}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    disabled={editShop !== null && field === 'email'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {formErrors[field] && <p className="text-xs text-[#F43F5E] mt-1">{formErrors[field]}</p>}
                </div>
              ))}
              {!editShop && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('shops_field_password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={t('shops_password_placeholder')}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-[#F43F5E] mt-1">{formErrors.password}</p>}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                  {t('shops_cancel')}
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {editShop ? t('shops_save') : t('shops_create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && resetShop && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 rounded-xl p-2"><KeyRound size={18} className="text-amber-500" /></div>
                <div>
                  <h2 className="text-lg font-bold text-[#1E293B]">{t('shops_reset_title')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{resetShop.email}</p>
                </div>
              </div>
              <button onClick={() => setResetModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
              {resetError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" />{resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle size={14} className="shrink-0" /> {t('shops_reset_success')}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('shops_reset_new_password')}</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder={t('shops_reset_placeholder')}
                    autoFocus
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowResetPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setResetModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                  {t('shops_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={resetSaving || resetSuccess}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetSaving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                  {resetSaving ? t('shops_reset_saving') : t('shops_reset_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShops;