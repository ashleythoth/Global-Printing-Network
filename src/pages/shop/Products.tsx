import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Settings, ChevronRight, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, getShopProductsByShopId, upsertShopProduct } from '@/lib/store';
import { Product, ProductCategory, PaperType, ShopProduct } from '@/lib/types';
import PaperTypeManager from '@/components/PaperTypeManager';

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
  const [shopProductsMap, setShopProductsMap] = useState<Record<string, ShopProduct>>(() => {
    const sps = getShopProductsByShopId(shopId);
    return Object.fromEntries(sps.map(sp => [sp.productId, sp]));
  });
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);

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

  const handlePaperTypesChange = (productId: string, paperTypes: PaperType[]) => {
    upsertShopProduct(shopId, productId, { paperTypes });
    refreshMap();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Products</h1>
        <p className="text-gray-500 mt-1">Enable products, configure pricing, and set available paper types</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(product => {
          const sp = shopProductsMap[product.id];
          const isEnabled = sp?.isEnabled ?? false;
          const hasPricing = (sp?.pricingTiers?.length ?? 0) > 0;
          const paperTypes = sp?.paperTypes ?? [];
          const meta = CATEGORY_META[product.category];
          const isPaperExpanded = expandedPaper === product.id;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col gap-0 transition-all overflow-hidden ${
                isEnabled ? 'border-[#2563EB]/30' : 'border-gray-100'
              }`}
            >
              {/* Card header */}
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                      <Package size={16} className="text-[#1E3A5F]" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Enable toggle */}
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
              </div>

              {/* Actions when enabled */}
              {isEnabled && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {/* Pricing button */}
                  <button
                    onClick={() => navigate(`/shop/products/${product.id}/pricing`)}
                    className="w-full flex items-center justify-between text-sm font-medium px-5 py-3 hover:bg-[#2563EB]/5 text-[#2563EB] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={14} />
                      {hasPricing ? 'Edit Pricing' : 'Configure Pricing'}
                    </span>
                    <div className="flex items-center gap-2">
                      {!hasPricing && (
                        <span className="text-xs text-orange-500 font-medium">⚠ Required</span>
                      )}
                      <ChevronRight size={14} />
                    </div>
                  </button>

                  {/* Paper types section */}
                  <div>
                    <button
                      onClick={() => setExpandedPaper(isPaperExpanded ? null : product.id)}
                      className="w-full flex items-center justify-between text-sm font-medium px-5 py-3 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Layers size={14} />
                        Paper Types
                        {paperTypes.length > 0 && (
                          <span className="text-xs font-semibold bg-[#1E3A5F]/10 text-[#1E3A5F] px-1.5 py-0.5 rounded-full">
                            {paperTypes.length}
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${isPaperExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {isPaperExpanded && (
                      <div className="px-5 pb-4">
                        {paperTypes.length === 0 && (
                          <p className="text-xs text-gray-400 mb-2">
                            No paper types added yet. Customers will see no paper choice.
                          </p>
                        )}
                        <PaperTypeManager
                          paperTypes={paperTypes}
                          onChange={pts => handlePaperTypesChange(product.id, pts)}
                        />
                      </div>
                    )}
                  </div>
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
