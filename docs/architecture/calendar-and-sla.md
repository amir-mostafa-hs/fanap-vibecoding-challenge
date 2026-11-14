# Iranian Working Calendar & SLA Engine

Bazarcheh support guarantees customer replies within **2.0 business hours** for all high-severity inquiries. Calculating this promise accurately requires strict adherence to the Iranian business calendar and official public holidays.

---

## 1. Business Schedule Rules

1. **Working Days:** Saturday through Wednesday.
2. **Weekend Days:** Thursday and Friday (closed, zero business minutes counted).
3. **Daily Operating Hours:** 09:00 to 17:00 Asia/Tehran (UTC+03:30), representing 8 business hours (480 minutes) per working day.
4. **Non-Operating Hours:** Nights (before 09:00 and after 17:00 Tehran time) are excluded.
5. **Holidays:** Official public holidays falling on working days are fully excluded.

---

## 2. Solar Hijri Year 1405 Holiday Mapping

The 26 official public holidays of year 1405 (March 2026 – March 2027) are mapped to Gregorian dates across both backend (`sla.py`) and frontend (`sla.ts`):

| Solar Hijri (1405) | Gregorian (YYYY-MM-DD) | Occasion / Holiday |
|---|---|---|
| 1405/01/01 | 2026-03-21 | Nowruz Holiday 1 |
| 1405/01/02 | 2026-03-22 | Nowruz Holiday 2 |
| 1405/01/03 | 2026-03-23 | Nowruz Holiday 3 |
| 1405/01/04 | 2026-03-24 | Nowruz Holiday 4 |
| 1405/01/12 | 2026-04-01 | Islamic Republic Day |
| 1405/01/13 | 2026-04-02 | Nature Day (Sizdah Bedar) |
| 1405/01/25 | 2026-04-14 | Martyrdom of Imam Jafar al-Sadiq |
| 1405/03/07 | 2026-05-28 | Eid al-Adha (Ghorban) |
| 1405/03/14 | 2026-06-04 | Demise of Imam Khomeini |
| 1405/03/15 | 2026-06-05 | Khordad 15 Uprising / Eid al-Ghadir |
| 1405/04/05 | 2026-06-26 | Tasua |
| 1405/04/06 | 2026-06-27 | Ashura |
| 1405/05/15 | 2026-08-06 | Arbaeen |
| 1405/05/23 | 2026-08-14 | Demise of Prophet Muhammad & Imam Hasan |
| 1405/05/25 | 2026-08-16 | Martyrdom of Imam Reza |
| 1405/06/01 | 2026-08-23 | Martyrdom of Imam Hasan al-Askari |
| 1405/06/10 | 2026-09-01 | Birthday of Prophet Muhammad & Imam Sadiq |
| 1405/08/24 | 2026-11-15 | Martyrdom of Hazrat Fatima (Fatimiyya) |
| 1405/10/03 | 2026-12-24 | Birthday of Imam Ali |
| 1405/10/17 | 2027-01-07 | Maba'ath (Ascension of Prophet) |
| 1405/11/05 | 2027-01-25 | Mid-Sha'ban (Birthday of Imam Mahdi) |
| 1405/11/22 | 2027-02-11 | Revolution Day |
| 1405/12/10 | 2027-03-01 | Martyrdom of Imam Ali |
| 1405/12/20 | 2027-03-11 | Eid al-Fitr Holiday 1 |
| 1405/12/21 | 2027-03-12 | Eid al-Fitr Holiday 2 |
| 1405/12/29 | 2027-03-20 | Oil Nationalization Day |

---

## 3. Urgency Decision Rules

An inquiry is defined as **Urgent** (`is_urgent = true`) if and only if:
1. `severity_hint == 'high'`
2. The message is canonical (`duplicate_of is null`)
3. The message remains unanswered (`answered_at is null`)
4. Elapsed business hours $\ge 2.0$ hours (i.e. `business_minutes_left <= 0`).

*Note:* Answered messages are considered handled and are never marked urgent, regardless of whether the reply was delayed.
