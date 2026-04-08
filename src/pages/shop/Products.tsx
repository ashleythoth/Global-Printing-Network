import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, getShopProductsByShopId, upsertShopProduct } from '@/lib/store';
import { Product, ProductCategory } from '@/lib/types';

const CATEGORY_META: Record<ProductCategory, { label: string; color: string; bg: string }> = {
  'documents': { label: 'Documents', color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
  'business-cards': { label: 'Business Cards', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  'large-format': { label: 'Large Format', color: 'text-purple-600', bg: 'bg-purple-100' },
};

const ShopProducts: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const shopId = currentUser?.shopId ?? '';

  const [products] = useState<Product[]>(getProducts().filter(p => p.isActive));
  const [shopProductsMap, setShopProductsMap] = useState(() => {
    const sps = getShopProductsByShopId(shopId);
    return Object.fromEntries(sps.map(sp => [sp.productId, sp]));
  });

  const refreshMap = () => {
    const sps = getShopProductsByShopId(shopId);
    setShopProductsMap(Object.fromEntries(sps.map(sp => [sp.productId, sp])));
  };

  const toggleProduct = (productId: string) => {
    const current = shopProductsMap[productId];
    const newEnabled = !(current?.isEnabled ?? false);
    upsertShopProduct(shopId, productId, { isEnabled: newEnabled });
    refreshMap();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Products</h1>
        <p className="text-gray-500 mt-1">Enable products and configure pricing for your shop</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(product => {
          const sp = shopProductsMap[product.productId] ?? shopProductsMap[product.id];
          const isEnabled = sp?.isEnabled ?? false;
          const hasPricing = (sp?.pricingTiers?.length ?? 0) > 0;
          const meta = CATEGORY_META[product.category];

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-all ${
                isEnabled ? 'border-[#2563EB]/30' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                    <Package size={16} className="text-[#1E3A5F]" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleProduct(product.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-[#2563EB]' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-[#1E293B]">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
              </div>

              <div className="text-xs text-gray-400 bg-[#F8FAFC] rounded-lg px-3 py-2">
                Pages: <span className="font-semibold text-[#1E293B]">{product.minPages} – {product.maxPages}</span>
              </div>

              {isEnabled && (
                <div className="pt-1 border-t border-gray-50">
                  <button
                    onClick={() => navigate(`/shop/products/${product.id}/pricing`)}
                    className="w-full flex items-center justify-between text-sm font-medium px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#2563EB]/5 text-[#2563EB] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={14} />
                      {hasPricing ? 'Edit Pricing' : 'Configure Pricing'}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                  {!hasPricing && (
                    <p className="text-xs text-orange-500 mt-2 text-center">⚠ No pricing configured yet</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            No active products available from the platform.
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProducts;