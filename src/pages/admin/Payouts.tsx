import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Trash2, X, Loader2, AlertCircle,
  CheckCircle, Store, TrendingUp, CreditCard, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fetchShops } from '@/lib/shopsService';
import { fetchOrders, SupabaseOrder } from '@/lib/ordersService';
import { fetchPayouts, insertPayout, deletePayout, Payout } from '@/lib/payoutsService';
import { getSetting } from '@/lib/settingsService';
import { PrintShop } from '@/lib/types';

const SQUARE_RATE = 2.9;
const SQUARE_FIXED = 0.30;

function calcNetPayout(gross: number, platformPct: number) {
  const squareFee = (gross * SQUARE_RATE) / 100 + SQUARE_FIXED;
  const platformFee = (gross * platformPct) / 100;
  return gross - squareFee - platformFee;
}

interface ShopSummary {
  shop: PrintShop;
  grossRevenue: number;
  netEarned: number;
  totalPaidOut: number;
  balance: number;
  payouts: Payout[];
}

const AdminPayouts: React.FC = () => {
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state
  const [modalShop, setModalShop] = useState<ShopSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [shopsData, ordersData, payoutsData, feeSetting] = await Promise.all([
      fetchShops(),
      fetchOrders(),
      fetchPayouts(),
      getSetting('platform_fee_pct'),
    ]);
    setShops(shopsData);
    setOrders(ordersData);
    setPayouts(payoutsData);
    if (feeSetting) setPlatformFeePct(parseFloat(feeSetting));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const buildSummaries = (): ShopSummary[] => {
    return shops.map(shop => {
      const shopOrders = orders.filter(o =>
        (o.shop_id === shop.id) && (o.status === 'COMPLETED' || o.status === 'completed')
      );
      const gross = shopOrders.reduce((s, o) => s + Number(o.total_price), 0);
      const net = shopOrders.reduce((s, o) => s + calcNetPayout(Number(o.total_price), platformFeePct), 0);
      const shopPayouts = payouts.filter(p => p.shop_id === shop.id);
      const totalPaid = shopPayouts.reduce((s, p) => s + Number(p.amount), 0);
      return {
        shop,
        grossRevenue: gross,
        netEarned: net,
        totalPaidOut: totalPaid,
        balance: net - totalPaid,
        payouts: shopPayouts,
      };
    });
  };

  const summaries = buildSummaries();
  const totalBalance = summaries.reduce((s, x) => s + x.balance, 0);
  const totalPaidOut = summaries.reduce((s, x) => s + x.totalPaidOut, 0);

  const openModal = (summary: ShopSummary) => {
    setModalShop(summary);
    setAmount(summary.balance > 0 ? summary.balance.toFixed(2) : '');
    setNote('');
    setPaidAt(new Date().toISOString().slice(0, 10));
    setFormError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setFormError('Enter a valid amount greater than $0.'); return; }
    if (!modalShop) return;
    setSaving(true);
    setFormError('');
    const newPayout = await insertPayout(modalShop.shop.id, num, note, new Date(paidAt).toISOString());
    setPayouts(prev => [newPayout, ...prev]);
    setSuccessMsg(`$${num.toFixed(2)} payout recorded for ${modalShop.shop.name}!`);
    setSaving(false);
    setAmount('');
    setNote('');
    setTimeout(() => {
      setModalShop(null);
      setSuccessMsg('');
    }, 1800);
  };

  const handleDelete = async (payoutId: string) => {
    if (!confirm('Remove this payout record?')) return;
    await deletePayout(payoutId);
    setPayouts(prev => prev.filter(p => p.id !== payoutId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading payouts…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Payouts</h1>
        <p className="text-gray-500 mt-1">Record payments made to print shops</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-amber-50 rounded-xl p-3"><DollarSign size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">${totalBalance.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Outstanding</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-50 rounded-xl p-3"><CheckCircle size={20} className="text-emerald-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">${totalPaidOut.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Paid Out</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="bg-white/20 rounded-xl p-3"><TrendingUp size={20} className="text-white" /></div>
          <div>
            <p className="text-2xl font-bold text-white">{summaries.filter(s => s.balance > 0.01).length}</p>
            <p className="text-sm text-white/70 mt-0.5">Shops with Balance</p>
          </div>
        </div>
      </div>

      {/* Shop payout rows */}
      <div className="space-y-3">
        {summaries.map(summary => {
          const isExpanded = expandedId === summary.shop.id;
          const hasBalance = summary.balance > 0.01;

          return (
            <div key={summary.shop.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
              hasBalance ? 'border-amber-100' : 'border-gray-100'
            }`}>
              {/* Row */}
              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Shop identity */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    hasBalance ? 'bg-amber-50' : 'bg-gray-100'
                  }`}>
                    <Store size={18} className={hasBalance ? 'text-amber-500' : 'text-gray-400'} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E293B] truncate">{summary.shop.name}</p>
                    <p className="text-xs text-gray-400">{summary.shop.email}</p>
                  </div>
                </div>

                {/* Financial pills */}
                <div className="flex items-center gap-3 flex-wrap shrink-0">
                  <div className="text-center px-3 py-2 bg-[#F8FAFC] rounded-xl min-w-[72px]">
                    <p className="text-sm font-bold text-[#1E293B]">${summary.netEarned.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Earned</p>
                  </div>
                  <div className="text-center px-3 py-2 bg-emerald-50 rounded-xl min-w-[72px]">
                    <p className="text-sm font-bold text-emerald-600">${summary.totalPaidOut.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Paid Out</p>
                  </div>
                  <div className={`text-center px-3 py-2 rounded-xl min-w-[72px] ${
                    hasBalance ? 'bg-amber-50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm font-bold ${hasBalance ? 'text-amber-600' : 'text-gray-400'}`}>
                      ${summary.balance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">Balance</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {summary.payouts.length > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : summary.shop.id)}
                      className="p-2 text-gray-400 hover:text-[#1E293B] hover:bg-gray-100 rounded-lg transition-colors"
                      title="View history"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => openModal(summary)}
                    className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={14} /> Record Payout
                  </button>
                </div>
              </div>

              {/* Payout history */}
              {isExpanded && summary.payouts.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-6 py-3 bg-[#F8FAFC]">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payout History</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {summary.payouts.map(payout => (
                      <div key={payout.id} className="flex items-center justify-between px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                            <CreditCard size={14} className="text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1E293B]">${Number(payout.amount).toFixed(2)}</p>
                            {payout.note && <p className="text-xs text-gray-400 mt-0.5">{payout.note}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-gray-400">
                            {new Date(payout.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <button
                            onClick={() => handleDelete(payout.id)}
                            className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Record Payout Modal */}
      {modalShop && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-[#1E293B]">Record Payout</h2>
                <p className="text-sm text-gray-500 mt-0.5">{modalShop.shop.name}</p>
              </div>
              <button onClick={() => setModalShop(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Balance summary */}
            <div className="mx-6 mt-5 bg-[#F8FAFC] rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Net Earned</p>
                <p className="font-bold text-[#1E293B]">${modalShop.netEarned.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Paid Out</p>
                <p className="font-bold text-emerald-600">${modalShop.totalPaidOut.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Balance</p>
                <p className={`font-bold ${modalShop.balance > 0.01 ? 'text-amber-600' : 'text-gray-400'}`}>
                  ${modalShop.balance.toFixed(2)}
                </p>
              </div>
            </div>

            {successMsg ? (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-[#1E293B]">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={14} className="shrink-0" />{formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Amount Paid ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-[#1E293B] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                  </div>
                  {modalShop.balance > 0.01 && (
                    <button
                      type="button"
                      onClick={() => setAmount(modalShop.balance.toFixed(2))}
                      className="mt-1.5 text-xs text-[#2563EB] font-medium hover:underline"
                    >
                      Use full balance (${modalShop.balance.toFixed(2)})
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Date Paid</label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={e => setPaidAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                    Note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Bank transfer, PayPal, check #1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalShop(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    {saving ? 'Saving…' : 'Confirm Payout'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;