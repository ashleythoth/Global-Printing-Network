import React, { useState, useRef } from 'react';
import { X, Download, FileText, Image, Printer, Package, Loader2, ExternalLink } from 'lucide-react';
import { SupabaseOrder } from '@/lib/ordersService';
import { supabase } from '@/integrations/supabase/client';

interface WorkOrderModalProps {
  order: SupabaseOrder;
  shopName: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: '#d97706' },
  ready:       { label: 'Ready',       color: '#2563EB' },
  completed:   { label: 'Completed',   color: '#059669' },
  cancelled:   { label: 'Cancelled',   color: '#6b7280' },
  SUBMITTED:   { label: 'Pending',     color: '#d97706' },
  IN_PROGRESS: { label: 'Ready',       color: '#2563EB' },
  COMPLETED:   { label: 'Completed',   color: '#059669' },
  CANCELLED:   { label: 'Cancelled',   color: '#6b7280' },
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'tif'].includes(ext)) {
    return <Image size={15} className="text-purple-500" />;
  }
  return <FileText size={15} className="text-[#2563EB]" />;
}

// Try to get a signed URL from both buckets
async function getSignedUrl(filePath: string): Promise<string | null> {
  const buckets = ['print-orders', 'job-files'];
  for (const bucket of buckets) {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (data?.signedUrl) return data.signedUrl;
  }
  return null;
}

// Try public URL from both buckets
function getPublicUrl(filePath: string, bucket: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ order, shopName, onClose }) => {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const isPhoto = order.product_print_type === 'photo';
  const statusMeta = STATUS_LABELS[order.status] ?? STATUS_LABELS['pending'];
  const orderNum = order.id.slice(0, 8).toUpperCase();

  const specs = isPhoto
    ? [
        { label: 'Print Size', value: order.size },
        { label: 'Finish', value: order.finish },
        { label: 'Quantity', value: String(order.total_quantity) },
      ]
    : [
        { label: 'Pages', value: String(order.total_quantity) },
        { label: 'Copies', value: String(order.copies) },
        { label: 'Color', value: order.color_mode },
        { label: 'Sides', value: order.sides },
        { label: 'Size', value: order.size || '8.5x11' },
        { label: 'Finish', value: order.finish || 'Standard' },
      ].filter(s => s.value && s.value !== '0');

  const handleDownloadFile = async (filePath: string) => {
    setDownloadingFile(filePath);
    try {
      const url = await getSignedUrl(filePath);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() ?? filePath;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Fallback: try public URL
        const pubUrl = getPublicUrl(filePath, 'print-orders');
        window.open(pubUrl, '_blank');
      }
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const filePath of order.file_paths) {
        await handleDownloadFile(filePath);
        // Small delay between downloads so browser doesn't block them
        await new Promise(r => setTimeout(r, 400));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#1E3A5F]/10 rounded-xl p-2">
              <Package size={18} className="text-[#1E3A5F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Work Order</h2>
              <p className="text-xs text-gray-400">#{orderNum}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#1E293B] border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div ref={printRef} className="p-6 space-y-5 print:p-8">

            {/* Invoice header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <img src="/logo.png" alt="GPN" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="text-sm font-bold text-[#1E3A5F]">Global Printing Network</span>
                </div>
                <p className="text-xs text-gray-400">{shopName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Work Order</p>
                <p className="text-xl font-bold text-[#1E293B]">#{orderNum}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Status bar */}
            <div
              className="rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ backgroundColor: `${statusMeta.color}15`, border: `1px solid ${statusMeta.color}30` }}
            >
              <span className="text-sm font-semibold" style={{ color: statusMeta.color }}>
                Status: {statusMeta.label}
              </span>
              <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Product & specs */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={isPhoto ? 'text-purple-500' : 'text-[#2563EB]'}>
                  {isPhoto ? <Image size={16} /> : <FileText size={16} />}
                </span>
                <p className="font-bold text-[#1E293B]">{order.product_name}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-[#1E293B]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-[#1E3A5F] rounded-2xl px-5 py-4">
              <span className="text-white/80 font-medium">Order Total</span>
              <span className="text-2xl font-bold text-white">${Number(order.total_price).toFixed(2)}</span>
            </div>

            {/* Files section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#1E293B]">
                  Attached Files
                  <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {order.file_paths?.length ?? 0}
                  </span>
                </p>
                {(order.file_paths?.length ?? 0) > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloadingAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {downloadingAll
                      ? <><Loader2 size={12} className="animate-spin" /> Downloading…</>
                      : <><Download size={12} /> Download All</>
                    }
                  </button>
                )}
              </div>

              {(!order.file_paths || order.file_paths.length === 0) ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-center text-sm text-gray-400">
                  No files attached to this order.
                </div>
              ) : (
                <div className="space-y-2">
                  {order.file_paths.map((filePath, idx) => {
                    const fileName = filePath.split('/').pop() ?? filePath;
                    const isDownloading = downloadingFile === filePath;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-[#F8FAFC] border border-gray-100 rounded-xl px-4 py-3"
                      >
                        <div className="shrink-0">{getFileIcon(fileName)}</div>
                        <span className="flex-1 text-sm text-[#1E293B] font-medium truncate">{fileName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Open in new tab */}
                          <button
                            onClick={async () => {
                              const url = await getSignedUrl(filePath);
                              if (url) window.open(url, '_blank');
                              else window.open(getPublicUrl(filePath, 'print-orders'), '_blank');
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open"
                          >
                            <ExternalLink size={14} />
                          </button>
                          {/* Download */}
                          <button
                            onClick={() => handleDownloadFile(filePath)}
                            disabled={isDownloading}
                            className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isDownloading
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Download size={12} />
                            }
                            {isDownloading ? 'Saving…' : 'Download'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order ID footer */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <p className="text-xs text-gray-300">Order ID: {order.id}</p>
              <p className="text-xs text-gray-300">Generated {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .fixed { position: static !important; background: none !important; }
          .fixed > div { box-shadow: none !important; max-height: none !important; border-radius: 0 !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default WorkOrderModal;
