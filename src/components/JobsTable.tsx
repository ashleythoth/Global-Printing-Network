import React from 'react';
import { Trash2 } from 'lucide-react';
import { Job, JobStatus, PrintShop } from '@/lib/types';
import { getProductById, getShopById } from '@/lib/store';
import JobStatusBadge from './JobStatusBadge';
import JobFilesCell from './JobFilesCell';

const STATUSES: JobStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];

interface JobsTableProps {
  jobs: Job[];
  showShop?: boolean;
  supabaseShops?: PrintShop[];
  onStatusChange?: (id: string, status: JobStatus) => void;
  onDelete?: (id: string) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({ jobs, showShop = false, supabaseShops, onStatusChange, onDelete }) => {
  if (jobs.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-400 text-sm">
        No jobs found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-gray-100">
            {showShop && (
              <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Shop</th>
            )}
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Product</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Pages / Copies</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Files</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Total</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date</th>
            {(onStatusChange || onDelete) && (
              <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map(job => {
            const product = getProductById(job.productId);
            const shop = showShop
              ? (supabaseShops?.find(s => s.id === job.shopId) ?? getShopById(job.shopId))
              : null;
            return (
              <tr key={job.id} className="hover:bg-[#F8FAFC] transition-colors">
                {showShop && (
                  <td className="px-6 py-4 font-medium text-[#1E293B]">
                    {shop?.name ?? '—'}
                  </td>
                )}
                <td className="px-6 py-4">
                  <p className="font-medium text-[#1E293B]">{job.customerName}</p>
                  {job.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{job.notes}</p>}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {product?.name ?? '—'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {job.pages} pg × {job.copies}
                </td>
                <td className="px-6 py-4">
                  <JobFilesCell files={job.files ?? []} />
                </td>
                <td className="px-6 py-4 font-semibold text-[#1E293B]">
                  ${job.totalCost.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(job.createdAt).toLocaleDateString()}
                </td>
                {(onStatusChange || onDelete) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onStatusChange && (
                        <select
                          value={job.status}
                          onChange={e => onStatusChange(job.id, e.target.value as JobStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                          ))}
                        </select>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(job.id)}
                          className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete job"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default JobsTable;