import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, X, FileText, CreditCard, Maximize2,
  CheckCircle2, ChevronRight, AlertCircle, Save, ToggleLeft, ToggleRight
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/store';
import { Product, ProductCategory } from '@/lib/types';

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORIES: {
  id: ProductCategory | 'all';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'all',
    label: 'All Products',
    description: 'Every product across all categories',
    icon: <CheckCircle2 size={18} />,
    color: 'text-[#1E293B]',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Standard & color document printing',
    icon: <FileText size={18} />,
    color: 'text-[#2563EB]',
    bg: 'bg-[#2563EB]/10',
    border: 'border-[#2563EB]/20',
  },
  {
    id: 'business-cards',
    label: 'Business Cards',
    description: 'Cards, flyers & stationery',
    icon: <CreditCard size={18} />,
    color: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10',
    border: 'border-[#10B981]/20',
  },
  {
    id: 'large-format',
    label: 'Large Format',
    description: 'Banners, posters & signage',
    icon: <Maximize2 size={18} />,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
  },
];

const CATEGORY_META = Object.fromEntries(
  CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c])
) as Record<ProductCategory, typeof CATEGORIES[0]>;

// ─── Empty form ──────────────────────────────────────────────────────────────

const emptyForm = {
  name: '',
  description: '',
  category: 'documents' as ProductCategory,
  minPages: 1,
  maxPages: 100,
  isActive: true,
};

// ─── Inline editor panel ─────────────────────────────────────────────────────

