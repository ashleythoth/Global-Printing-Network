import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Image, Trash2, Loader2, Paperclip } from 'lucide-react';
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

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) {
    return <Image size={14} className="text-blue-500" />;
  }
  return <FileText size={14} className="text-orange-500" />;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === form.productId);
  const selectedSP = shopProducts.find(sp => sp.productId === form.productId);
  const costPerCopy = selectedSP ? calcCost(form.pages, selectedSP.pricingTiers) : 0;
  const totalCost = costPerCopy * form.copies;

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

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setUploading(true);
    const uploadedFiles: JobFile[] = [];

    for (const file of selectedFiles) {
      const path = `${shopId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('job-files')
        .upload(path, file);

      if (uploadError) {
        setErrors(prev => ({ ...prev, files: `Failed to upload "${file.name}": ${uploadError.message}` }));
        setUploading(false);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from('job-files')
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

      uploadedFiles.push({
        name: file.name,
        path,
        url: signedData?.signedUrl ?? '',
      });
    }

    createJob({
      shopId,
      productId: form.productId,
      customerName: form.customerName,
      pages: form.pages,
      copies: form.copies,
      totalCost,
      status: 'pending',
      notes: form.notes,
      files: uploadedFiles,
    });

    setUploading(false);
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                Files <span className="text-gray-400 font-normal">(PDF, Word, images — max 50MB each)</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#2563EB] hover:bg-blue-50/40 text-gray-400 hover:text-[#2563EB] rounded-xl py-3 text-sm font-medium transition-all"
              >
                <Upload size={16} />
                Click to attach files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {errors.files && <p className="text-xs text-[#F43F5E] mt-1">{errors.files}</p>}

              {selectedFiles.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2 text-sm">
                      {fileIcon(file.name)}
                      <span className="flex-1 truncate text-[#1E293B]">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-gray-300 hover:text-[#F43F5E] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Create Job'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateJobModal;