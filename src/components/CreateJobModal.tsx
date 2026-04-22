import React, { useState, useRef } from 'react';
import {
  X, Upload, FileText, Image, Trash2, Loader2,
  ChevronRight, ChevronLeft, Minus, Plus, Camera,
} from 'lucide-react';
import {
  Product, ShopProduct, PricingTier, JobFile,
  COLOR_MODE_LABELS, SIDES_LABELS, PHOTO_SIZE_LABELS, PHOTO_FINISH_LABELS,
  PhotoSize, PhotoFinish,
} from '@/lib/types';
import { createJob } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

interface CreateJobModalProps {
  shopId: string;
  products: Product[];
  shopProducts: ShopProduct[];
  onClose: () => void;
  onCreated: () => void;
}

function calcDocCost(pages: number, tiers: PricingTier[]): number {
  if (!tiers.length) return 0;
  let total = 0;
  let remaining = pages;
  const sorted = [...tiers].sort((a, b) => a.fromPage - b.fromPage);
  for (const tier of sorted) {
    if (remaining <= 0) break;
    const pagesInTier = Math.min(remaining, tier.toPage - tier.fromPage + 1);
    total += pagesInTier * tier.pricePerPage;
    remaining -= pagesInTier;
  }
  return total;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['jpg','jpeg','png','webp','gif'].includes(ext ?? '')
    ? <Image size={14} className="text-blue-500" />
    : <FileText size={14} className="text-orange-500" />;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const OptionBtn: React.FC<{ label: string; sub?: string; selected: boolean; onClick: () => void }> = ({ label, sub, selected, onClick }) => (
  <button type="button" onClick={onClick}
    className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
      selected ? 'border-[#2563EB] bg-blue-50/60' : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}>
    <p className={`font-semibold text-sm ${selected ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </button>
);

const CreateJobModal: React.FC<CreateJobModalProps> = ({ shopId, products, shopProducts, onClose, onCreated }) => {
  const { t } = useLanguage();
  const enabledSPs = shopProducts.filter(sp => sp.isEnabled);
  const enabledProducts = products.filter(p => enabledSPs.some(sp => sp.productId === p.id));

  const STEPS = [t('job_step_product'), t('job_step_files'), t('job_step_options'), t('job_step_review')];

  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(enabledProducts[0]?.id ?? '');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const [pages, setPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState('');
  const [sides, setSides] = useState('');
  const [paperTypeId, setPaperTypeId] = useState('');

  const [photoSize, setPhotoSize] = useState<PhotoSize | ''>('');
  const [photoFinish, setPhotoFinish] = useState<PhotoFinish | ''>('');
  const [quantity, setQuantity] = useState(1);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === productId);
  const selectedSP = shopProducts.find(sp => sp.productId === productId);
  const isDoc = selectedProduct?.printType === 'document';

  const selectedPaper = selectedSP?.paperTypes?.find(pt => pt.id === paperTypeId);
  const docBaseCost = isDoc ? calcDocCost(pages, selectedSP?.pricingTiers ?? []) : 0;
  const docTotal = (docBaseCost + (selectedPaper?.priceUpcharge ?? 0) * pages) * copies;

  const photoEntry = !isDoc && photoSize && photoFinish
    ? selectedSP?.photoPrices?.find(p => p.size === photoSize && p.finish === photoFinish)
    : null;
  const photoTotal = photoEntry ? photoEntry.priceEach * quantity : 0;
  const totalCost = isDoc ? docTotal : photoTotal;

  const handleProductChange = (id: string) => {
    setProductId(id);
    const p = products.find(x => x.id === id);
    const sp = shopProducts.find(x => x.productId === id);
    if (p?.printType === 'document') {
      setColorMode(p.colorModes?.[0] ? COLOR_MODE_LABELS[p.colorModes[0]] : '');
      setSides(p.sides?.[0] ? SIDES_LABELS[p.sides[0]] : '');
      setPaperTypeId(sp?.paperTypes?.[0]?.id ?? '');
      setPages(p.minPages ?? 1);
    } else {
      setPhotoSize(p?.sizes?.[0] ?? '');
      setPhotoFinish(p?.finishes?.[0] ?? '');
      setQuantity(1);
    }
  };

  React.useEffect(() => {
    if (enabledProducts[0]) handleProductChange(enabledProducts[0].id);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => {
      if (f.size > MAX_FILE_SIZE) { setErrors(prev => ({ ...prev, files: `"${f.name}" exceeds 50MB` })); return false; }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && !customerName.trim()) e.customerName = t('job_customer_required');
    return e;
  };

  const next = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setUploading(true);
    const uploadedFiles: JobFile[] = [];

    for (const file of selectedFiles) {
      const path = `${shopId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('job-files').upload(path, file);
      if (uploadError) { setErrors({ files: `Failed to upload "${file.name}"` }); setUploading(false); return; }
      const { data: signedData } = await supabase.storage.from('job-files').createSignedUrl(path, 60 * 60 * 24 * 7);
      uploadedFiles.push({ name: file.name, path, url: signedData?.signedUrl ?? '' });
    }

    createJob({
      shopId, productId, customerName,
      ...(isDoc ? { pages, copies, colorMode, sides, paperType: selectedPaper?.name, paperUpcharge: selectedPaper?.priceUpcharge }
        : { photoSize: photoSize || undefined, photoFinish: photoFinish || undefined, quantity }),
      totalCost, status: 'pending', notes, files: uploadedFiles,
    });

    setUploading(false);
    onCreated();
    onClose();
  };

  if (enabledProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <p className="text-gray-400 text-sm">{t('job_no_products')}</p>
          <button onClick={onClose} className="mt-4 text-sm text-[#2563EB] font-medium">{t('job_close')}</button>
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
            <h2 className="text-lg font-bold text-[#1E293B]">{t('job_modal_title')}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
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
              <h3 className="text-base font-bold text-[#1E293B]">{t('job_order_details')}</h3>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('job_customer_name')}</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder={t('job_customer_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                {errors.customerName && <p className="text-xs text-[#F43F5E] mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('job_product_label')}</label>
                <div className="space-y-2">
                  {enabledProducts.map(p => {
                    const isD = p.printType === 'document';
                    return (
                      <button key={p.id} type="button" onClick={() => handleProductChange(p.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          productId === p.id ? 'border-[#2563EB] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isD ? 'bg-[#2563EB]/10' : 'bg-purple-100'}`}>
                          {isD ? <FileText size={14} className="text-[#2563EB]" /> : <Camera size={14} className="text-purple-600" />}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${productId === p.id ? 'text-[#2563EB]' : 'text-[#1E293B]'}`}>{p.name}</p>
                          <p className="text-xs text-gray-400">{p.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  {t('job_notes_label')} <span className="text-gray-400 font-normal">{t('job_notes_optional')}</span>
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder={t('job_notes_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none" />
              </div>
            </div>
          )}

          {/* STEP 1: Files */}
          {step === 1 && (
            <div className="space-y-4 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">{t('job_attach_files')}</h3>
              <p className="text-sm text-gray-500">{isDoc ? t('job_attach_docs_sub') : t('job_attach_photos_sub')}</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#2563EB] hover:bg-blue-50/40 text-gray-400 hover:text-[#2563EB] rounded-xl py-8 text-sm font-medium transition-all">
                <Upload size={24} />
                <span>{t('job_click_attach')}</span>
                <span className="text-xs font-normal">{isDoc ? 'PDF, DOC, DOCX' : 'JPG, PNG, TIFF'}</span>
              </button>
              <input ref={fileInputRef} type="file" multiple
                accept={isDoc ? '.pdf,.doc,.docx' : '.jpg,.jpeg,.png,.tiff,.webp'}
                onChange={handleFileChange} className="hidden" />
              {errors.files && <p className="text-xs text-[#F43F5E]">{errors.files}</p>}
              {selectedFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2 text-sm">
                      {fileIcon(file.name)}
                      <span className="flex-1 truncate text-[#1E293B]">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => setSelectedFiles(f => f.filter((_, i) => i !== idx))}
                        className="text-gray-300 hover:text-[#F43F5E] transition-colors"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedFiles.length === 0 && <p className="text-center text-xs text-gray-400">{t('job_no_files')}</p>}
            </div>
          )}

          {/* STEP 2: Print Options */}
          {step === 2 && (
            <div className="space-y-5 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">{t('job_print_options')}</h3>

              {isDoc && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_copies')}</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setCopies(c => Math.max(1, c - 1))}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="text-2xl font-bold text-[#1E293B] w-8 text-center">{copies}</span>
                      <button type="button" onClick={() => setCopies(c => c + 1)}
                        className="w-10 h-10 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] flex items-center justify-center text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                      {t('job_pages_label')} <span className="text-gray-400 font-normal">({selectedProduct?.minPages}–{selectedProduct?.maxPages})</span>
                    </label>
                    <input type="number" min={selectedProduct?.minPages ?? 1} max={selectedProduct?.maxPages}
                      value={pages} onChange={e => setPages(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                  </div>
                  {(selectedProduct?.colorModes?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_color_label')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct!.colorModes!.map(m => (
                          <OptionBtn key={m} label={COLOR_MODE_LABELS[m]} selected={colorMode === COLOR_MODE_LABELS[m]}
                            onClick={() => setColorMode(COLOR_MODE_LABELS[m])} />
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedProduct?.sides?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_sides_label')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct!.sides!.map(s => (
                          <OptionBtn key={s} label={SIDES_LABELS[s]} selected={sides === SIDES_LABELS[s]}
                            onClick={() => setSides(SIDES_LABELS[s])} />
                        ))}
                      </div>
                    </div>
                  )}
                  {(selectedSP?.paperTypes?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_paper_type')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedSP!.paperTypes.map(pt => (
                          <OptionBtn key={pt.id} label={pt.name}
                            sub={pt.priceUpcharge > 0 ? `+$${pt.priceUpcharge.toFixed(2)}/pg · ${pt.description}` : pt.description}
                            selected={paperTypeId === pt.id} onClick={() => setPaperTypeId(pt.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isDoc && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_quantity')}</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="text-2xl font-bold text-[#1E293B] w-8 text-center">{quantity}</span>
                      <button type="button" onClick={() => setQuantity(q => q + 1)}
                        className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_print_size')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(selectedProduct?.sizes ?? []).map(s => (
                        <OptionBtn key={s} label={PHOTO_SIZE_LABELS[s]} selected={photoSize === s} onClick={() => setPhotoSize(s)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-3">{t('job_finish')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(selectedProduct?.finishes ?? []).map(f => (
                        <OptionBtn key={f} label={PHOTO_FINISH_LABELS[f]} selected={photoFinish === f} onClick={() => setPhotoFinish(f)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Cost summary */}
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl px-4 py-4 space-y-2">
                <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">{t('job_est_cost')}</p>
                {isDoc ? (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{pages} pages × {copies} {copies === 1 ? 'copy' : 'copies'}</span>
                    <span>${(totalCost / (pages * copies) || 0).toFixed(4)}/pg</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{quantity} print{quantity !== 1 ? 's' : ''} · {photoSize ? PHOTO_SIZE_LABELS[photoSize as PhotoSize] : '—'} · {photoFinish ? PHOTO_FINISH_LABELS[photoFinish as PhotoFinish] : '—'}</span>
                    <span>{photoEntry ? `$${photoEntry.priceEach.toFixed(2)} each` : t('job_not_priced')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="font-bold text-[#1E293B]">{t('job_total')}</span>
                  <span className="text-xl font-bold text-[#2563EB]">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4 pb-4">
              <h3 className="text-base font-bold text-[#1E293B]">{t('job_review_title')}</h3>
              <div className="bg-[#F8FAFC] rounded-xl divide-y divide-gray-100 overflow-hidden border border-gray-100">
                {[
                  { label: t('job_review_customer'), value: customerName },
                  { label: t('job_review_product'), value: selectedProduct?.name ?? '—' },
                  ...(isDoc ? [
                    { label: t('job_review_pages'), value: `${pages}` },
                    { label: t('job_review_copies'), value: `${copies}` },
                    ...(colorMode ? [{ label: t('job_review_color'), value: colorMode }] : []),
                    ...(sides ? [{ label: t('job_review_sides'), value: sides }] : []),
                    ...(selectedPaper ? [{ label: t('job_review_paper'), value: selectedPaper.name }] : []),
                  ] : [
                    { label: t('job_review_size'), value: photoSize ? PHOTO_SIZE_LABELS[photoSize as PhotoSize] : '—' },
                    { label: t('job_review_finish'), value: photoFinish ? PHOTO_FINISH_LABELS[photoFinish as PhotoFinish] : '—' },
                    { label: t('job_review_quantity'), value: `${quantity}` },
                  ]),
                  { label: t('job_review_files'), value: selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}` : t('job_review_none') },
                  ...(notes ? [{ label: t('job_review_notes'), value: notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-[#1E293B] text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#2563EB] rounded-xl px-4 py-4 flex items-center justify-between">
                <span className="text-white/80 text-sm font-medium">{t('job_total_cost')}</span>
                <span className="text-white text-2xl font-bold">${totalCost.toFixed(2)}</span>
              </div>
              {errors.files && <p className="text-xs text-[#F43F5E]">{errors.files}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          {step > 0 ? (
            <button type="button" onClick={() => { setErrors({}); setStep(s => s - 1); }} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              <ChevronLeft size={16} /> {t('job_back')}
            </button>
          ) : (
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
              {t('job_cancel')}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors">
              {t('job_next')} <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60">
              {uploading ? <><Loader2 size={15} className="animate-spin" /> {t('job_uploading')}</> : t('job_place_order')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
