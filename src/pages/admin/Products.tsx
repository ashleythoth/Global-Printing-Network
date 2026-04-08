import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/store';
import { Product, ProductCategory } from '@/lib/types';

const CATEGORY_META: Record<ProductCategory, { label: string; color: string; bg: string }> = {
  'documents': { label: 'Documents', color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
  'business-cards': { label: 'Business Cards', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  'large-format': { label: 'Large Format', color: 'text-purple-600', bg: 'bg-purple-100' },
};

const emptyForm = {
  name: '',
  description: '',
  category: 'documents' as ProductCategory,
  minPages: 1,
  maxPages: 100,
  isActive: true,
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refresh = () => setProducts(getProducts());

  const openCreate = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      minPages: product.minPages,
      maxPages: product.maxPages,
      isActive: product.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.minPages < 1) e.minPages = 'Min pages must be at least 1';
    if (form.maxPages <= form.minPages) e.maxPages = 'Max pages must be greater than min pages';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (editProduct) {
      updateProduct(editProduct.id, form);
    } else {
      createProduct(form);
    }
    refresh();
    setModalOpen(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} defined</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Create Product
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(product => {
          const meta = CATEGORY_META[product.category];
          return (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                    <Package size={16} className="text-[#1E3A5F]" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  product.isActive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-[#1E293B]">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
              </div>

              <div className="text-xs text-gray-400 bg-[#F8FAFC] rounded-lg px-3 py-2">
                Pages: <span className="font-semibold text-[#1E293B]">{product.minPages} – {product.maxPages}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button
                  onClick={() => openEdit(product)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#2563EB] transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => toggleActive(product)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-orange-50"
                >
                  {product.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#F43F5E] transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 ml-auto"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            No products yet. Create one to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editProduct ? 'Edit Product' : 'Create Product'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                {errors.name && <p className="text-xs text-[#F43F5E] mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                />
                {errors.description && <p className="text-xs text-[#F43F5E] mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
                >
                  <option value="documents">Documents</option>
                  <option value="business-cards">Business Cards</option>
                  <option value="large-format">Large Format</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Min Pages</label>
                  <input
                    type="number"
                    min={1}
                    value={form.minPages}
                    onChange={e => setForm(f => ({ ...f, minPages: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  {errors.minPages && <p className="text-xs text-[#F43F5E] mt-1">{errors.minPages}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Max Pages</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxPages}
                    onChange={e => setForm(f => ({ ...f, maxPages: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  {errors.maxPages && <p className="text-xs text-[#F43F5E] mt-1">{errors.maxPages}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#1E293B]">Active</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isActive ? 'bg-[#2563EB]' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors"
                >
                  {editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;