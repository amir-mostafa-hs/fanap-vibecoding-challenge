import type { Message } from '../types';
import { formatCategory, formatDate } from '../format';

const MAX_ROWS = 200;

function highlightOrders(text: string): string {
  return text.replace(/BZ-[0-9۰-۹٠-٩]+/gi, (id) => `<mark class="order-ref">${id}</mark>`);
}

export default function MessagesTable({ messages }: { messages: Message[] }) {
  const rows = messages.slice(0, MAX_ROWS);
  return (
    <section className="card">
      <h2>فهرست پیام‌ها</h2>
      {messages.length > MAX_ROWS && (
        <p className="muted">نمایش {MAX_ROWS} پیام اول از مجموع {messages.length.toLocaleString()} پیام.</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>دسته‌بندی</th>
              <th>فوری</th>
              <th>سفارش</th>
              <th>کانال</th>
              <th>دریافت</th>
              <th>موضوع</th>
              <th>متن پیام</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.message_id}>
                <td><code>{m.message_id}</code></td>
                <td>{formatCategory(m.category, 'fa')}</td>
                <td>{m.is_urgent ? <span className="urgent-badge">فوری</span> : '-'}</td>
                <td>{m.order_ref ? <code>{m.order_ref}</code> : '-'}</td>
                <td>{m.channel}</td>
                <td>{formatDate(m.received_at)}</td>
                <td dir="auto">{m.subject}</td>
                <td dir="auto" className="body-cell" dangerouslySetInnerHTML={{ __html: highlightOrders(m.body) }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
