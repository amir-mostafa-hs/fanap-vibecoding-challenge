import type { Message } from '../types';
import { formatCategory, formatDate } from '../format';

const MAX_ROWS = 200;

function highlightOrders(text: string): string {
  return text.replace(/BZ-[0-9]+/g, (id) => `<mark class="order-ref">${id}</mark>`);
}

export default function MessagesTable({ messages }: { messages: Message[] }) {
  const rows = messages.slice(0, MAX_ROWS);
  return (
    <section className="card">
      <h2>Messages</h2>
      {messages.length > MAX_ROWS && (
        <p className="muted">Showing first {MAX_ROWS} of {messages.length.toLocaleString()}.</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Category</th><th>Urgent</th><th>Order</th>
              <th>Channel</th><th>Received</th><th>Subject</th><th>Body</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.message_id}>
                <td>{m.message_id}</td>
                <td>{formatCategory(m.category)}</td>
                <td>{m.is_urgent ? 'Yes' : ''}</td>
                <td>{m.order_ref ?? '-'}</td>
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
