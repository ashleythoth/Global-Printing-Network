import React, { useState } from 'react';
import { FileText, Image, Download, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { JobFile } from '@/lib/types';

interface JobFilesCellProps {
  files: JobFile[];
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) {
    return <Image size={12} className="text-blue-500 shrink-0" />;
  }
  return <FileText size={12} className="text-orange-500 shrink-0" />;
}

const JobFilesCell: React.FC<JobFilesCellProps> = ({ files }) => {
  const [expanded, setExpanded] = useState(false);

  if (!files || files.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
      >
        <Paperclip size={12} />
        {files.length} file{files.length !== 1 ? 's' : ''}
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <ul className="space-y-1 pl-1">
          {files.map((file, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              {fileIcon(file.name)}
              <span className="text-xs text-[#1E293B] truncate max-w-[120px]">{file.name}</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.name}
                className="text-gray-400 hover:text-[#2563EB] transition-colors"
                title="Download"
              >
                <Download size={11} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobFilesCell;