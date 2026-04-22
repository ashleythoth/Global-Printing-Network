import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Camera, ChevronRight, Layers, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProducts, getShopProductsByShopId, upsertShopProduct } from '@/lib/store';
import {
  Product, PaperType, ShopProduct, PhotoPriceEntry,
  COLOR_MODE_LABELS, SIDES_LABELS, PHOTO_SIZE_LABELS,
} from '@/lib/types';
import PaperTypeManager from '@/components/PaperTypeManager';
import PhotoPricingManager from '@/components/PhotoPricingManager';

const ShopProducts: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const shopId = currentUser?.shopId ?? '';

  const [products] = useState<Product[]>(getProducts().filter(p => p.isActive));
  const [shopProductsMap, setShopProductsMap] = useState<Record<string, ShopProduct>>(() => {
    const sps = getShopProductsByShopId(shopId);
    return Object.fromEntries(sps.map(sp => [sp.productId, sp]));
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const refreshMap = () => {
    const sps = getShopProductsByShopId(shopId);
    setShopProductsMap(Object.fromEntries(sps.map(sp => [sp.productId, sp])));
  };

  const toggleProduct = (productId: string) => {
    const current = shopProductsMap[productId];
    upsertShopProduct(shopId, productId, { isEnabled: !(current?.isEnabled ?? false) });
    refreshMap();
  };

  const handlePaperTypesChange = (productId: string, paperTypes: PaperType[]) => {
    upsertShopProduct(shopId, productId, { paperTypes });
    refreshMap();
  };

  const handlePhotoPricesChange = (productId: string, photoPrices: PhotoPriceEntry[]) => {
    upsertShopProduct(shopId, productId, { photoPrices });
    refreshMap();
  };

  const docs = products.filter(p => p.printType === 'document');
  const photos = products.filter(p => p.printType === 'photo');

  const renderSection = (titleKey: 'shop_prod_documents' | 'shop_prod_photos', icon: React.ReactNode, items: Product[], color: string) => {
    const title = t(titleKey);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <h2 className="text-base font-bold text-[#1E293B]">{title}</h2>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>

        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
            {t('shop_prod_no_products').replace('{type}', title.toLowerCase())}
          </div>
        )}

        {items.map(product => {
          const sp = shopProductsMap[product.id];
          const isEnabled = sp?.isEnabled ?? false;
          const isDoc = product.printType === 'document';
          const hasPricing = isDoc
            ? (sp?.pricingTiers?.length ?? 0) > 0
            : (sp?.photoPrices?.length ?? 0) > 0;
          const sectionKey = `${product.id}-paper`;
          const pricingKey = `${product.id}-photo-pricing`;

          return (
            <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${
              isEnabled ? 'border-[#2563EB]/30 shadow-sm' : 'border-gray-100'
            }`}>
              {/* Product header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDoc ? 'bg-[#2563EB]/10' : 'bg-purple-100'
                }`}>
                  {isDoc
                    ? <FileText size={18} className="text-[#2563EB]" />
                    : <Camera size={18} className="text-purple-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1E293B] text-sm">{product.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {isDoc && (
                      <>
                        {(product.colorModes ?? []).map(m => (
                          <span key={m} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{COLOR_MODE_LABELS[m]}</span>
                        ))}
                        {(product.sides ?? []).map(s => (
                          <span key={s} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{SIDES_LABELS[s]}</span>
                        ))}
                        <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                          {product.minPages}–{product.maxPages} {t('shop_prod_pages')}
                        </span>
                      </>
                    )}
                    {!isDoc && (product.sizes ?? []).map(s => (
                      <span key={s} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{PHOTO_SIZE_LABELS[s]}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isEnabled && !hasPricing && (
                    <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                      {t('shop_prod_needs_pricing')}
                    </span>
                  )}
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
              </div>

              {/* Expanded config when enabled */}
              {isEnabled && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {isDoc && (
                    <button
                      onClick={() => navigate(`/shop/products/${product.id}/pricing`)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#2563EB]/5 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-[#2563EB]">
                        <DollarSign size={14} />
                        {hasPricing ? t('shop_prod_edit_tiered') : t('shop_prod_setup_tiered')}
                      </span>
                      <ChevronRight size={14} className="text-[#2563EB]" />
                    </button>
                  )}

                  {isDoc && (
                    <div>
                      <button
                        onClick={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <Layers size={14} />
                          {t('shop_prod_paper_types')}
                          {(sp?.paperTypes?.length ?? 0) > 0 && (
                            <span className="text-xs font-bold bg-[#1E3A5F]/10 text-[#1E3A5F] px-1.5 py-0.5 rounded-full">
                              {sp!.paperTypes.length}
                            </span>
                          )}
                        </span>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${expandedSection === sectionKey ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedSection === sectionKey && (
                        <div className="px-5 pb-4">
                          <PaperTypeManager
                            paperTypes={sp?.paperTypes ?? []}
                            onChange={pts => handlePaperTypesChange(product.id, pts)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!isDoc && (
                    <div>
                      <button
                        onClick={() => setExpandedSection(expandedSection === pricingKey ? null : pricingKey)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-purple-50/50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-purple-600">
                          <DollarSign size={14} />
                          {hasPricing ? t('shop_prod_edit_photo') : t('shop_prod_setup_photo')}
                          {hasPricing && (
                            <span className="text-xs font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                              {sp!.photoPrices.length} {t('shop_prod_combos')}
                            </span>
                          )}
                        </span>
                        <ChevronRight size={14} className={`text-purple-400 transition-transform ${expandedSection === pricingKey ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedSection === pricingKey && (
                        <div className="px-5 pb-4">
                          <PhotoPricingManager
                            product={product}
                            photoPrices={sp?.photoPrices ?? []}
                            onChange={prices => handlePhotoPricesChange(product.id, prices)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">{t('shop_prod_title')}</h1>
        <p className="text-gray-500 mt-1">{t('shop_prod_subtitle')}</p>
      </div>

      {renderSection('shop_prod_documents', <FileText size={18} />, docs, 'text-[#2563EB]')}
      {renderSection('shop_prod_photos', <Camera size={18} />, photos, 'text-purple-600')}
    </div>
  );
};

export default ShopProducts;
