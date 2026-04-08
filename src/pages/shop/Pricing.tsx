import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProductById, getShopProduct, upsertShopProduct } from '@/lib/store';
import { PricingTier } from '@/lib/types';

const PREVIEW_QUANTITIES = [1, 10, 25, 50, 100, 200, 500];

function calcCost(pages: number, tiers: PricingTier[]): number | null {
  if (!tiers.length) return null;
  let total = 0;
  let remaining = pages;
  const sorted = [...tiers].sort((a, b) => a.fromPage - b.fromPage);

  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierPages = tier.toPage - tier.fromPage + 1;
    const pagesInTier = Math.min(remaining, tierPages);
    total += pagesInTier * tier.pricePerPage;
    remaining -= pagesInTier;
  }

  if (remaining > 0) return null; // pages exceed tiers
  return total;
}

function validateTiers(tiers: PricingTier[]): string[] {
  const errors: string[] = [];
  if (tiers.length === 0) {
    errors.push('At least one pricing tier is required.');
    return errors;
  }

  const sorted = [...tiers].sort((a, b) => a.fromPage - b.fromPage);

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (t.fromPage < 1) errors.push(`Tier ${i + 1}: From page must be at least 1.`);
    if (t.toPage < t.fromPage) errors.push(`Tier ${i + 1}: To page must be ≥ from page.`);
    if (t.pricePerPage <= 0) errors.push(`Tier ${i + 1}: Price per page must be > 0.`);
    if (i > 0) {
      const prev = sorted[i - 1];
      if (t.fromPage !== prev.toPage + 1) {
        errors.push(`Gap or overlap between tier ${i} (ends at ${prev.toPage}) and tier ${i + 1} (starts at ${t.fromPage}). Tiers must be contiguous.`);
      }
    }
  }

  return errors;
}

const ShopPricing: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const shopId = currentUser?.shopId ?? '';

  const product = productId ? getProductById(productId) : null;
  const existing = productId ? getShopProduct(shopId, productId) : null;

  const [tiers, setTiers] = useState<PricingTier[]>(
    existing?.pricingTiers?.length
      ? existing.pricingTiers
      : [{ fromPage: 1, toPage: 50, pricePerPage: 0.10 }]
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const newFrom = last ? last.toPage + 1 : 1;
    setTiers(t => [...t, { fromPage: newFrom, toPage: newFrom + 49, pricePerPage: 0.05 }]);
  };

  const removeTier = (idx: number) => {
    setTiers(t => t.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: keyof PricingTier, value: number) => {
    setTiers(t => t.map((tier, i) => i === idx ? { ...tier, [field]: value } : tier));
  };

  const handleSave = () => {
    const errs = validateTiers(tiers);
    setErrors(errs);
    if (errs.length) return;

    upsertShopProduct(shopId, productId!, { pricingTiers: tiers });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-400">
        Product not found.
        <button onClick={() => navigate('/shop/products')} className="block mx-auto mt-4 text-[#2563EB]">
          Back to Products
        </button>
      </div>
    );
  }

  const sortedTiers = [...tiers].sort((a, b) => a.fromPage - b.fromPage);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/shop/products')}
          className="p-2 text-gray-400 hover:text-[#1E293B] hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Configure Pricing</h1>
          <p className="text-gray-500 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Tier Builder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1E293B]">Pricing Tiers</h2>
          <button
            onClick={addTier}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            <Plus size={15} /> Add Tier
          </button>
        </div>

        <div className="p-6 space-y-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            <span>From Page</span>
            <span>To Page</span>
            <span>Price / Page ($)</span>
            <span className="w-8" />
          </div>

          {tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
              <input
                type="number"
                min={1}
                value={tier.fromPage}
                onChange={e => updateTier(idx, 'fromPage', parseInt(e.target.value) || 1)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <input
                type="number"
                min={1}
                value={tier.toPage}
                onChange={e => updateTier(idx, 'toPage', parseInt(e.target.value) || 1)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <input
                type="number"
                min={0.001}
                step={0.001}
                value={tier.pricePerPage}
                onChange={e => updateTier(idx, 'pricePerPage', parseFloat(e.target.value) || 0)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <button
                onClick={() => removeTier(idx)}
                disabled={tiers.length === 1}
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#F43F5E]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {err}
              </div>
            ))}
          </div>
        )}

        <div className="px-6 pb-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Save size={16} />
            Save Pricing
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-[#10B981] text-sm mt-3">
              <CheckCircle size={16} /> Pricing saved successfully!
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1E293B]">Live Cost Preview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Estimated costs at different page counts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-gray-100">
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pages</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estimated Cost</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Effective Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PREVIEW_QUANTITIES.filter(q => q >= product.minPages && q <= product.maxPages).map(qty => {
                const cost = calcCost(qty, sortedTiers);
                const rate = cost !== null ? cost / qty : null;
                return (
                  <tr key={qty} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-3 font-medium text-[#1E293B]">{qty}</td>
                    <td className="px-6 py-3">
                      {cost !== null
                        ? <span className="font-semibold text-[#10B981]">${cost.toFixed(2)}</span>
                        : <span className="text-gray-400 text-xs">Exceeds tier range</span>
                      }
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {rate !== null ? `$${rate.toFixed(4)}/page` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopPricing;