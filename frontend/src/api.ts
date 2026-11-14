import type { AnalyzeResult, Draft, AnalysisProgress } from './types';

export async function analyze(file: File, now?: string): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append('file', file);
  const qs = now ? `?now=${encodeURIComponent(now)}` : '';
  const res = await fetch(`/api/analyze${qs}`, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`Analyze failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function analyzeStream(
  file: File,
  now?: string,
  onProgress?: (event: AnalysisProgress) => void
): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append('file', file);
  const params = new URLSearchParams();
  if (now) params.set('now', now);
  params.set('stream', 'true');

  const res = await fetch(`/api/analyze?${params.toString()}`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Analyze failed (${res.status}): ${await res.text()}`);
  }

  if (!res.body) {
    throw new Error('پاسخ سرور خالی است.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: AnalyzeResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data: ')) {
        try {
          const event: AnalysisProgress = JSON.parse(line.slice(6));
          if (onProgress) onProgress(event);
          if (event.step === 'complete' && event.result) {
            finalResult = event.result;
          } else if (event.step === 'error') {
            throw new Error(event.error || event.message);
          }
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('خطا')) throw e;
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error('تحلیل با خطا متوقف شد یا پاسخی دریافت نشد.');
  }

  return finalResult;
}

export async function requestDraft(m: {
  message_id: string;
  customer_id: string;
  subject: string;
  body: string;
}): Promise<Draft> {
  const res = await fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m),
  });
  if (!res.ok) {
    throw new Error(`Draft failed (${res.status})`);
  }
  return res.json();
}
