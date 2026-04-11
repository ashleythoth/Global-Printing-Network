import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, X, FileText, Camera, Save,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/store';
import {
  Product, PrintType,
  DocColorMode, DocSides, PhotoSize, PhotoFinish,
  COLOR_MODE_LABELS, SIDES_LABELS, PHOTO_SIZE_LABELS, PHOTO_FINISH_LABELS,
} from '@/lib/types';

// ─── Option sets ──────────────────────────────────────────────────────────────

const ALL_COLOR_MODES: DocColorMode[] = ['bw', 'color'];
const ALL_SIDES: DocSides[] = ['single', 'double'];
const ALL_PHOTO_SIZES: PhotoSize[] = ['4x6','5x7','6x8','8x10','8x12','10x13','10x15','11x14','12x18','16x20','20x24','20x30'];
const ALL_FINISHES: PhotoFinish[] = ['glossy','matte','lustre','metallic'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

// ─── Empty forms ──────────────────────────────────────────────────────────────

const emptyDocForm = {
  printType: 'document' as PrintType,
  name: '',
  description: '',
  colorModes: ['bw'] as DocColorMode[],
  sides: ['single', 'double'] as DocSides[],
  minPages: 1,
  maxPages: 200,
  isActive: true,
};

const emptyPhotoForm = {
  printType: 'photo' as PrintType,
  name: '',
  description: '',
  sizes: ['4x6', '5x7', '8x10'] as PhotoSize[],
  finishes: ['glossy', 'matte'] as PhotoFinish[],
  isActive: true,
};

type DocForm = typeof emptyDocForm;
type PhotoForm = typeof emptyPhotoForm;

// ─── Chip toggle button ───────────────────────────────────────────────────────

const Chip: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
      selected
        ? 'bg-[#2563EB] border-[#2563EB] text-white'
        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

// ─── Editor panel ─────────────────────────────────────────────────────────────

interface EditorPanelProps {
  editProduct: Product | null;
  defaultType: PrintType;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ editProduct, defaultType, onSave, onClose }) => {
  const initType: PrintType = editProduct?.printType ?? defaultType;

  const [printType, setPrintType] = useState<PrintType>(initType);
  const [docForm, setDocForm] = useState<DocForm>(
    editProduct?.printType === 'document'
      ? { printType: 'document', name: editProduct.name, description: editProduct.description,
          colorModes: editProduct.colorModes ?? ['bw'], sides: editProduct.sides ?? ['single'],
          minPages: editProduct.minPages ?? 1, maxPages: editProduct.maxPages ?? 200, isActive: editProduct.isActive }
      : emptyDocForm
  );
  const [photoForm, setPhotoForm] = useState<PhotoForm>(
    editProduct?.printType === 'photo'
      ? { printType: 'photo', name: editProduct.name, description: editProduct.description,
          sizes: editProduct.sizes ?? ['4x6'], finishes: editProduct.finishes ?? ['glossy'], isActive: editProduct.isActive }
      : emptyPhotoForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const form = printType === 'document' ? docForm : photoForm;
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (printType === 'document') {
      if (!docForm.colorModes.length) e.colorModes = 'Select at least one color mode';
      if (!docForm.sides.length) e.sides = 'Select at least one side option';
      if (docForm.maxPages <= docForm.minPages) e.maxPages = 'Max must be greater than min';
    } else {
      if (!photoForm.sizes.length) e.sizes = 'Select at least one size';
      if (!photoForm.finishes.length) e.finishes = 'Select at least one finish';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (printType === 'document') {
      onSave({ printType: 'document', name: docForm.name, description: docForm.description,
        colorModes: docForm.colorModes, sides: docForm.sides,
        minPages: docForm.minPages, maxPages: docForm.maxPages, isActive: docForm.isActive });
    } else {
      onSave({ printType: 'photo', name: photoForm.name, description: photoForm.description,
        sizes: photoForm.sizes, finishes: photoForm.finishes, isActive: photoForm.isActive });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">{editProduct ? 'Edit Product' : 'New Product'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{editProduct ? 'Update product details' : 'Define a new print product'}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Print type selector */}
        {!editProduct && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Print Type</label>
            <div className="grid grid-cols-2 gap-2">
              {([['document', 'Document', FileText], ['photo', 'Photo', Camera]] as const).map(([type, label, Icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPrintType(type)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    printType === type
                      ? type === 'document'
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                        : 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
          <input
            type="text"
            value={printType === 'document' ? docForm.name : photoForm.name}
            onChange={e => printType === 'document'
              ? setDocForm(f => ({ ...f, name: e.target.value }))
              : setPhotoForm(f => ({ ...f, name: e.target.value }))}
            placeholder={printType === 'document' ? 'e.g. Black & White Document' : 'e.g. Standard Photo Print'}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
          {errors.name && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={printType === 'document' ? docForm.description : photoForm.description}
            onChange={e => printType === 'document'
              ? setDocForm(f => ({ ...f, description: e.target.value }))
              : setPhotoForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Describe this product for shop owners..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
          {errors.description && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.description}</p>}
        </div>

        {/* ── Document-specific fields ── */}
        {printType === 'document' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Color Modes Offered</label>
              <div className="flex flex-wrap gap-2">
                {ALL_COLOR_MODES.map(m => (
                  <Chip key={m} label={COLOR_MODE_LABELS[m]} selected={docForm.colorModes.includes(m)}
                    onClick={() => setDocForm(f => ({ ...f, colorModes: toggle(f.colorModes, m) }))} />
                ))}
              </div>
              {errors.colorModes && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.colorModes}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sides Offered</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SIDES.map(s => (
                  <Chip key={s} label={SIDES_LABELS[s]} selected={docForm.sides.includes(s)}
                    onClick={() => setDocForm(f => ({ ...f, sides: toggle(f.sides, s) }))} />
                ))}
              </div>
              {errors.sides && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.sides}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Page Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Min pages</label>
                  <input type="number" min={1} value={docForm.minPages}
                    onChange={e => setDocForm(f => ({ ...f, minPages: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max pages</label>
                  <input type="number" min={1} value={docForm.maxPages}
                    onChange={e => setDocForm(f => ({ ...f, maxPages: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                  {errors.maxPages && <p className="text-xs text-[#F43F5E] mt-1">{errors.maxPages}</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Photo-specific fields ── */}
        {printType === 'photo' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Print Sizes Offered</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PHOTO_SIZES.map(s => (
                  <Chip key={s} label={PHOTO_SIZE_LABELS[s]} selected={photoForm.sizes.includes(s)}
                    onClick={() => setPhotoForm(f => ({ ...f, sizes: toggle(f.sizes, s) }))} />
                ))}
              </div>
              {errors.sizes && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.sizes}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Finishes Offered</label>
              <div className="flex flex-wrap gap-2">
                {ALL_FINISHES.map(f => (
                  <Chip key={f} label={PHOTO_FINISH_LABELS[f]} selected={photoForm.finishes.includes(f)}
                    onClick={() => setPhotoForm(pf => ({ ...pf, finishes: toggle(pf.finishes, f) }))} />
                ))}
              </div>
              {errors.finishes && <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1"><AlertCircle size={11} />{errors.finishes}</p>}
            </div>
          </>
        )}

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Available to shops</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(printType === 'document' ? docForm.isActive : photoForm.isActive)
                ? 'Shops can enable this product'
                : 'Hidden from all shops'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => printType === 'document'
              ? setDocForm(f => ({ ...f, isActive: !f.isActive }))
              : setPhotoForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              (printType === 'document' ? docForm.isActive : photoForm.isActive) ? 'bg-[#2563EB]' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              (printType === 'document' ? docForm.isActive : photoForm.isActive) ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors">
          <Save size={14} /> {editProduct ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </div>
  );
};

// ─── Product card ─────────────────────────────────────────────────────────────

const ProductCard: React.FC<{
  product: Product;
  isEditing: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ product, isEditing, onEdit, onToggle, onDelete }) => {
  const isDoc = product.printType === 'document';

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isEditing ? 'border-[#2563EB] shadow-md shadow-blue-100' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
    }`}>
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isDoc ? 'bg-[#2563EB]/10' : 'bg-purple-100'
        }`}>
          {isDoc
            ? <FileText size={20} className="text-[#2563EB]" />
            : <Camera size={20} className="text-purple-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#1E293B] text-sm">{product.name}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isDoc ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-purple-100 text-purple-600'
            }`}>
              {isDoc ? 'Document' : 'Photo'}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              product.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {product.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>

          {/* Attribute chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {isDoc && (
              <>
                {(product.colorModes ?? []).map(m => (
                  <span key={m} className="text-xs bg-[#F8FAFC] border border-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                    {COLOR_MODE_LABELS[m]}
                  </span>
                ))}
                {(product.sides ?? []).map(s => (
                  <span key={s} className="text-xs bg-[#F8FAFC] border border-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                    {SIDES_LABELS[s]}
                  </span>
                ))}
                <span className="text-xs bg-[#F8FAFC] border border-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                  {product.minPages}–{product.maxPages} pages
                </span>
              </>
            )}
            {!isDoc && (
              <>
                {(product.sizes ?? []).map(s => (
                  <span key={s} className="text-xs bg-[#F8FAFC] border border-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                    {PHOTO_SIZE_LABELS[s]}
                  </span>
                ))}
                {(product.finishes ?? []).map(f => (
                  <span key={f} className="text-xs bg-purple-50 border border-purple-100 text-purple-500 px-2 py-0.5 rounded-lg">
                    {PHOTO_FINISH_LABELS[f]}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onToggle} title={product.isActive ? 'Deactivate' : 'Activate'}
            className={`p-2 rounded-lg transition-colors text-sm font-medium ${
              product.isActive
                ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
            }`}>
            {product.isActive ? '○' : '●'}
          </button>
          <button onClick={onEdit} title="Edit"
            className={`p-2 rounded-lg transition-colors ${
              isEditing ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'text-gray-400 hover:text-[#2563EB] hover:bg-blue-50'
            }`}>
            <Edit2 size={15} />
          </button>
          <button onClick={onDelete} title="Delete"
            className="p-2 text-gray-400 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [activeTab, setActiveTab] = useState<'all' | 'document' | 'photo'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [defaultType, setDefaultType] = useState<PrintType>('document');

  const refresh = () => setProducts(getProducts());

  const openCreate = (type: PrintType) => {
    setEditProduct(null);
    setDefaultType(type);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setDefaultType(product.printType);
    setEditorOpen(true);
  };

  const handleSave = (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (editProduct) {
      updateProduct(editProduct.id, data);
    } else {
      createProduct(data);
    }
    refresh();
    setEditorOpen(false);
    setEditProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product? This will also remove it from all shop configurations.')) {
      deleteProduct(id);
      refresh();
    }
  };

  const docs = products.filter(p => p.printType === 'document');
  const photos = products.filter(p => p.printType === 'photo');
  const filtered = activeTab === 'all' ? products : activeTab === 'document' ? docs : photos;

  return (
    <div className="flex gap-6 h-full min-h-0">

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Products</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Define what your print shops can offer customers
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => openCreate('document')}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={15} /><FileText size={14} /> Document
            </button>
            <button onClick={() => openCreate('photo')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={15} /><Camera size={14} /> Photo
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'all', label: 'All Products', count: products.length, icon: <CheckCircle2 size={18} />, color: 'text-[#1E293B]', bg: 'bg-gray-100' },
            { id: 'document', label: 'Documents', count: docs.length, icon: <FileText size={18} />, color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
            { id: 'photo', label: 'Photos', count: photos.length, icon: <Camera size={18} />, color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                activeTab === tab.id
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-md'
                  : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                activeTab === tab.id ? 'bg-white/20' : tab.bg
              }`}>
                <span className={activeTab === tab.id ? 'text-white' : tab.color}>{tab.icon}</span>
              </div>
              <div>
                <p className={`text-xl font-bold ${activeTab === tab.id ? 'text-white' : 'text-[#1E293B]'}`}>{tab.count}</p>
                <p className={`text-xs font-medium ${activeTab === tab.id ? 'text-white/70' : 'text-gray-500'}`}>{tab.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="space-y-3">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isEditing={editProduct?.id === product.id && editorOpen}
              onEdit={() => editProduct?.id === product.id && editorOpen ? setEditorOpen(false) : openEdit(product)}
              onToggle={() => { updateProduct(product.id, { isActive: !product.isActive }); refresh(); }}
              onDelete={() => handleDelete(product.id)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                activeTab === 'photo' ? 'bg-purple-100' : 'bg-[#2563EB]/10'
              }`}>
                {activeTab === 'photo'
                  ? <Camera size={22} className="text-purple-600" />
                  : <FileText size={22} className="text-[#2563EB]" />}
              </div>
              <p className="font-semibold text-[#1E293B] text-sm">No {activeTab === 'all' ? '' : activeTab} products yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">Create your first product to get started.</p>
              <button
                onClick={() => openCreate(activeTab === 'photo' ? 'photo' : 'document')}
                className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                  activeTab === 'photo' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#2563EB] hover:bg-[#1d4ed8]'
                }`}
              >
                <Plus size={14} /> Create Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-in editor ── */}
      {editorOpen && (
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col overflow-hidden">
          <EditorPanel
            editProduct={editProduct}
            defaultType={defaultType}
            onSave={handleSave}
            onClose={() => { setEditorOpen(false); setEditProduct(null); }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
