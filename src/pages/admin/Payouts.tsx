import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Plus, Trash2, X, AlertCircle, Loader2,
  Store, DollarSign, CheckCircle, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fetchPayouts, insertPayout, deletePayout, Payout } from '@/lib/payoutsService';
import { fetchShops } from '@/lib/shopsService';
import { fetchOrders, SupabaseOrder } from '@/lib/ordersService';
import { getSetting } from '@/lib/settingsService';
import { PrintShop } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

const SQUARE_RATE = 2.9;
const SQUARE_FIXED = 0.30;

function calcNetPayout(gross: number, platformPct: number) {
  const squareFee = (gross * SQUARE_RATE) / 100 + SQUARE_FIXED;
  const platformFee = (gross * platformPct) / 100;
  return gross - squareFee - platformFee;
}

const AdminPayouts: React.FC = () => {
  const { t } = useLanguage();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterShop, setFilterShop] = useState('');
  const [filterDays, setFilterDays] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shop_id: '', amount: '', note: '', paid_at: new Date().toISOString().slice(0, 10) });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Expanded shop detail
  const [expandedShop, setExpandedShop] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payoutsData, shopsData, ordersData, feeSetting] = await Promise.all([
        fetchPayouts(),
        fetchShops(),
        fetchOrders(),
        getSetting('platform_fee_pct'),
      ]);
      setPayouts(payoutsData);
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

  // Per-shop earnings
  function shopEarnings(shopId: string) {
    const shopOrders = orders.filter(o => o.shop_id === shopId && (o.status === 'COMPLETED' || o.status === 'completed'));
    const gross = shopOrders.reduce((s, o) => s + Number(o.total_price), 0);
    const net = shopOrders.reduce((s, o) => s + calcNetPayout(Number(o.total_price), platformFeePct), 0);
    const paid = payouts.filter(p => p.shop_id === shopId).reduce((s, p) => s + Number(p.amount), 0);
    return { gross, net, paid, balance: net - paid };
  }

  // Filtered payouts
  const filteredPayouts = payouts.filter(p => {
    if (filterShop && p.shop_id !== filterShop) return false;
    if (filterDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filterDays);
      if (new Date(p.paid_at) < cutoff) return false;
    }
    return true;
  });

  const totalPaid = filteredPayouts.reduce((s, p) => s + Number(p.amount), 0);
  const totalBalance = shops.reduce((s, sh) => s + shopEarnings(sh.id).balance, 0);
  const shopsPaidCount = new Set(payouts.map(p => p.shop_id)).size;

  const openModal = () => {
    setForm({ shop_id: shops[0]?.id ?? '', amount: '', note: '', paid_at: new Date().toISOString().slice(0, 10) });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.shop_id) e.shop_id = 'Select a shop';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.paid_at) e.paid_at = 'Select a date';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      await insertPayout({
        shop_id: form.shop_id,
        amount: Number(form.amount),
        note: form.note,
        paid_at: new Date(form.paid_at).toISOString(),
        created_by: 'admin',
      });
      await load();
      setModalOpen(false);
    } catch (e: unknown) {
      setFormErrors({ submit: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('payouts_delete_confirm'))) return;
    try { await deletePayout(id); await load(); }
    catch { setError('Failed to delete payout'); }
  };

  const filterOptions = [
    { label: t('payouts_filter_all'), days: 0 },
    { label: t('payouts_filter_30'), days: 30 },
    { label: t('payouts_filter_90'), days: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('payouts_title')}</h1>
          <p className="text-gray-500 mt-1">{t('payouts_subtitle')}</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> {t('payouts_record_btn')}
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 rounded-lg p-2"><DollarSign size={16} className="text-white" /></div>
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{t('payouts_total_paid')}</span>
            </div>
            <p className="text-2xl font-bold text-white">${payouts.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}</p>
            <p className="text-xs text-white/60 mt-1">{payouts.length} records</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-50 rounded-lg p-2"><Clock size={16} className="text-amber-500" /></div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_pending_balance')}</span>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">${Math.max(0, totalBalance).toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">across all shops</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-50 rounded-lg p-2"><Store size={16} className="text-emerald-500" /></div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_shops_paid')}</span>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">{shopsPaidCount}</p>
            <p className="text-xs text-gray-400 mt-1">of {shops.length} shops</p>
          </div>
        </div>
      )}

      {/* Per-shop balance overview */}
      {!loading && shops.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1E293B]">Shop Balances</h2>
            <p className="text-xs text-gray-500 mt-0.5">Net earned vs. total paid out</p>
          </div>
          <div className="divide-y divide-gray-50">
            {shops.map(shop => {
              const { net, paid, balance } = shopEarnings(shop.id);
              const isExpanded = expandedShop === shop.id;
              const shopPayouts = payouts.filter(p => p.shop_id === shop.id);
              return (
                <div key={shop.id}>
                  <div
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                    onClick={() => setExpandedShop(isExpanded ? null : shop.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                        <Store size={16} className="text-[#1E3A5F]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E293B] text-sm">{shop.name}</p>
                        <p className="text-xs text-gray-400">{shop.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap shrink-0">
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-bold text-[#1E293B]">${net.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{t('payouts_available')}</p>
                      </div>
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-bold text-emerald-600">${paid.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{t('payouts_already_paid')}</p>
                      </div>
                      <div className={`text-center min-w-[80px] px-3 py-1.5 rounded-xl ${balance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                        <p className={`text-sm font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${Math.max(0, balance).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">Balance</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, shop_id: shop.id, amount: Math.max(0, balance).toFixed(2) })); setFormErrors({}); setModalOpen(true); }}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Pay
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#F8FAFC]">
                      {shopPayouts.length === 0 ? (
                        <p className="px-8 py-5 text-sm text-gray-400">{t('payouts_no_records')}</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left px-8 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_date')}</th>
                              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_amount')}</th>
                              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_note')}</th>
                              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payouts_actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {shopPayouts.map(p => (
                              <tr key={p.id} className="hover:bg-white transition-colors">
                                <td className="px-8 py-3 text-xs text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-right font-bold text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                                <td className="px-6 py-3 text-xs text-gray-500">{p.note || '—'}</td>
                                <td className="px-6 py-3 text-right">
                                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* All payouts table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-[#1E293B]">All Payout Records</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Shop filter */}
            <select
              value={filterShop}
              onChange={e => setFilterShop(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">{t('payouts_all_shops')}</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {/* Period filter */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-gray-200 rounded-xl p-1">
              {filterOptions.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setFilterDays(opt.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    filterDays === opt.days ? 'bg-[#1E3A5F] text-white shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">{t('loading')}</span>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{t('payouts_no_records')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_shop')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_amount')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_date')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_note')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                          <Store size={13} className="text-[#1E3A5F]" />
                        </div>
                        <span className="font-medium text-[#1E293B] text-sm">{p.shop_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{p.note || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-gray-200">
                  <td className="px-6 py-4 text-sm font-bold text-[#1E293B]">Total</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">${totalPaid.toFixed(2)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-[#2563EB]/10 rounded-xl p-2">
                  <Wallet size={18} className="text-[#2563EB]" />
                </div>
                <h2 className="text-lg font-bold text-[#1E293B]">{t('payouts_modal_title')}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" />{formErrors.submit}
                </div>
              )}

              {/* Shop selector with balance preview */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('payouts_modal_shop')}</label>
                <select
                  value={form.shop_id}
                  onChange={e => {
                    const sid = e.target.value;
                    const { balance } = shopEarnings(sid);
                    setForm(f => ({ ...f, shop_id: sid, amount: Math.max(0, balance).toFixed(2) }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                >
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {formErrors.shop_id && <p className="text-xs text-[#F43F5E] mt-1">{formErrors.shop_id}</p>}
                {form.shop_id && (() => {
                  const { net, paid, balance } = shopEarnings(form.shop_id);
                  return (
                    <div className="mt-2 bg-[#F8FAFC] rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>{t('payouts_available')}</span>
                        <span className="font-semibold text-[#1E293B]">${net.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>{t('payouts_already_paid')}</span>
                        <span className="font-semibold text-emerald-600">${paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1">
                        <span className="font-semibold text-[#1E293B]">Balance</span>
                        <span className={`font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${Math.max(0, balance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('payouts_modal_amount')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                {formErrors.amount && <p className="text-xs text-[#F43F5E] mt-1">{formErrors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('payouts_modal_date')}</label>
                <input
                  type="date"
                  value={form.paid_at}
                  onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                {formErrors.paid_at && <p className="text-xs text-[#F43F5E] mt-1">{formErrors.paid_at}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('payouts_modal_note')}</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={t('payouts_modal_note_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('payouts_modal_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={15} className="animate-spin" /> {t('payouts_modal_saving')}</> : <><CheckCircle size={15} /> {t('payouts_modal_save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
