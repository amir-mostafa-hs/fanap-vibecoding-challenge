import { useState } from 'react';
import { analyze } from './api';
import type { AnalyzeResult } from './types';
import UploadForm from './components/UploadForm';
import SummaryTiles from './components/SummaryTiles';
import CategoryBreakdown from './components/CategoryBreakdown';
import AttentionList from './components/AttentionList';
import MessagesTable from './components/MessagesTable';

export default function App() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(file: File, now?: string) {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyze(file, now));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Bazarcheh Support Triage</h1>
      <p className="muted">Upload an export of support messages to see what needs attention.</p>
      <UploadForm onSubmit={handleSubmit} loading={loading} />
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <SummaryTiles total={result.total_unique_messages} urgent={result.urgent_message_ids.length} />
          <CategoryBreakdown counts={result.category_counts} total={result.total_unique_messages} />
          <AttentionList ids={result.urgent_message_ids} messages={result.messages} />
          <MessagesTable messages={result.messages} />
        </>
      )}
    </main>
  );
}
