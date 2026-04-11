import React, { useState } from 'react';
import { Product, PhotoSize, PhotoFinish, PhotoPriceEntry, PHOTO_SIZE_LABELS, PHOTO_FINISH_LABELS } from '@/lib/types';

interface PhotoPricingManagerProps {
  product: Product;
  photoPrices: PhotoPriceEntry[];
  onChange: (prices: PhotoPriceEntry[]) => void;
}

const PhotoPricingManager: React.FC<PhotoPricingManagerProps> = ({ product, photoPrices, onChange }) => {
  const sizes = product.sizes ?? [];
  const finishes = product.finishes ?? [];

  const getPrice = (size: PhotoSize, finish: PhotoFinish): string => {
    const entry = photoPrices.find(p => p.size === size && p.finish === finish);
    return entry ? entry.priceEach.toFixed(2) : '';
  };

  const setPrice = (size: PhotoSize, finish: PhotoFinish, value: string) => {
    const num = parseFloat(value);
    const filtered = photoPrices.filter(p => !(p.size === size && p.finish === finish));
    if (!isNaN(num) && num > 0) {
      onChange([...filtered, { size, finish, priceEach: num }]);
    } else {
      onChange(filtered);
    }
  };

  if (sizes.length === 0 || finishes.length === 0) {
    return <p className="text-xs text-gray-400">No sizes or finishes defined for this product.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Enter the price per print for each size and finish combination. Leave blank to disable that combination.</p>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-100">Size</th>
              {finishes.map(f => (
                <th key={f} className="text-center px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-100 min-w-[80px]">
                  {PHOTO_FINISH_LABELS[f]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sizes.map(size => (
              <tr key={size} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-3 py-2.5 font-semibold text-[#1E293B]">{PHOTO_SIZE_LABELS[size]}</td>
                {finishes.map(finish => {
                  const val = getPrice(size, finish);
                  return (
                    <td key={finish} className="px-2 py-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={val}
                          placeholder="—"
                          onChange={e => setPrice(size, finish, e.target.value)}
                          className={`w-full pl-5 pr-2 py-1.5 rounded-lg border text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-center ${
                            val ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200 bg-white'
                          }`}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {photoPrices.length} of {sizes.length * finishes.length} combinations priced
      </p>
    </div>
  );
};

export default PhotoPricingManager;
