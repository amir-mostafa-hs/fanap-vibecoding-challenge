export function formatPercent(part: number, total: number): string {
  if (!total) return '0.0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

const FA_CATEGORIES: Record<string, string> = {
  delivery: 'تحویل و ارسال',
  payment: 'پرداخت',
  refund: 'مرجوعی و بازگشت وجه',
  product_quality: 'کیفیت کالا',
  account: 'حساب کاربری',
  other: 'سایر',
};

export function formatCategory(cat: string, lang: 'en' | 'fa' = 'en'): string {
  if (lang === 'fa') {
    return FA_CATEGORIES[cat] || cat;
  }
  const label = cat.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16);
}
