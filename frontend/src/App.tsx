import { useState, useEffect } from 'react';
import { analyzeStream } from './api';
import type { AnalyzeResult, AnalysisProgress } from './types';
import UploadForm from './components/UploadForm';
import SummaryTiles from './components/SummaryTiles';
import CategoryBreakdown from './components/CategoryBreakdown';
import AttentionList from './components/AttentionList';
import MessagesTable from './components/MessagesTable';
import { useAttentionQueue } from './useAttentionQueue';

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

  const queue = useAttentionQueue(result?.messages ?? [], currentTime);

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
            urgent={queue.urgentCount}
            approaching={queue.approachingCount}
            attentionTotal={queue.totalCount}
          />
          <CategoryBreakdown counts={result.category_counts} total={result.total_unique_messages} />
          <AttentionList queue={queue} />
          <MessagesTable messages={result.messages} />
        </>
      )}
    </main>
  );
}
