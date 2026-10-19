---
title: "How to Add Business Days to a Date"
description: "Add business days to a date step by step, with a worked example that includes holidays, plus how this applies to invoice terms and shipping estimates."
pubDate: 2026-10-18
updatedDate: 2026-10-19
draft: true
---

Counting forward a set number of business days sounds easy until a weekend or public holiday gets in the way. For invoice due dates, delivery windows and response deadlines alike, the method is the same: start from the right day, skip the days that do not count, and stop at the number you need.

## The basic method

1. **Pick the start date.** This is usually the day of the event: the invoice date, the order date, the date a request was received.
2. **Decide whether the start date counts.** In most cases it does not. "Five business days from Monday" usually means the count starts on Tuesday. Check the wording if it matters.
3. **Know your non-working days.** That means the weekend pattern (Saturday–Sunday for most, but not all) and the public holidays that apply.
4. **Count forward one working day at a time**, skipping weekends and holidays. The date you land on is the result.

## Worked example with holidays

Add **10 business days** to **Friday 18 December 2026** in England (Saturday–Sunday weekend), not counting the start date.

First, list the holidays in the period. For England in late 2026 and early 2027:

- Friday 25 December 2026 – Christmas Day
- Monday 28 December 2026 – substitute day for Boxing Day (which falls on a Saturday)
- Friday 1 January 2027 – New Year's Day

Now count:

| Date | Status | Count |
| --- | --- | --- |
| Mon 21 Dec | Working day | 1 |
| Tue 22 Dec | Working day | 2 |
| Wed 23 Dec | Working day | 3 |
| Thu 24 Dec | Working day | 4 |
| Fri 25 Dec | Holiday | – |
| Sat 26, Sun 27 Dec | Weekend | – |
| Mon 28 Dec | Holiday (substitute) | – |
| Tue 29 Dec | Working day | 5 |
| Wed 30 Dec | Working day | 6 |
| Thu 31 Dec | Working day | 7 |
| Fri 1 Jan | Holiday | – |
| Mon 4 Jan | Working day | 8 |
| Tue 5 Jan | Working day | 9 |
| Wed 6 Jan | Working day | 10 |

The result is **Wednesday 6 January 2027**. If you ignored holidays and only skipped weekends, you would get Friday 1 January 2027, which is itself a public holiday. That three-working-day gap is why holiday lists matter.

If your office also closes on other days, such as 24 December, and those days should not count, add them to your list.

## Invoice terms: "30 days" vs "30 business days"

- **"Net 30" or "30 days"** usually means 30 calendar days. An invoice dated Friday 18 December 2026 would then be due on Sunday 17 January 2027.
- **"30 business days"** skips weekends and holidays. Using the England holidays above, the same invoice would be due on **Wednesday 3 February 2027**, more than two weeks later.

A few things to check on any invoice terms:

- Does the period run from the invoice date, the date of receipt or the end of the month? Terms such as "30 days end of month" work differently.
- What happens if a calendar-day due date falls on a weekend or holiday? Some agreements move it, others do not.
- Are there legal rules on payment periods where you trade? Some countries set maximum payment terms or allow interest on late payment. The details vary, so check the official guidance for your country.

This is general information, not legal or financial advice. Your contract and the applicable law decide what the terms mean.

## Shipping estimates

Retailers often quote delivery in business days, such as "dispatched within 2 business days, delivered in 3–5 business days". To turn that into dates:

1. Check the order cut-off time. Later orders are often treated as placed the next working day.
2. Add the dispatch time in business days.
3. Add the delivery window to the dispatch date.

For example, an order placed on Friday 6 November 2026 before the cut-off, with the order day not counted:

- Dispatch within 2 business days: Monday 9 (1), Tuesday 10 (2). Dispatched by **Tuesday 10 November**.
- Delivery in 3–5 business days after dispatch: between **Friday 13 and Tuesday 17 November**.

That assumes a Monday-to-Friday carrier and no holidays. Public holidays can affect carriers differently from offices. In the United States, for example, Veterans Day (Wednesday 11 November 2026) is a federal holiday. In recent years the US Postal Service has closed post offices and paused regular mail delivery on Veterans Day (Priority Mail Express still runs), while UPS lists normal pickup and delivery for Veterans Day 2026, apart from services handed to the Postal Service. So a US order could arrive a day later depending on the carrier. Each carrier publishes its own holiday schedule.

## Using a spreadsheet

Excel and Google Sheets have a function for this:

```
=WORKDAY(start_date, days, [holidays])
=WORKDAY.INTL(start_date, days, [weekend], [holidays])
```

WORKDAY does not count the start date, and it skips Saturdays, Sundays and any dates in the holidays range. With the England holidays above in D1:D3, `=WORKDAY(A1, 10, D1:D3)` with 18/12/2026 in A1 returns 06/01/2027 (format the cell as a date). WORKDAY.INTL lets you set a different weekend, for example `7` or `"0000110"` for Friday–Saturday. A negative number of days counts backwards, which is handy for working out the latest date to start something.

## A quicker way

The [working days calculator](/) can add or subtract business days using public holidays for 41 countries, a choice of weekend patterns and your own days off. Like WORKDAY, it never counts the start date, so 1 working day after a Friday is the following Monday. It also shows the matching number of working hours. For contractual dates, double-check the result against the official holiday list and your agreement.
