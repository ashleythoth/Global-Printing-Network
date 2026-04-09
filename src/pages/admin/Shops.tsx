import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, PowerOff, Power, Trash2, X, Store, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PrintShop } from '@/lib/types';
import { fetchShops, insertShop, patchShop, removeShop } from '@/lib/shopsService';

const emptyForm = { name: '', email: '', phone: '', address: '', password: '' };

const AdminShops: React.FC = () => {
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editShop, setEditShop] = useState<PrintShop | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setShops(await fetchShops());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditShop(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (shop: PrintShop) => {
    setEditShop(shop);
    setForm({ name: shop.name, email: shop.email, phone: shop.phone, address: shop.address, password: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!editShop && !form.password.trim()) e.password = 'Password is required';
    if (!editShop && form.password.length > 0 && form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      if (editShop) {
        await patchShop(editShop.id, {
          name: form.name,
          phone: form.phone,
          address: form.address,
        });
      } else {
        await insertShop({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          status: 'active',
        }, form.password);
      }
      await load();
      setModalOpen(false);
    } catch (e: unknown) {
      setFormErrors({ submit: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (shop: PrintShop) => {
    try {
      await patchShop(shop.id, { status: shop.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this print shop?')) return;
    try {
      await removeShop(id);
      await load();
    } catch {
      setError('Failed to delete shop');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Print Shops</h1>
          <p className="text-gray-500 mt-1">
            {loading ? 'Loading…' : `${shops.length} shop${shops.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Create Shop
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading shops…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Shop</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Contact</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Created</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shops.map(shop => (
                  <tr key={shop.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center shrink-0">
                          <Store size={16} className="text-[#1E3A5F]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E293B]">{shop.name}</p>
                          <p className="text-xs text-gray-400">{shop.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#1E293B]">{shop.email}</p>
                      <p className="text-xs text-gray-400">{shop.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        shop.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(shop)}
                          className="p-1.5 text-gray-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => toggleStatus(shop)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            shop.status === 'active'
                              ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                              : 'text-gray-400 hover:text-[#10B981] hover:bg-green-50'
                          }`}
                          title={shop.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {shop.status === 'active' ? <PowerOff size={15} /> : <Power size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(shop.id)}
                          className="p-1.5 text-gray-400 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No print shops yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editShop ? 'Edit Print Shop' : 'Create Print Shop'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={14} className="shrink-0" />
                  {formErrors.submit}
                </div>
              )}

              {(['name', 'email', 'phone', 'address'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5 capitalize">{field}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    disabled={editShop !== null && field === 'email'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {formErrors[field] && <p className="text-xs text-[#F43F5E] mt-1">{formErrors[field]}</p>}
                </div>
              ))}

              {!editShop && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-[#F43F5E] mt-1">{formErrors.password}</p>}
                </div>
              )}

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
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {editShop ? 'Save Changes' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShops;
