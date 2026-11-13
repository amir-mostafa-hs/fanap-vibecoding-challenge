import { formatPercent, formatCategory, formatDate } from './format';

describe('format helpers', () => {
  it('formats percentages', () => {
    expect(formatPercent(1, 4)).toBe('25.0%');
    expect(formatPercent(0, 0)).toBe('0.0%');
  });
  it('formats category labels', () => {
    expect(formatCategory('product_quality')).toBe('Product quality');
  });
  it('formats dates', () => {
    expect(formatDate('2024-03-01T10:15:00Z')).toBe('2024-03-01 10:15');
    expect(formatDate(null)).toBe('-');
  });
});
