/**
 * SLA business-hours arithmetic for Bazarcheh support.
 *
 * Working schedule: Saturday to Wednesday, 09:00–17:00 Asia/Tehran (UTC+03:30).
 * Thursdays, Fridays and official 1405 public holidays are excluded.
 */

const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000; // +03:30 in ms

// Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
// Saturday (6), Sunday (0), Monday (1), Tuesday (2), Wednesday (3) are working days:
const BUSINESS_DAYS_OF_WEEK = new Set([0, 1, 2, 3, 6]);

export const HOLIDAYS_1405 = new Set([
  '2026-03-21',
  '2026-03-22',
  '2026-03-23',
  '2026-03-24',
  '2026-04-01',
  '2026-04-02',
  '2026-04-14',
  '2026-05-28',
  '2026-06-04',
  '2026-06-05',
  '2026-06-26',
  '2026-06-27',
  '2026-08-06',
  '2026-08-14',
  '2026-08-16',
  '2026-08-23',
  '2026-09-01',
  '2026-11-15',
  '2026-12-24',
  '2027-01-07',
  '2027-01-25',
  '2027-02-11',
  '2027-03-01',
  '2027-03-11',
  '2027-03-12',
  '2027-03-20',
]);

export interface TehranDateParts {
  year: number;
  month: number; // 1-12
  day: number;
  dayOfWeek: number; // 0-6
  hours: number;
  minutes: number;
  seconds: number;
  dateKey: string; // YYYY-MM-DD
}

export function toTehranParts(date: Date): TehranDateParts {
  const tehranDate = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  const year = tehranDate.getUTCFullYear();
  const month = tehranDate.getUTCMonth() + 1;
  const day = tehranDate.getUTCDate();
  const dayOfWeek = tehranDate.getUTCDay();
  const hours = tehranDate.getUTCHours();
  const minutes = tehranDate.getUTCMinutes();
  const seconds = tehranDate.getUTCSeconds();
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hours,
    minutes,
    seconds,
    dateKey,
  };
}

export function isBusinessDay(date: Date): boolean {
  const parts = toTehranParts(date);
  return BUSINESS_DAYS_OF_WEEK.has(parts.dayOfWeek) && !HOLIDAYS_1405.has(parts.dateKey);
}

export function isBusinessDateKey(dateKey: string, dayOfWeek: number): boolean {
  return BUSINESS_DAYS_OF_WEEK.has(dayOfWeek) && !HOLIDAYS_1405.has(dateKey);
}

/**
 * Calculates business hours between two timestamps in Tehran time.
 */
export function businessHoursBetween(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) {
    return 0;
  }

  const startMs = start.getTime();
  const endMs = end.getTime();

  let totalMs = 0;

  // Align to day loops in Tehran time
  const startParts = toTehranParts(start);
  const endParts = toTehranParts(end);

  // Midnight UTC of Tehran start day
  const startDayMidnightUtc = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endDayMidnightUtc = Date.UTC(endParts.year, endParts.month - 1, endParts.day);

  for (let dayUtc = startDayMidnightUtc; dayUtc <= endDayMidnightUtc; dayUtc += 86400000) {
    const d = new Date(dayUtc);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const dayOfWeek = d.getUTCDay();
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (isBusinessDateKey(dateKey, dayOfWeek)) {
      // Work window: 09:00 to 17:00 Tehran time converted back to absolute ms:
      // DayUtc is midnight Tehran in UTC representation.
      // So absolute time = dayUtc - TEHRAN_OFFSET_MS + hour * 3600000
      const workOpenMs = dayUtc - TEHRAN_OFFSET_MS + 9 * 3600000;
      const workCloseMs = dayUtc - TEHRAN_OFFSET_MS + 17 * 3600000;

      const lo = Math.max(workOpenMs, startMs);
      const hi = Math.min(workCloseMs, endMs);

      if (hi > lo) {
        totalMs += hi - lo;
      }
    }
  }

  return totalMs / 3600000;
}

/**
 * Computes integer business minutes remaining until the 2h SLA breaches.
 * 0 or negative = overdue.
 */
export function computeBusinessMinutesLeft(
  receivedAt: string | Date,
  now: Date = new Date(),
  slaHours = 2.0
): number {
  const startDate = typeof receivedAt === 'string' ? new Date(receivedAt) : receivedAt;
  const elapsedBusinessHours = businessHoursBetween(startDate, now);
  const minutesLeft = (slaHours - elapsedBusinessHours) * 60;
  return Math.round(minutesLeft);
}
