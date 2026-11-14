import { useMemo } from 'react';
import type { Message } from './types';
import { computeBusinessMinutesLeft } from './sla';

export interface AttentionItem {
  id: string;
  m: Message;
  left: number;
}

export interface AttentionQueue {
  items: AttentionItem[];
  urgentCount: number;
  approachingCount: number;
  totalCount: number;
}

export function useAttentionQueue(
  messages: Message[],
  now: Date = new Date()
): AttentionQueue {
  return useMemo(() => {
    const candidates = messages.filter((m) => {
      const isHigh = (m.severity_hint || m.severity) === 'high';
      const isCanonical = !m.duplicate_of;
      const isUnanswered = !m.answered_at;
      return isHigh && isCanonical && isUnanswered;
    });

    const items: AttentionItem[] = candidates.map((m) => ({
      id: m.message_id,
      m,
      left: computeBusinessMinutesLeft(m.received_at, now, 2.0, m.sla_deadline_at),
    }));

    // Sort: most overdue at the top, followed by closest to breach
    items.sort((a, b) => a.left - b.left);

    const urgentCount = items.filter((item) => item.left <= 0).length;
    const approachingCount = items.filter((item) => item.left > 0).length;

    return {
      items,
      urgentCount,
      approachingCount,
      totalCount: items.length,
    };
  }, [messages, now]);
}
