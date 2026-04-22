import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Percent, Loader2, FileText, Camera, Download, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchOrdersByShopId, SupabaseOrder } from '@/lib/ordersService';
import { getAllSettings } from '@/lib/settingsService';
import { fetchShops } from '@/lib/shopsService';
import { fetchPayoutsByShopId, Payout } from '@/lib/payoutsService';
import { useLanguage } from '@/context/LanguageContext';

const SQUARE_RATE = 2.9;
const SQUARE_FIXED = 0.30;

function calcFees(total: number, platformPct: number) {
  const squareFee = (total * SQUARE_RATE) / 100 + SQUARE_FIXED;
  const platformFee = (total * platformPct) / 100;
  const payout = total - squareFee - platformFee;
  return { squareFee, platformFee, payout };
}

const ShopEarnings: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [platformFeePct, setPlatformFeePct] = useState(10);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(0);
  const [supabaseShopId, setSupabaseShopId] = useState<string | null>(null);

  const PERIOD_OPTIONS = [
    { label: t('all_time'), days: 0 },
    { label: t('last_30'), days: 30 },
    { label: t('last_90'), days: 90 },
    { label: t('this_year'), days: 365 },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [shops, settings] = await Promise.all([fetchShops(), getAllSettings()]);
      const matched = shops.find(s => s.email === currentUser?.email);
      const shopId = matched?.id ?? currentUser?.shopId ?? '';
      setSupabaseShopId(shopId);

      const [ordersData, payoutsData] = await Promise.all([
        fetchOrdersByShopId(shopId),
        fetchPayoutsByShopId(shopId),
      ]);
      setOrders(ordersData);
      setPayouts(payoutsData);
      if (settings['platform_fee_pct']) setPlatformFeePct(parseFloat(settings['platform_fee_pct']));
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const filteredOrders = orders.filter(o => {
    if (period === 0) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return new Date(o.created_at) >= cutoff;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED' || o.status === 'completed');
  const pendingOrders = filteredOrders.filter(o => o.status === 'SUBMITTED' || o.status === 'IN_PROGRESS' || o.status === 'pending' || o.status === 'in-progress');

  const grossRevenue = completedOrders.reduce((s, o) => s + Number(o.total_price), 0);
  const totalSquareFees = completedOrders.reduce((s, o) => s + calcFees(Number(o.total_price), platformFeePct).squareFee, 0);
  const totalPlatformFees = completedOrders.reduce((s, o) => s + calcFees(Number(o.total_price), platformFeePct).platformFee, 0);
  const totalPayout = completedOrders.reduce((s, o) => s + calcFees(Number(o.total_price), platformFeePct).payout, 0);
  const pendingPayout = pendingOrders.reduce((s, o) => s + calcFees(Number(o.total_price), platformFeePct).payout, 0);
  const totalReceived = payouts.reduce((s, p) => s + Number(p.amount), 0);
  const balance = totalPayout - totalReceived;

  const handleExport = () => {
    const rows = [
      ['Date', 'Product', 'Type', 'Details', 'Gross', 'Square Fee', `Platform Fee (${platformFeePct}%)`, 'Your Payout', 'Status'],
      ...completedOrders.map(o => {
        const { squareFee, platformFee, payout } = calcFees(Number(o.total_price), platformFeePct);
        const details = o.product_print_type === 'photo'
          ? [o.size, o.finish, `×${o.total_quantity}`].filter(Boolean).join(' ')
          : [`${o.total_quantity}pg`, o.color_mode, o.sides].filter(Boolean).join(' ');
        return [
          new Date(o.created_at).toLocaleDateString(),
          o.product_name,
          o.product_print_type,
          details,
          `$${Number(o.total_price).toFixed(2)}`,
          `$${squareFee.toFixed(2)}`,
          `$${platformFee.toFixed(2)}`,
          `$${payout.toFixed(2)}`,
          o.status,
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('earnings_title')}</h1>
          <p className="text-gray-500 mt-1">{t('earnings_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  period === opt.days
                    ? 'bg-[#1E3A5F] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#1E293B]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={completedOrders.length === 0}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1E293B] border border-gray-200 hover:border-gray-300 bg-white px-3 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} /> {t('earnings_export')}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-[#2563EB]/10 rounded-lg p-2"><DollarSign size={16} className="text-[#2563EB]" /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('earnings_gross')}</span>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">${grossRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{completedOrders.length} {t('earnings_completed_orders').toLowerCase()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-red-50 rounded-lg p-2"><CreditCard size={16} className="text-red-400" /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('earnings_fees')}</span>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">−${(totalSquareFees + totalPlatformFees).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Square + {platformFeePct}% platform</p>
        </div>

        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 rounded-lg p-2"><TrendingUp size={16} className="text-white" /></div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{t('earnings_payout')}</span>
          </div>
          <p className="text-2xl font-bold text-white">${totalPayout.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">net after all fees</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-amber-50 rounded-lg p-2"><Percent size={16} className="text-amber-500" /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('earnings_pending')}</span>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">${pendingPayout.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{pendingOrders.length} orders in progress</p>
        </div>
      </div>

      {/* Payout History from Admin */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#1E293B]">{t('earnings_payout_history')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('earnings_payout_history_sub')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">{t('earnings_total_received')}</p>
              <p className="text-lg font-bold text-emerald-600">${totalReceived.toFixed(2)}</p>
            </div>
            {balance > 0.01 && (
              <div className="text-right bg-amber-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">Balance Due</p>
                <p className="text-lg font-bold text-amber-600">${balance.toFixed(2)}</p>
              </div>
            )}
            {balance <= 0.01 && totalReceived > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-2 rounded-xl">
                <CheckCircle size={14} /> Fully Paid
              </div>
            )}
          </div>
        </div>

        {payouts.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">{t('earnings_no_payouts')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_paid_on')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_amount')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('payouts_note')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map(p => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-gray-200">
                  <td className="px-6 py-4 text-sm font-bold text-[#1E293B]">{t('earnings_total_received')}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">${totalReceived.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Fee breakdown explainer */}
      <div className="bg-[#F8FAFC] rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How your payout is calculated</p>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2563EB] shrink-0" />
            <span className="text-gray-600">Order total (gross)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">−</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
            <span className="text-gray-600">Square: {SQUARE_RATE}% + ${SQUARE_FIXED.toFixed(2)}/order</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">−</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <span className="text-gray-600">Platform fee: {platformFeePct}%</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">=</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-[#1E293B]">Your payout</span>
          </div>
        </div>
      </div>

      {/* Orders breakdown table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1E293B]">{t('earnings_completed_orders')}</h2>
          <span className="text-xs text-gray-400">{completedOrders.length} orders</span>
        </div>

        {completedOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{t('earnings_no_completed')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_date')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_product')}</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_details')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_gross_col')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_square_col')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_platform_col')}</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_your_payout')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completedOrders.map(order => {
                  const { squareFee, platformFee, payout } = calcFees(Number(order.total_price), platformFeePct);
                  const isPhoto = order.product_print_type === 'photo';
                  const details = isPhoto
                    ? [order.size, order.finish, order.total_quantity ? `×${order.total_quantity}` : ''].filter(Boolean).join(' · ')
                    : [order.total_quantity ? `${order.total_quantity} pg` : '', order.color_mode, order.sides].filter(Boolean).join(' · ');

                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}>
                            {isPhoto ? <Camera size={13} /> : <FileText size={13} />}
                          </span>
                          <span className="text-xs text-gray-700 font-medium">{order.product_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{details || '—'}</td>
                      <td className="px-6 py-4 text-right font-medium text-[#1E293B]">
                        ${Number(order.total_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-red-400">
                        −${squareFee.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-amber-500">
                        −${platformFee.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        ${payout.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-gray-200">
                  <td colSpan={3} className="px-6 py-4 text-sm font-bold text-[#1E293B]">{t('earnings_totals')}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#1E293B]">${grossRevenue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-400">−${totalSquareFees.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-amber-500">−${totalPlatformFees.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">${totalPayout.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1E293B]">{t('earnings_pending_payout')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Orders in progress — not yet earned</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
              ${pendingPayout.toFixed(2)} expected
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50/50 border-b border-amber-100">
                  <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_date')}</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_product')}</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('earnings_gross_col')}</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Est. {t('earnings_your_payout')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {pendingOrders.map(order => {
                  const { payout } = calcFees(Number(order.total_price), platformFeePct);
                  const isPhoto = order.product_print_type === 'photo';
                  const statusLabel = order.status === 'SUBMITTED' || order.status === 'pending' ? t('status_submitted') : t('status_in_progress');
                  return (
                    <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-3.5 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}>
                            {isPhoto ? <Camera size={13} /> : <FileText size={13} />}
                          </span>
                          <span className="text-xs text-gray-700 font-medium">{order.product_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{statusLabel}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-600">${Number(order.total_price).toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-amber-600">${payout.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopEarnings;
