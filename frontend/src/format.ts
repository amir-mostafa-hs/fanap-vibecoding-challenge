export function formatPercent(part: number, total: number): string {
  if (!total) return '0.0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

export function formatCategory(cat: string): string {
  const label = cat.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16);
}
