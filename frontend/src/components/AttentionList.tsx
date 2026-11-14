import { useState } from 'react';
import type { Draft, Message } from '../types';
import { requestDraft } from '../api';
import { computeBusinessMinutesLeft } from '../sla';

interface Props {
  ids: string[];
  messages: Message[];
  now?: Date;
}

function describe(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const t = h > 0 ? `${h} ساعت و ${m} دقیقه` : `${m} دقیقه`;
  return minutes > 0 ? `${t} مانده تا نقض تعهد` : `${t} تاخیر (فوری)`;
}

export default function AttentionList({ ids, messages, now = new Date() }: Props) {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'approaching'>('all');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const byId = new Map(messages.map((m) => [m.message_id, m]));

  const itemsWithTime = ids.map((id) => {
    const m = byId.get(id);
    const left = m ? computeBusinessMinutesLeft(m.received_at, now) : 0;
    return { id, m, left };
  });

  const urgentCount = itemsWithTime.filter((item) => item.left <= 0).length;
  const approachingCount = itemsWithTime.filter((item) => item.left > 0).length;

  const filteredItems = itemsWithTime.filter((item) => {
    if (filter === 'urgent') return item.left <= 0;
    if (filter === 'approaching') return item.left > 0;
    return true;
  });

  async function onDraft(m: Message) {
    setBusy(m.message_id);
    try {
      const d = await requestDraft({
        message_id: m.message_id,
        customer_id: m.customer_id,
        subject: m.subject,
        body: m.body,
      });
      setDrafts((prev) => ({ ...prev, [m.message_id]: d }));
    } catch (e) {
      setDrafts((prev) => ({
        ...prev,
        [m.message_id]: {
          message_id: m.message_id,
          draft: '',
          language: 'fa',
          blocked: true,
          warnings: [e instanceof Error ? e.message : 'خطا در ارتباط با سرور'],
        },
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card attention-card">
      <div className="attention-card-header">
        <h2>پیام‌های نیازمند توجه ({ids.length})</h2>
        <div className="attention-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            همه ({ids.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'urgent'}
            className={`tab-btn urgent-tab ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            🚨 فوری و معوق ({urgentCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'approaching'}
            className={`tab-btn approaching-tab ${filter === 'approaching' ? 'active' : ''}`}
            onClick={() => setFilter('approaching')}
          >
            ⏳ در مهلت تعهد ({approachingCount})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="muted">هیچ پیامی در این دسته‌بندی یافت نشد.</p>
      ) : (
        <ul className="attention-list">
          {filteredItems.map(({ id, m, left }) => {
            if (!m) return null;
            const draftData = drafts[id];
            const isApproved = approved[id];
            return (
              <li
                key={id}
                data-testid="attention-row"
                data-message-id={id}
                data-business-minutes-left={left}
                className={left <= 0 ? 'row-urgent' : 'row-approaching'}
              >
                <div className="attention-header">
                  <code>{id}</code>
                  {left <= 0 ? (
                    <span className="badge badge-urgent">🚨 فوری (از موعد گذشته)</span>
                  ) : (
                    <span className="badge badge-approaching">⏳ در مهلت تعهد</span>
                  )}
                  {m.order_ref && <span className="order-badge">{m.order_ref}</span>}
                  <span className="attention-subject" dir="auto">{m.subject}</span>
                </div>
                <div className="attention-meta">
                  دریافت شده در {new Date(m.received_at).toLocaleString('fa-IR')} — {describe(left)}
                </div>
                <div className="attention-actions">
                  <button
                    type="button"
                    data-testid="draft-button"
                    disabled={busy === id}
                    onClick={() => onDraft(m)}
                  >
                    {busy === id ? 'در حال تولید پیش‌نویس...' : 'پیش‌نویس پاسخ هوشمند'}
                  </button>
                </div>
                {draftData && (
                  <div className="draft-section">
                    {draftData.blocked ? (
                      <div className="draft-warning" data-testid="draft-warning">
                        {draftData.warnings && draftData.warnings.length > 0
                          ? draftData.warnings.join(' | ')
                          : 'امکان تولید پیش‌نویس امن برای این پیام وجود ندارد.'}
                      </div>
                    ) : (
                      <div className="draft-editor">
                        <textarea
                          className="draft-text"
                          data-testid="draft-text"
                          rows={4}
                          dir="auto"
                          value={draftData.draft}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [id]: { ...draftData, draft: e.target.value },
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="draft-approve"
                          data-testid="draft-approve"
                          disabled={isApproved}
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(draftData.draft);
                            }
                            setApproved((prev) => ({ ...prev, [id]: true }));
                          }}
                        >
                          {isApproved ? 'تایید شد (کپی شد)' : 'تایید و کپی متن'}
                        </button>
                      </div>
                    )}
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
