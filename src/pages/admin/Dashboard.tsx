import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, CheckCircle, TrendingUp, ArrowRight, Briefcase, DollarSign, Clock } from 'lucide-react';
import { getShops, getProducts, getJobs, updateJobStatus, deleteJob } from '@/lib/store';
import { JobStatus } from '@/lib/types';
import JobsTable from '@/components/JobsTable';

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
}> = ({ label, value, icon, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
    <div className={`${bg} rounded-xl p-3`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const shops = getShops();
  const products = getProducts();
  const [jobs, setJobs] = useState(() => getJobs());
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const activeShops = shops.filter(s => s.status === 'active').length;
  const activeProducts = products.filter(p => p.isActive).length;
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'in-progress');
  const totalRevenue = jobs.filter(j => j.status === 'completed').reduce((s, j) => s + j.totalCost, 0);

  const displayedJobs = activeTab === 'pending' ? pendingJobs : jobs;

  const refreshJobs = () => setJobs(getJobs());

  const handleStatusChange = (id: string, status: JobStatus) => {
    updateJobStatus(id, status);
    refreshJobs();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this job?')) {
      deleteJob(id);
      refreshJobs();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Shops"
          value={activeShops}
          icon={<Store size={20} className="text-[#1E3A5F]" />}
          bg="bg-[#1E3A5F]/10"
        />
        <StatCard
          label="Active Products"
          value={activeProducts}
          icon={<Package size={20} className="text-[#2563EB]" />}
          bg="bg-[#2563EB]/10"
        />
        <StatCard
          label="Active Jobs"
          value={pendingJobs.length}
          icon={<Clock size={20} className="text-amber-500" />}
          bg="bg-amber-50"
        />
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          icon={<DollarSign size={20} className="text-emerald-500" />}
          bg="bg-emerald-50"
        />
      </div>

      {/* Jobs Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E293B]">Print Jobs</h2>
          <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-[#1E293B] shadow-sm'
                  : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              Active
              {pendingJobs.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#1E293B] shadow-sm'
                  : 'text-gray-500 hover:text-[#1E293B]'
              }`}
            >
              All Jobs
            </button>
          </div>
        </div>

        <JobsTable
          jobs={displayedJobs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          showShop
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">Print Shops</p>
            <p className="text-sm text-gray-500 mt-0.5">{shops.length} registered · {activeShops} active</p>
          </div>
          <button
            onClick={() => navigate('/admin/shops')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Manage <ArrowRight size={15} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1E293B]">Products</p>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} total · {activeProducts} active</p>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            Manage <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;