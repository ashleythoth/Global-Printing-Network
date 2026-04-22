import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, CheckCircle, ArrowRight, Plus, Clock, Briefcase, Download, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getProducts,
  getShopProductsByShopId,
  getShopById,
  getJobsByShopId,
  updateJobStatus,
  deleteJob,
} from '@/lib/store';
import { JobStatus } from '@/lib/types';
import JobsTable from '@/components/JobsTable';
import CreateJobModal from '@/components/CreateJobModal';
import { exportJobsToCsv } from '@/lib/exportCsv';

const ShopDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const shopId = currentUser?.shopId ?? '';
  const shop = shopId ? getShopById(shopId) : null;

  const [jobs, setJobs] = useState(() => getJobsByShopId(shopId));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const allProducts = getProducts();
  const shopProducts = getShopProductsByShopId(shopId);

  const enabledCount = shopProducts.filter(sp => sp.isEnabled).length;
  const configuredCount = shopProducts.filter(sp => sp.isEnabled && sp.pricingTiers.length > 0).length;

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'in-progress');
  const displayedJobs = activeTab === 'pending' ? pendingJobs : jobs;

  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + j.totalCost, 0);

  const refreshJobs = () => setJobs(getJobsByShopId(shopId));

  const handleStatusChange = (id: string, status: JobStatus) => {
    updateJobStatus(id, status);
    refreshJobs();
  };

  const handleDelete = (id: string) => {
    if (confirm(t('shop_dash_delete_job_confirm'))) {
      deleteJob(id);
      refreshJobs();
    }
  };

  const handleExport = () => {
    const jobsToExport = activeTab === 'pending' ? pendingJobs : jobs;
    exportJobsToCsv(
      jobsToExport.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      allProducts,
      shop?.name ?? 'Shop'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            {shop ? shop.name : t('nav_dashboard')}
          </h1>
          <p className="text-gray-500 mt-1">{t('shop_dash_subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> {t('shop_dash_new_job')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-amber-50 rounded-xl p-2.5"><Clock size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{pendingJobs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_active_jobs')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-emerald-50 rounded-xl p-2.5"><DollarSign size={20} className="text-emerald-500" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">${totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_revenue')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-[#2563EB]/10 rounded-xl p-2.5"><Briefcase size={20} className="text-[#2563EB]" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{jobs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_total_jobs')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
          <div className="bg-[#10B981]/10 rounded-xl p-2.5"><CheckCircle size={20} className="text-[#10B981]" /></div>
          <div>
            <p className="text-2xl font-bold text-[#1E293B]">{configuredCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('shop_dash_products_ready')}</p>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pending' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              {t('shop_dash_tab_active')}
              {pendingJobs.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              {t('shop_dash_tab_all')}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={displayedJobs.length === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1E293B] border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> {t('shop_dash_export_csv')}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              <Plus size={14} /> {t('shop_dash_add_job')}
            </button>
          </div>
        </div>

        <JobsTable
          jobs={displayedJobs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">{t('shop_dash_product_catalog')}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('shop_dash_catalog_sub')
                .replace('{enabled}', String(enabledCount))
                .replace('{configured}', String(configuredCount))}
            </p>
          </div>
          <button
            onClick={() => navigate('/shop/products')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            {t('shop_dash_manage')} <ArrowRight size={15} />
          </button>
        </div>
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2.5">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{t('shop_dash_earnings')}</p>
              <p className="text-sm text-white/70 mt-0.5">
                {t('shop_dash_earnings_sub').replace('{revenue}', totalRevenue.toFixed(2))}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/shop/earnings')}
            className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
          >
            {t('shop_dash_view')} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateJobModal
          shopId={shopId}
          products={allProducts.filter(p => p.isActive)}
          shopProducts={shopProducts}
          onClose={() => setShowCreateModal(false)}
          onCreated={refreshJobs}
        />
      )}
    </div>
  );
};

export default ShopDashboard;
