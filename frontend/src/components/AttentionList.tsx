import { useState } from 'react';
import type { Message } from '../types';
import { requestDraft } from '../api';

interface Props {
  ids: string[];
  messages: Message[];
}

function minutesLeft(receivedAt: string): number {
  const elapsed = (Date.now() - Date.parse(receivedAt)) / 60000;
  return Math.round(120 - elapsed);
}

function describe(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const t = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return minutes > 0 ? `${t} left` : `overdue by ${t}`;
}

export default function AttentionList({ ids, messages }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const byId = new Map(messages.map((m) => [m.message_id, m]));

  async function onDraft(m: Message) {
    setBusy(m.message_id);
    try {
      const d = await requestDraft({
        message_id: m.message_id,
        customer_id: m.customer_id,
        subject: m.subject,
        body: m.body,
      });
      setDrafts((prev) => ({ ...prev, [m.message_id]: d.draft }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card">
      <h2>Needs attention ({ids.length})</h2>
      {ids.length === 0 ? (
        <p className="muted">Nothing needs attention.</p>
      ) : (
        <ul className="attention-list">
          {ids.map((id) => {
            const m = byId.get(id);
            if (!m) return null;
            const left = minutesLeft(m.received_at);
            return (
              <li
                key={id}
                data-testid="attention-row"
                data-message-id={id}
                data-business-minutes-left={left}
              >
                <code>{id}</code> <span dir="auto">{m.subject}</span>
                <div className="attention-meta">
                  Received {new Date(m.received_at).toLocaleString()} - {describe(left)}
                </div>
                <button
                  type="button"
                  data-testid="draft-button"
                  disabled={busy === id}
                  onClick={() => onDraft(m)}
                >
                  {busy === id ? 'Drafting...' : 'Draft reply'}
                </button>
                {drafts[id] !== undefined && (
                  <div className="draft-box" dir="auto" data-testid="draft-text">
                    {drafts[id]}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
