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
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
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
    <section className="card">
      <h2>پیام‌های نیازمند توجه ({ids.length})</h2>
      {ids.length === 0 ? (
        <p className="muted">هیچ پیامی نیازمند توجه فوری نیست.</p>
      ) : (
        <ul className="attention-list">
          {ids.map((id) => {
            const m = byId.get(id);
            if (!m) return null;
            const left = computeBusinessMinutesLeft(m.received_at, now);
            const draftData = drafts[id];
            return (
              <li
                key={id}
                data-testid="attention-row"
                data-message-id={id}
                data-business-minutes-left={left}
              >
                <div className="attention-header">
                  <code>{id}</code>
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
                          dir={draftData.language === 'en' ? 'ltr' : 'rtl'}
                          value={draftData.draft}
                          rows={4}
                          onChange={(e) => {
                            const newText = e.target.value;
                            setDrafts((prev) => ({
                              ...prev,
                              [id]: { ...prev[id], draft: newText },
                            }));
                          }}
                        />
                        <button
                          type="button"
                          className="draft-approve"
                          data-testid="draft-approve"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                              navigator.clipboard.writeText(draftData.draft);
                            }
                            setApproved((prev) => ({ ...prev, [id]: true }));
                          }}
                        >
                          {approved[id] ? 'کپی شد ✓' : 'تایید و کپی متن'}
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
