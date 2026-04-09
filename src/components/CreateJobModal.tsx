import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Product, ShopProduct, PricingTier } from '@/lib/types';
import { createJob } from '@/lib/store';

interface CreateJobModalProps {
  shopId: string;
  products: Product[];
  shopProducts: ShopProduct[];
  onClose: () => void;
  onCreated: () => void;
}

function calcCost(pages: number, tiers: PricingTier[]): number {
  if (!tiers.length) return 0;
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
  return total;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ shopId, products, shopProducts, onClose, onCreated }) => {
  const enabledProducts = products.filter(p => {
    const sp = shopProducts.find(s => s.productId === p.id);
    return sp?.isEnabled && sp.pricingTiers.length > 0;
  });

  const [form, setForm] = useState({
    productId: enabledProducts[0]?.id ?? '',
    customerName: '',
    pages: 1,
    copies: 1,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProduct = products.find(p => p.id === form.productId);
  const selectedSP = shopProducts.find(sp => sp.productId === form.productId);
  const costPerCopy = selectedSP ? calcCost(form.pages, selectedSP.pricingTiers) : 0;
  const totalCost = costPerCopy * form.copies;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.productId) e.productId = 'Please select a product';
    if (form.pages < 1) e.pages = 'Pages must be at least 1';
    if (selectedProduct && form.pages > selectedProduct.maxPages) e.pages = `Max ${selectedProduct.maxPages} pages for this product`;
    if (selectedProduct && form.pages < selectedProduct.minPages) e.pages = `Min ${selectedProduct.minPages} pages for this product`;
    if (form.copies < 1) e.copies = 'Copies must be at least 1';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    createJob({
      shopId,
      productId: form.productId,
      customerName: form.customerName,
      pages: form.pages,
      copies: form.copies,
      totalCost,
      status: 'pending',
      notes: form.notes,
    });
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-[#1E293B]">New Print Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {enabledProducts.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No products with pricing configured. Enable products and set pricing first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Customer Name</label>
              <input
                type="text"
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="e.g. John Smith"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              {errors.customerName && <p className="text-xs text-[#F43F5E] mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Product</label>
              <select
                value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value, pages: 1 }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
              >
                {enabledProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.productId && <p className="text-xs text-[#F43F5E] mt-1">{errors.productId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Pages {selectedProduct && <span className="text-gray-400 font-normal">({selectedProduct.minPages}–{selectedProduct.maxPages})</span>}
                </label>
                <input
                  type="number"
                  min={selectedProduct?.minPages ?? 1}
                  max={selectedProduct?.maxPages}
                  value={form.pages}
                  onChange={e => setForm(f => ({ ...f, pages: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                {errors.pages && <p className="text-xs text-[#F43F5E] mt-1">{errors.pages}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Copies</label>
                <input
                  type="number"
                  min={1}
                  value={form.copies}
                  onChange={e => setForm(f => ({ ...f, copies: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                {errors.copies && <p className="text-xs text-[#F43F5E] mt-1">{errors.copies}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Special instructions..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              />
            </div>

            {/* Cost preview */}
            <div className="bg-[#F8FAFC] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Estimated Total</span>
              <span className="text-lg font-bold text-[#1E293B]">${totalCost.toFixed(2)}</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors"
              >
                Create Job
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateJobModal;