import { useState, type FormEvent } from 'react';
import type { AnalysisProgress } from '../types';

interface Props {
  onSubmit: (file: File, now?: string) => void;
  loading: boolean;
  progress?: AnalysisProgress | null;
}

export default function UploadForm({ onSubmit, loading, progress }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [now, setNow] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    // datetime-local has no zone; treat the entered value as UTC
    onSubmit(file, now ? `${now}:00Z` : undefined);
  }

  const pct = progress?.progress ?? (loading ? 10 : 0);

  return (
    <div className="card upload-container">
      <form className="upload-form" onSubmit={submit}>
        <label>
          فایل پشتیبانی (CSV)
          <input
            data-testid="upload-input"
            type="file"
            accept=".csv,text/csv"
            disabled={loading}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          زمان مبنای ارزیابی (اختیاری - UTC)
          <input
            type="datetime-local"
            value={now}
            disabled={loading}
            onChange={(e) => setNow(e.target.value)}
          />
        </label>
        <button type="submit" data-testid="analyze-button" disabled={!file || loading}>
          {loading ? 'در حال تحلیل...' : 'تحلیل فایل'}
        </button>
      </form>

      {loading && (
        <div className="progress-section" data-testid="progress-section">
          <div className="progress-header">
            <span>در حال تحلیل و استخراج اطلاعات...</span>
            <span className="progress-pct">{pct}٪</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              data-testid="progress-bar"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="progress-status-msg" data-testid="progress-msg">
            {progress?.message || 'آغاز پردازش اطلاعات...'}
          </div>
        </div>
      )}
    </div>
  );
}
