# 01: SLA Engine & Iranian Calendar with Live Countdown

**What to build:** Accurate business hours and urgency calculation against the Iranian working calendar (Saturday–Wednesday, 09:00–17:00 Asia/Tehran, with Thursday/Friday weekends and official 1405 holidays excluded). Default 2-hour SLA promise. Both backend and frontend calculate business hours identically so that the browser dashboard updates countdowns and urgency counts live every minute without making any server or LLM requests.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Support team working schedule defined as Saturday to Wednesday, 09:00–17:00 Tehran time (+03:30).
- [ ] Thursday and Friday treated as non-working weekend days.
- [ ] All 26 official 1405 holidays defined in Gregorian lookup table and excluded from business hours.
- [ ] Default `URGENT_SLA_BUSINESS_HOURS` configured as `2.0` in code and `docker-compose.yml`.
- [ ] A message is marked urgent if it is high-severity, unanswered, and has waited at least 2 business hours.
- [ ] Identical business hours engine implemented in frontend TypeScript to compute business minutes left.
- [ ] Live browser timer updates countdown and urgency counts at least once a minute.
- [ ] Automated tests in both backend and frontend verifying regular hours, weekends, holidays, and SLA threshold boundaries.
