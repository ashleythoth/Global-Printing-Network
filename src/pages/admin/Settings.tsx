import React, { useState, useEffect } from 'react';
import { Percent, CreditCard, Save, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { getAllSettings, setSetting } from '@/lib/settingsService';

const SQUARE_PROCESSING_FEE = 2.9; // Square's standard rate %
const SQUARE_FIXED_FEE = 0.30;     // Square's fixed fee per transaction

const AdminSettings: React.FC = () => {
  const [platformFeePct, setPlatformFeePct] = useState('10');
  const [squareEnv, setSquareEnv] = useState('sandbox');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllSettings().then(settings => {
      if (settings['platform_fee_pct']) setPlatformFeePct(settings['platform_fee_pct']);
      if (settings['square_environment']) setSquareEnv(settings['square_environment']);
      setLoading(false);
    });
  }, []);

  const feePct = parseFloat(platformFeePct) || 0;
  const isValid = feePct >= 0 && feePct <= 100;

  // Example breakdown on a $100 order
  const exampleOrder = 100;
  const squareFee = (exampleOrder * SQUARE_PROCESSING_FEE) / 100 + SQUARE_FIXED_FEE;
  const platformFee = (exampleOrder * feePct) / 100;
  const shopPayout = exampleOrder - squareFee - platformFee;

  const handleSave = async () => {
    if (!isValid) { setError('Platform fee must be between 0% and 100%.'); return; }
    setError('');
    setSaving(true);
    try {
      await Promise.all([
        setSetting('platform_fee_pct', platformFeePct),
        setSetting('square_environment', squareEnv),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure payment processing and revenue sharing.</p>
      </div>

      {/* Platform Fee Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-[#2563EB]/10 rounded-xl p-2.5">
            <Percent size={18} className="text-[#2563EB]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1E293B]">Platform Fee</h2>
            <p className="text-xs text-gray-500 mt-0.5">Percentage taken off the top of each completed order</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-2">
              Platform Fee Percentage
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[200px]">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={platformFeePct}
                  onChange={e => setPlatformFeePct(e.target.value)}
                  className={`w-full px-4 py-3 pr-10 rounded-xl border text-[#1E293B] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors ${
                    !isValid ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
              </div>
              <p className="text-sm text-gray-500">of each order's total</p>
            </div>
            {!isValid && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> Must be between 0% and 100%
              </p>
            )}
          </div>

          {/* Live breakdown */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={12} /> Example breakdown on a $100.00 order
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order total</span>
                <span className="font-semibold text-[#1E293B]">$100.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <CreditCard size={12} className="text-gray-400" />
                  Square processing ({SQUARE_PROCESSING_FEE}% + ${SQUARE_FIXED_FEE.toFixed(2)})
                </span>
                <span className="text-red-500 font-medium">−${squareFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Percent size={12} className="text-gray-400" />
                  Platform fee ({feePct}%)
                </span>
                <span className="text-[#2563EB] font-medium">−${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-[#1E293B]">Shop payout</span>
                <span className={`font-bold text-lg ${shopPayout >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  ${shopPayout.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Square Environment Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-emerald-50 rounded-xl p-2.5">
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-[#1E293B]">Square Payments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Payment processing environment</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-3">Environment</label>
            <div className="flex gap-3">
              {(['sandbox', 'production'] as const).map(env => (
                <button
                  key={env}
                  onClick={() => setSquareEnv(env)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                    squareEnv === env
                      ? env === 'production'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {env === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}
                  <p className="text-xs font-normal mt-0.5 opacity-70">
                    {env === 'sandbox' ? 'Test mode — no real charges' : 'Live mode — real payments'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {squareEnv === 'production' && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Production mode</strong> processes real payments. Make sure your Square Access Token is set in Supabase Edge Function secrets before switching.
              </p>
            </div>
          )}

          <div className="bg-[#F8FAFC] rounded-xl p-4">
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
              <Info size={12} /> Square API credentials
            </p>
            <p className="text-xs text-gray-400">
              Your <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">SQUARE_ACCESS_TOKEN</code> and{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">SQUARE_ENVIRONMENT</code> secrets are managed in{' '}
              <strong>Supabase → Edge Functions → Manage Secrets</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <span className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle size={16} /> Settings saved!
          </span>
        )}
        {error && (
          <span className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle size={14} /> {error}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
