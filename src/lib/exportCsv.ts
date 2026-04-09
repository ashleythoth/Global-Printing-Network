import { Job, Product, PrintShop } from './types';

export function exportJobsToCsv(
  jobs: Job[],
  products: Product[],
  shopName: string
): void {
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  const headers = [
    'Job ID',
    'Date',
    'Customer Name',
    'Product',
    'Pages',
    'Copies',
    'Total Cost ($)',
    'Status',
    'Notes',
  ];

  const rows = jobs.map(job => [
    job.id,
    new Date(job.createdAt).toLocaleDateString(),
    job.customerName,
    productMap[job.productId] ?? job.productId,
    job.pages,
    job.copies,
    job.totalCost.toFixed(2),
    job.status,
    job.notes ?? '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row =>
      row.map(cell => {
        const str = String(cell);
        // Wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = `${shopName.replace(/\s+/g, '_')}_orders_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}