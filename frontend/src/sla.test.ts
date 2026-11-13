import { describe, it, expect } from 'vitest';
import {
  businessHoursBetween,
  computeBusinessMinutesLeft,
  isBusinessDay,
} from './sla';

describe('SLA & Iranian calendar business hours', () => {
  it('identifies workdays and weekend days in Iranian calendar', () => {
    // Saturday 2026-10-24 is a business day
    expect(isBusinessDay(new Date('2026-10-24T09:00:00+03:30'))).toBe(true);
    // Wednesday 2026-10-21 is a business day
    expect(isBusinessDay(new Date('2026-10-21T09:00:00+03:30'))).toBe(true);
    // Thursday 2026-10-22 is Iranian weekend
    expect(isBusinessDay(new Date('2026-10-22T09:00:00+03:30'))).toBe(false);
    // Friday 2026-10-23 is Iranian weekend
    expect(isBusinessDay(new Date('2026-10-23T09:00:00+03:30'))).toBe(false);
  });

  it('identifies official 1405 public holidays as non-business days', () => {
    // 1405/01/12 is 2026-04-01 (Wednesday)
    expect(isBusinessDay(new Date('2026-04-01T10:00:00+03:30'))).toBe(false);
    // 1405/01/25 is 2026-04-14 (Tuesday)
    expect(isBusinessDay(new Date('2026-04-14T10:00:00+03:30'))).toBe(false);
  });

  it('computes business hours within one workday', () => {
    // Saturday 2026-10-24, 10:00 -> 13:30 Tehran time = 3.5 business hours
    const start = new Date('2026-10-24T10:00:00+03:30');
    const end = new Date('2026-10-24T13:30:00+03:30');
    expect(businessHoursBetween(start, end)).toBe(3.5);
  });

  it('skips Iranian weekend (Thursday & Friday)', () => {
    // Wednesday 16:00 Tehran -> Saturday 10:00 Tehran = 2.0 hours
    const start = new Date('2026-10-21T16:00:00+03:30');
    const end = new Date('2026-10-24T10:00:00+03:30');
    expect(businessHoursBetween(start, end)).toBe(2.0);
  });

  it('skips 1405 official holidays', () => {
    // Tuesday 2026-03-31 16:00 Tehran -> Saturday 2026-04-04 10:00 Tehran
    // 2026-04-01 is 1405/01/12 (holiday), 2026-04-02 is Thu, 2026-04-03 is Fri
    // Total = 2.0 hours
    const start = new Date('2026-03-31T16:00:00+03:30');
    const end = new Date('2026-04-04T10:00:00+03:30');
    expect(businessHoursBetween(start, end)).toBe(2.0);
  });

  it('computes business minutes left for 2-hour SLA', () => {
    const received = '2026-10-24T10:00:00+03:30';
    const now1 = new Date('2026-10-24T11:30:00+03:30');
    expect(computeBusinessMinutesLeft(received, now1, 2.0)).toBe(30);

    const nowExact = new Date('2026-10-24T12:00:00+03:30');
    expect(computeBusinessMinutesLeft(received, nowExact, 2.0)).toBe(0);

    const nowOverdue = new Date('2026-10-24T12:30:00+03:30');
    expect(computeBusinessMinutesLeft(received, nowOverdue, 2.0)).toBe(-30);
  });
});
