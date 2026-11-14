interface Props {
  total: number;
  urgent: number;
  approaching?: number;
  attentionTotal?: number;
}

export default function SummaryTiles({ total, urgent, approaching = 0, attentionTotal = 0 }: Props) {
  return (
    <section className="summary-section">
      <div className="tiles">
        <div className="card tile">
          <div className="tile-label">پیام‌های یکتا (غیرتکراری)</div>
          <div className="tile-value" data-testid="total">{total.toLocaleString()}</div>
          <div className="tile-sub">کل ورودی پالایش‌شده</div>
        </div>
        <div className="card tile urgent" data-testid="urgent-count">
          <div className="tile-label">🚨 فوری (از موعد گذشته)</div>
          <div className="tile-value" data-testid="urgent">{urgent.toLocaleString()}</div>
          <div className="tile-sub">بیش از ۲ ساعت کاری تاخیر</div>
        </div>
        <div className="card tile approaching">
          <div className="tile-label">⏳ در مهلت تعهد (نزدیک موعد)</div>
          <div className="tile-value" data-testid="approaching">{approaching.toLocaleString()}</div>
          <div className="tile-sub">کمتر از ۲ ساعت فرصت باقیمانده</div>
        </div>
        <div className="card tile attention-total">
          <div className="tile-label">📋 کل صف نیازمند توجه</div>
          <div className="tile-value" data-testid="attention-total">{attentionTotal.toLocaleString()}</div>
          <div className="tile-sub">پیام‌های با اولویت بالا و بی‌پاسخ</div>
        </div>
      </div>
      {attentionTotal > 0 && (
        <div className="tiles-context-note">
          💡 <strong>راهنما:</strong> از مجموع {attentionTotal.toLocaleString()} پیام با اولویت بالا و بی‌پاسخ،{' '}
          <strong>{urgent.toLocaleString()} پیام</strong> مهلت ۲ ساعته تعهد کاری را رد کرده و <strong>فوری</strong> هستند، و{' '}
          <strong>{approaching.toLocaleString()} پیام</strong> هنوز در مهلت قانونی پاسخگویی قرار دارند.
        </div>
      )}
    </section>
  );
}
