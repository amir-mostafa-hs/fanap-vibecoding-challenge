import { CATEGORIES, type Category } from '../types';
import { formatCategory } from '../format';

interface Props {
  counts: Record<Category, number>;
  total: number;
}

export default function CategoryBreakdown({ counts, total }: Props) {
  return (
    <section className="card">
      <h2>دسته‌بندی پیام‌ها</h2>
      <ul className="breakdown">
        {CATEGORIES.map((cat) => {
          const pct = total ? (counts[cat] / total * 100).toFixed(1) : '0.0';
          return (
            <li key={cat}>
              <span className="cat-name">{formatCategory(cat, 'fa')}</span>
              <span className="bar">
                <span className="bar-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="cat-count">{counts[cat].toLocaleString()}</span>
              <span className="cat-pct">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
