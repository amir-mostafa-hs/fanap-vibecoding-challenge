import { useState } from 'react';
import type { Draft, Message } from '../types';
import { requestDraft } from '../api';
import { useAttentionQueue, type AttentionQueue } from '../useAttentionQueue';

interface Props {
  queue?: AttentionQueue;
  messages?: Message[];
  now?: Date;
}

function describe(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const t = h > 0 ? `${h} ساعت و ${m} دقیقه` : `${m} دقیقه`;
  return minutes > 0 ? `${t} مانده تا نقض تعهد` : `${t} تاخیر (فوری)`;
}

export default function AttentionList({ queue: propQueue, messages = [], now }: Props) {
  const derivedQueue = useAttentionQueue(messages, now);
  const queue = propQueue ?? derivedQueue;

  const [filter, setFilter] = useState<'all' | 'urgent' | 'approaching'>('all');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const filteredItems = queue.items.filter((item) => {
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

  function onApprove(messageId: string) {
    setApproved((prev) => ({ ...prev, [messageId]: true }));
  }

  return (
    <section className="card attention-card">
      <div className="attention-card-header">
        <h2>پیام‌های نیازمند توجه ({queue.totalCount})</h2>
        <div className="attention-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            همه ({queue.totalCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'urgent'}
            className={`tab-btn urgent-tab ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            🚨 فوری و معوق ({queue.urgentCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'approaching'}
            className={`tab-btn approaching-tab ${filter === 'approaching' ? 'active' : ''}`}
            onClick={() => setFilter('approaching')}
          >
            ⏳ در مهلت تعهد ({queue.approachingCount})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="muted">هیچ پیامی در این دسته‌بندی یافت نشد.</p>
      ) : (
        <ul className="attention-list">
          {filteredItems.map(({ id, m, left }) => {
            if (!m) return null;
            const draftState = drafts[id];
            const isApproved = approved[id];
            const isOverdue = left <= 0;

            return (
              <li
                key={id}
                className={`attention-item ${isOverdue ? 'attention-urgent' : 'attention-approaching'}`}
                data-testid="attention-row"
                data-message-id={id}
                data-business-minutes-left={left}
              >
                <div className="attention-summary">
                  <div className="attention-meta">
                    <span className="badge">{m.category}</span>
                    {isOverdue ? (
                      <span className="badge badge-urgent-pill">🚨 فوری (نقض تعهد)</span>
                    ) : (
                      <span className="badge badge-approaching-pill">⏳ در مهلت تعهد</span>
                    )}
                    <span className="time-left">{describe(left)}</span>
                    {m.order_ref && (
                      <span className="order-pill" dir="ltr">
                        سفارش: <strong>{m.order_ref}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="attention-subject">{m.subject || '(بدون عنوان)'}</h3>
                  <p className="attention-snippet">{m.body}</p>
                </div>

                <div className="attention-actions">
                  {!draftState && (
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => onDraft(m)}
                      disabled={busy === id}
                      data-testid="draft-button"
                    >
                      {busy === id ? 'در حال نگارش...' : 'پیش‌نویس هوشمند'}
                    </button>
                  )}
                </div>

                {draftState && (
                  <div className="draft-box">
                    <div className="draft-header">
                      <span>پیش‌نویس پاسخ پشتیبانی ({draftState.language === 'fa' ? 'فارسی' : 'انگلیسی'})</span>
                      {draftState.blocked && (
                        <span className="badge danger" data-testid="draft-warning">
                          {draftState.warnings && draftState.warnings.length > 0
                            ? draftState.warnings.join('، ')
                            : 'نیازمند بررسی اپراتور (حاوی تعهدات مالی یا تاریخ قطعی)'}
                        </span>
                      )}

                    </div>

                    <textarea
                      className="draft-editor"
                      rows={4}
                      value={draftState.draft}
                      disabled={isApproved}
                      data-testid="draft-text"
                      onChange={(e) => {
                        const val = e.target.value;
                        setDrafts((prev) => ({
                          ...prev,
                          [id]: { ...draftState, draft: val },
                        }));
                      }}
                    />

                    <div className="draft-footer">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={busy === id || isApproved}
                        onClick={() => onDraft(m)}
                      >
                        تولید مجدد
                      </button>
                      <button
                        type="button"
                        className={`btn ${isApproved ? 'success' : 'primary'}`}
                        disabled={isApproved}
                        onClick={() => onApprove(id)}
                        data-testid="draft-approve"
                      >
                        {isApproved ? 'تأیید شد ✓' : 'تأیید و ارسال'}
                      </button>
                      <button
                        type="button"
                        className="btn text"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(draftState.draft);
                          }
                        }}
                      >
                        کپی متن
                      </button>
                    </div>
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
