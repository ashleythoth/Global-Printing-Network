import React, { useState } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { PaperType } from '@/lib/types';

interface PaperTypeManagerProps {
  paperTypes: PaperType[];
  onChange: (paperTypes: PaperType[]) => void;
}

const emptyForm = { name: '', description: '', priceUpcharge: 0 };

const PaperTypeManager: React.FC<PaperTypeManagerProps> = ({ paperTypes, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    const newType: PaperType = {
      id: `pt${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      priceUpcharge: form.priceUpcharge,
    };
    onChange([...paperTypes, newType]);
    setForm(emptyForm);
    setError('');
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(paperTypes.filter(pt => pt.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Existing paper types */}
      {paperTypes.length > 0 && (
        <div className="space-y-1.5">
          {paperTypes.map(pt => (
            <div key={pt.id} className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-100 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1E293B]">{pt.name}</span>
                  {pt.priceUpcharge > 0 && (
                    <span className="text-xs font-medium text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-full">
                      +${pt.priceUpcharge.toFixed(2)}/pg
                    </span>
                  )}
                  {pt.priceUpcharge === 0 && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      No upcharge
                    </span>
                  )}
                </div>
                {pt.description && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{pt.description}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(pt.id)}
                className="text-gray-300 hover:text-[#F43F5E] transition-colors p-1 rounded-lg hover:bg-red-50 shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="border border-[#2563EB]/30 bg-blue-50/30 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="Name (e.g. Gloss)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              {error && <p className="text-xs text-[#F43F5E] mt-1">{error}</p>}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+$</span>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.priceUpcharge}
                onChange={e => setForm(f => ({ ...f, priceUpcharge: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Description (optional, e.g. 130gsm gloss coated)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setForm(emptyForm); setError(''); }}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check size={12} /> Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <Plus size={13} /> Add paper type
        </button>
      )}
    </div>
  );
};

export default PaperTypeManager;
