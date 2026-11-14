import { useState, useEffect, useMemo } from 'react';
import { analyzeStream } from './api';
import type { AnalyzeResult, Message, AnalysisProgress } from './types';
import UploadForm from './components/UploadForm';
import SummaryTiles from './components/SummaryTiles';
import CategoryBreakdown from './components/CategoryBreakdown';
import AttentionList from './components/AttentionList';
import MessagesTable from './components/MessagesTable';
import { computeBusinessMinutesLeft } from './sla';

export default function App() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixedNow, setFixedNow] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Update clock every 30 seconds for live countdowns without network/LLM requests
  useEffect(() => {
    const timer = setInterval(() => {
      if (!fixedNow) {
        setCurrentTime(new Date());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [fixedNow]);

  async function handleSubmit(file: File, now?: string) {
    setLoading(true);
    setError(null);
    setProgress({ step: 'init', progress: 5, message: 'ارسال فایل اکسپورت به سرور...' });
    try {
      const res = await analyzeStream(file, now, (evt) => {
        setProgress(evt);
      });
      setResult(res);
      if (now) {
        const parsed = new Date(now);
        setFixedNow(parsed);
        setCurrentTime(parsed);
      } else {
        setFixedNow(null);
        setCurrentTime(new Date());
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort the single "Needs Attention" list:
  // Every high-severity message that is not a resend (duplicate_of === null)
  // and has not been answered yet (answered_at is null or empty).
  // Sorted: most overdue message goes at the top (lowest/most negative business minutes left),
  // followed by those closest to breaching.
  const { attentionMessages, attentionIds, urgentCount } = useMemo(() => {
    if (!result) return { attentionMessages: [], attentionIds: [], urgentCount: 0 };

    const candidates = result.messages.filter((m: Message) => {
      const isHigh = (m.severity_hint || m.severity) === 'high';
      const isCanonical = !m.duplicate_of;
      const isUnanswered = !m.answered_at;
      return isHigh && isCanonical && isUnanswered;
    });

    const withMinutes = candidates.map((m) => ({
      message: m,
      minutesLeft: computeBusinessMinutesLeft(m.received_at, currentTime, 2.0),
    }));

    withMinutes.sort((a, b) => a.minutesLeft - b.minutesLeft);

    const sortedMessages = withMinutes.map((item) => item.message);
    const sortedIds = sortedMessages.map((m) => m.message_id);
    const overdueCount = withMinutes.filter((item) => item.minutesLeft <= 0).length;

    return {
      attentionMessages: sortedMessages,
      attentionIds: sortedIds,
      urgentCount: overdueCount,
    };
  }, [result, currentTime]);

  return (
    <main className="container" dir="rtl">
      <h1>داشبورد تریاژ پشتیبانی بازارچه</h1>
      <p className="muted">فایل اکسپورت روزانه پیام‌های پشتیبانی را برای تحلیل و اولویت‌بندی بارگذاری کنید.</p>
      <UploadForm onSubmit={handleSubmit} loading={loading} progress={progress} />
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <SummaryTiles
            total={result.total_unique_messages}
            urgent={urgentCount}
            approaching={attentionMessages.length - urgentCount}
            attentionTotal={attentionMessages.length}
          />
          <CategoryBreakdown counts={result.category_counts} total={result.total_unique_messages} />
          <AttentionList ids={attentionIds} messages={attentionMessages} now={currentTime} />
          <MessagesTable messages={result.messages} />
        </>
      )}
    </main>
  );
}
