import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Image, Trash2, Loader2, ChevronRight, ChevronLeft, Minus, Plus } from 'lucide-react';
import { Product, ShopProduct, PricingTier, JobFile } from '@/lib/types';
import { createJob } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';

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

function effectiveRate(pages: number, tiers: PricingTier[]): number {
  if (!pages) return 0;
  return calcCost(pages, tiers) / pages;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) {
    return <Image size={14} className="text-blue-500" />;
  }
  return <FileText size={14} className="text-orange-500" />;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const STEPS = ['Product', 'Files', 'Options', 'Review'];

const CreateJobModal: React.FC<CreateJobModalProps> = ({ shopId, products, shopProducts, onClose, onCreated }) => {
  const enabledProducts = products.filter(p => {
    const sp = shopProducts.find(s => s.productId === p.id);
    return sp?.isEnabled && sp.pricingTiers.length > 0;
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    productId: enabledProducts[0]?.id ?? '',
    customerName: '',
    pages: 1,
    copies: 1,
    paperTypeId: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === form.productId);
  const selectedSP = shopProducts.find(sp => sp.productId === form.productId);
  const paperTypes = selectedSP?.paperTypes ?? [];
  const selectedPaper = paperTypes.find(pt => pt.id === form.paperTypeId) ?? paperTypes[0] ?? null;
  const baseCostPerPage = effectiveRate(form.pages, selectedSP?.pricingTiers ?? []);
  const paperUpcharge = selectedPaper?.priceUpcharge ?? 0;
  const totalPerPage = baseCostPerPage + paperUpcharge;
  const totalCost = (calcCost(form.pages, selectedSP?.pricingTiers ?? []) + paperUpcharge * form.pages) * form.copies;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, files: `"${f.name}" exceeds 50MB limit.` }));
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.customerName.trim()) e.customerName = 'Customer name is required';
      if (!form.productId) e.productId = 'Please select a product';
    }
    return e;
  };

  const next = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setUploading(true);
    const uploadedFiles: JobFile[] = [];

    for (const file of selectedFiles) {
      const path = `${shopId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('job-files').upload(path, file);
      if (uploadError) {
        setErrors({ files: `Failed to upload "${file.name}": ${uploadError.message}` });
        setUploading(false);
        return;
      }
      const { data: signedData } = await supabase.storage
        .from('job-files')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      uploadedFiles.push({ name: file.name, path, url: signedData?.signedUrl ?? '' });
    }

    createJob({
      shopId,
      productId: form.productId,
      customerName: form.customerName,
      pages: form.pages,
      copies: form.copies,
      paperType: selectedPaper?.name,
      paperUpcharge: selectedPaper?.priceUpcharge,
      totalCost,
      status: 'pending',
      notes: form.notes,
      files: uploadedFiles,
    });

    setUploading(false);
    onCreated();
    onClose();
  };

  if (enabledProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <p className="text-gray-400 text-sm">No products with pricing configured. Enable products and set pricing first.</p>
          <button onClick={onClose} className="mt-4 text-sm text-[#2563EB] font-medium">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">New Print Order</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-[#2563EB]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">

          {/* STEP 0: Product & Customer */}
          {step === 0 && (
            <div className="space-y-4 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Order Details</h3>

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
                <div className="space-y-2">
                  {enabledProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, productId: p.id, pages: p.minPages, paperTypeId: '' }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        form.productId === p.id
                          ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]'
                          : 'border-gray-200 text-[#1E293B] hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                    </button>
                  ))}
                </div>
                {errors.productId && <p className="text-xs text-[#F43F5E] mt-1">{errors.productId}</p>}
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
            </div>
          )}

          {/* STEP 1: Files */}
          {step === 1 && (
            <div className="space-y-4 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Attach Files</h3>
              <p className="text-sm text-gray-500">Upload the documents or photos to be printed. PDF, Word, and images accepted (max 50MB each).</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#2563EB] hover:bg-blue-50/40 text-gray-400 hover:text-[#2563EB] rounded-xl py-8 text-sm font-medium transition-all"
              >
                <Upload size={24} />
                <span>Click to attach files</span>
                <span className="text-xs font-normal">PDF, DOC, JPG, PNG</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {errors.files && <p className="text-xs text-[#F43F5E]">{errors.files}</p>}

              {selectedFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2 text-sm">
                      {fileIcon(file.name)}
                      <span className="flex-1 truncate text-[#1E293B]">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeFile(idx)} className="text-gray-300 hover:text-[#F43F5E] transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedFiles.length === 0 && (
                <p className="text-center text-xs text-gray-400">No files attached — you can skip this step.</p>
              )}
            </div>
          )}

          {/* STEP 2: Print Options */}
          {step === 2 && (
            <div className="space-y-5 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Print Options</h3>

              {/* Copies stepper */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-3">Copies</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, copies: Math.max(1, f.copies - 1) }))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-[#1E293B] w-8 text-center">{form.copies}</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, copies: f.copies + 1 }))}
                    className="w-10 h-10 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] flex items-center justify-center text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Pages */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Pages
                  {selectedProduct && (
                    <span className="text-gray-400 font-normal ml-1">({selectedProduct.minPages}–{selectedProduct.maxPages})</span>
                  )}
                </label>
                <input
                  type="number"
                  min={selectedProduct?.minPages ?? 1}
                  max={selectedProduct?.maxPages}
                  value={form.pages}
                  onChange={e => setForm(f => ({ ...f, pages: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>

              {/* Paper Type */}
              {paperTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-3">Paper Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {paperTypes.map(pt => {
                      const isSelected = (form.paperTypeId || paperTypes[0]?.id) === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, paperTypeId: pt.id }))}
                          className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]'
                              : 'border-gray-200 text-[#1E293B] hover:border-gray-300'
                          }`}
                        >
                          <p className={`font-semibold text-sm ${isSelected ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>
                            {pt.name}
                          </p>
                          {pt.description && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{pt.description}</p>
                          )}
                          {pt.priceUpcharge > 0 && (
                            <p className={`text-xs font-semibold mt-1 ${isSelected ? 'text-[#2563EB]' : 'text-gray-500'}`}>
                              +${pt.priceUpcharge.toFixed(2)}/pg
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estimated cost */}
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl px-4 py-4 space-y-2">
                <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">Estimated Cost</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{form.pages} pages × {form.copies} {form.copies === 1 ? 'copy' : 'copies'}</span>
                  <span>${totalPerPage.toFixed(4)}/page</span>
                </div>
                {selectedPaper && selectedPaper.priceUpcharge > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{selectedPaper.name} upcharge</span>
                    <span>+${(selectedPaper.priceUpcharge * form.pages * form.copies).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="font-bold text-[#1E293B]">Total</span>
                  <span className="text-xl font-bold text-[#2563EB]">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Review Order</h3>

              <div className="bg-[#F8FAFC] rounded-xl divide-y divide-gray-100 overflow-hidden border border-gray-100">
                {[
                  { label: 'Customer', value: form.customerName },
                  { label: 'Product', value: selectedProduct?.name ?? '—' },
                  { label: 'Pages', value: `${form.pages}` },
                  { label: 'Copies', value: `${form.copies}` },
                  ...(selectedPaper ? [{ label: 'Paper Type', value: selectedPaper.name }] : []),
                  { label: 'Files', value: selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}` : 'None' },
                  ...(form.notes ? [{ label: 'Notes', value: form.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-[#1E293B] text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#2563EB] rounded-xl px-4 py-4 flex items-center justify-between">
                <span className="text-white/80 text-sm font-medium">Total Cost</span>
                <span className="text-white text-2xl font-bold">${totalCost.toFixed(2)}</span>
              </div>

              {errors.files && (
                <p className="text-xs text-[#F43F5E]">{errors.files}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : 'Place Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
