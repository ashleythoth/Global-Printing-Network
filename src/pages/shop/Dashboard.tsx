import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, getShopProductsByShopId, getShopById } from '@/lib/store';

const ShopDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const shopId = currentUser?.shopId ?? '';
  const shop = shopId ? getShopById(shopId) : null;

  const [shopProducts, setShopProducts] = useState(getShopProductsByShopId(shopId));
  const [allProducts, setAllProducts] = useState(getProducts());

  useEffect(() => {
    setShopProducts(getShopProductsByShopId(shopId));
    setAllProducts(getProducts());
  }, [shopId]);

  const enabledCount = shopProducts.filter(sp => sp.isEnabled).length;
  const configuredCount = shopProducts.filter(sp => sp.isEnabled && sp.pricingTiers.length > 0).length;
  const availableCount = allProducts.filter(p => p.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          {shop ? shop.name : 'Shop Dashboard'}
        </h1>
        <p className="text-gray-500 mt-1">Manage your products and pricing</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
          <div className="bg-[#2563EB]/10 rounded-xl p-3">
            <Package size={22} className="text-[#2563EB]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1E293B]">{availableCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Available Products</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
          <div className="bg-[#10B981]/10 rounded-xl p-3">
            <CheckCircle size={22} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1E293B]">{enabledCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Enabled Products</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 rounded-xl p-3">
            <DollarSign size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1E293B]">{configuredCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Pricing Configured</p>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1E293B]">My Products</h2>
          <Package size={20} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm mb-5">
          Enable products from the platform catalog and configure tiered pricing for your shop.
        </p>
        <button
          onClick={() => navigate('/shop/products')}
          className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
        >
          Manage Products <ArrowRight size={16} />
        </button>
      </div>

      {/* Product status list */}
      {allProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1E293B]">Product Status</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {allProducts.filter(p => p.isActive).map(product => {
              const sp = shopProducts.find(s => s.productId === product.id);
              const isEnabled = sp?.isEnabled ?? false;
              const hasPricing = (sp?.pricingTiers.length ?? 0) > 0;
              return (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <p className="font-medium text-[#1E293B]">{product.name}</p>
                  <div className="flex items-center gap-2">
                    {isEnabled && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        hasPricing ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {hasPricing ? 'Configured' : 'No Pricing'}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isEnabled ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;