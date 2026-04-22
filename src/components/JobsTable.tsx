import React from 'react';
import { Trash2, FileText, Camera } from 'lucide-react';
import { Job, JobStatus, PrintShop } from '@/lib/types';
import { getProductById, getShopById } from '@/lib/store';
import { useLanguage } from '@/context/LanguageContext';
import JobStatusBadge from './JobStatusBadge';
import JobFilesCell from './JobFilesCell';

interface JobsTableProps {
  jobs: Job[];
  showShop?: boolean;
  supabaseShops?: PrintShop[];
  onStatusChange?: (id: string, status: JobStatus) => void;
  onDelete?: (id: string) => void;
}

function jobSummary(job: Job): string {
  const product = getProductById(job.productId);
  if (product?.printType === 'photo') {
    return [job.photoSize, job.photoFinish, job.quantity ? `×${job.quantity}` : ''].filter(Boolean).join(' · ');
  }
  return [
    job.pages ? `${job.pages} pg` : '',
    job.copies ? `×${job.copies}` : '',
    job.colorMode ?? '',
    job.sides ?? '',
  ].filter(Boolean).join(' · ');
}

const JobsTable: React.FC<JobsTableProps> = ({ jobs, showShop = false, supabaseShops, onStatusChange, onDelete }) => {
  const { t } = useLanguage();

  const STATUSES: { value: JobStatus; label: string }[] = [
    { value: 'pending', label: t('jobs_status_pending') },
    { value: 'in-progress', label: t('jobs_status_in_progress') },
    { value: 'completed', label: t('jobs_status_completed') },
    { value: 'cancelled', label: t('jobs_status_cancelled') },
  ];

  if (jobs.length === 0) {
    return <div className="px-6 py-12 text-center text-gray-400 text-sm">{t('jobs_no_jobs')}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-gray-100">
            {showShop && <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_shop')}</th>}
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_customer')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_product')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_details')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_files')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_total')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_status')}</th>
            <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_date')}</th>
            {(onStatusChange || onDelete) && <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">{t('jobs_col_actions')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map(job => {
            const product = getProductById(job.productId);
            const isPhoto = product?.printType === 'photo';
            const shop = showShop
              ? (supabaseShops?.find(s => s.id === job.shopId) ?? getShopById(job.shopId))
              : null;

            return (
              <tr key={job.id} className="hover:bg-[#F8FAFC] transition-colors">
                {showShop && <td className="px-6 py-4 font-medium text-[#1E293B]">{shop?.name ?? '—'}</td>}

                <td className="px-6 py-4">
                  <p className="font-medium text-[#1E293B]">{job.customerName}</p>
                  {job.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{job.notes}</p>}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`shrink-0 ${isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}`}>
                      {isPhoto ? <Camera size={13} /> : <FileText size={13} />}
                    </span>
                    <span className="text-gray-600 text-xs">{product?.name ?? '—'}</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-xs text-gray-600">{jobSummary(job)}</p>
                  {job.paperType && (
                    <span className="text-xs font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      {job.paperType}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4"><JobFilesCell files={job.files ?? []} /></td>

                <td className="px-6 py-4 font-semibold text-[#1E293B]">${job.totalCost.toFixed(2)}</td>

                <td className="px-6 py-4"><JobStatusBadge status={job.status} /></td>

                <td className="px-6 py-4 text-gray-500 text-xs">{new Date(job.createdAt).toLocaleDateString()}</td>

                {(onStatusChange || onDelete) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onStatusChange && (
                        <select value={job.status} onChange={e => onStatusChange(job.id, e.target.value as JobStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer">
                          {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(job.id)}
                          className="p-1.5 text-gray-300 hover:text-[#F43F5E] hover:bg-red-50 rounded-lg transition-colors">
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