interface EditorPanelProps {
  editProduct: Product | null;
  onSave: (form: typeof emptyForm) => void;
  onClose: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ editProduct, onSave, onClose }) => {
  const [form, setForm] = useState(
    editProduct
      ? {
          name: editProduct.name,
          description: editProduct.description,
          category: editProduct.category,
          minPages: editProduct.minPages,
          maxPages: editProduct.maxPages,
          isActive: editProduct.isActive,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.minPages < 1) e.minPages = 'Must be at least 1';
    if (form.maxPages <= form.minPages) e.maxPages = 'Must be greater than min';
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const selectedCat = CATEGORIES.find(c => c.id === form.category)!;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">
            {editProduct ? 'Edit Product' : 'New Product'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {editProduct ? 'Update product details' : 'Add a new print product'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Category picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
          <div className="space-y-2">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.id as ProductCategory }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  form.category === cat.id
                    ? `${cat.border} ${cat.bg}`
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <span className={`${form.category === cat.id ? cat.color : 'text-gray-400'}`}>
                  {cat.icon}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${form.category === cat.id ? cat.color : 'text-[#1E293B]'}`}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-400">{cat.description}</p>
                </div>
                {form.category === cat.id && (
                  <CheckCircle2 size={16} className={`ml-auto shrink-0 ${cat.color}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={`e.g. ${
              form.category === 'documents' ? 'Standard B&W Print' :
              form.category === 'business-cards' ? 'Premium Business Cards' :
              'Large Format Banner'
            }`}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
          {errors.name && (
            <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1">
              <AlertCircle size={11} /> {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Describe the product for shop owners and customers..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="flex items-center gap-1 text-xs text-[#F43F5E] mt-1">
              <AlertCircle size={11} /> {errors.description}
            </p>
          )}
        </div>

        {/* Page range */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {form.category === 'business-cards' ? 'Quantity Range' : 'Page Range'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Minimum</label>
              <input
                type="number"
                min={1}
                value={form.minPages}
                onChange={e => setForm(f => ({ ...f, minPages: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              {errors.minPages && <p className="text-xs text-[#F43F5E] mt-1">{errors.minPages}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Maximum</label>
              <input
                type="number"
                min={1}
                value={form.maxPages}
                onChange={e => setForm(f => ({ ...f, maxPages: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              {errors.maxPages && <p className="text-xs text-[#F43F5E] mt-1">{errors.maxPages}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Shop owners set their own pricing within this range.
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Available to shops</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.isActive ? 'Shops can enable this product' : 'Hidden from all shops'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isActive ? 'bg-[#2563EB]' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              form.isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors"
        >
          <Save size={14} />
          {editProduct ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const refresh = () => setProducts(getProducts());

  const openCreate = () => {
    setEditProduct(null);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditorOpen(true);
  };

  const handleSave = (form: typeof emptyForm) => {
    if (editProduct) {
      updateProduct(editProduct.id, form);
    } else {
      createProduct(form);
    }
    refresh();
    setEditorOpen(false);
    setEditProduct(null);
  };

  const toggleActive = (product: Product) => {
    updateProduct(product.id, { isActive: !product.isActive });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product? This will also remove it from all shop configurations.')) {
      deleteProduct(id);
      refresh();
    }
  };

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const countByCategory = (cat: ProductCategory | 'all') =>
    cat === 'all' ? products.length : products.filter(p => p.category === cat).length;

  return (
    <div className="flex gap-6 h-full min-h-0">

      {/* ── Left: Category sidebar ── */}
      <div className="w-56 shrink-0 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Categories</p>
        {CATEGORIES.map(cat => {
          const count = countByCategory(cat.id);
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-[#1E3A5F] text-white shadow-md'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <span className={isActive ? 'text-white' : cat.color}>{cat.icon}</span>
              <span className="flex-1 text-sm font-medium">{cat.label}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        <div className="pt-4">
          <button
            onClick={openCreate}
            className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} /> New Product
          </button>
        </div>
      </div>

      {/* ── Center: Product list ── */}
      <div className={`flex-1 min-w-0 transition-all ${editorOpen ? 'max-w-[calc(100%-22rem)]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">
              {CATEGORIES.find(c => c.id === activeCategory)?.label ?? 'Products'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' && ` · ${CATEGORIES.find(c => c.id === activeCategory)?.description}`}
            </p>
          </div>
        </div>

        {/* Product list */}
        <div className="space-y-3">
          {filtered.map(product => {
            const meta = CATEGORY_META[product.category];
            const isEditing = editProduct?.id === product.id && editorOpen;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isEditing
                    ? 'border-[#2563EB] shadow-md shadow-blue-100'
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Category icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <span className={meta.color}>{meta.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#1E293B] text-sm">{product.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        product.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {product.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{product.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">
                        <span className="font-medium text-[#1E293B]">{product.minPages}</span>
                        {' – '}
                        <span className="font-medium text-[#1E293B]">{product.maxPages}</span>
                        {' '}
                        {product.category === 'business-cards' ? 'units' : 'pages'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(product)}
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-lg transition-colors ${
                        product.isActive
                          ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                          : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
                      }`}
                    >
                      {product.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                    </button>
                    <button
                      onClick={() => isEditing ? setEditorOpen(false) : openEdit(product)}
                      title="Edit"
                      className={`p-2 rounded-lg transition-colors ${
                        isEditing
                          ? 'bg-[#2563EB]/10 text-[#2563EB]'
                          : 'text-gray-400 hover:text-[#2563EB] hover:bg-blue-50'
                      }`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      title="Delete"
                      className="p-2 text-gray-400 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                activeCategory !== 'all' ? CATEGORY_META[activeCategory as ProductCategory]?.bg : 'bg-gray-100'
              }`}>
                {activeCategory !== 'all'
                  ? <span className={CATEGORY_META[activeCategory as ProductCategory]?.color}>
                      {CATEGORY_META[activeCategory as ProductCategory]?.icon}
                    </span>
                  : <Plus size={20} className="text-gray-400" />
                }
              </div>
              <p className="font-semibold text-[#1E293B] text-sm">No products yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">
                {activeCategory === 'all'
                  ? 'Create your first product to get started.'
                  : `No ${CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} products yet.`}
              </p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={14} /> Create Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Slide-in editor panel ── */}
      {editorOpen && (
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col overflow-hidden">
          <EditorPanel
            editProduct={editProduct}
            onSave={handleSave}
            onClose={() => { setEditorOpen(false); setEditProduct(null); }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
