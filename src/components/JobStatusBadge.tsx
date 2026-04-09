import React from 'react';
import { JobStatus } from '@/lib/types';

const STATUS_META: Record<JobStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'text-amber-700',  bg: 'bg-amber-50 border border-amber-200',   dot: 'bg-amber-400' },
  'in-progress': { label: 'In Progress', color: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200',     dot: 'bg-blue-500' },
  completed:   { label: 'Completed',   color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   color: 'text-gray-500',   bg: 'bg-gray-100 border border-gray-200',    dot: 'bg-gray-400' },
};

interface JobStatusBadgeProps {
  status: JobStatus;
}

const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

export default JobStatusBadge;