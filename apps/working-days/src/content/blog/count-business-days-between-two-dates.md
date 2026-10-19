---
title: "How to Count Business Days Between Two Dates"
description: "Count business days between two dates by hand or with NETWORKDAYS and NETWORKDAYS.INTL in Excel and Google Sheets, including weekends and holidays."
pubDate: 2026-10-18
updatedDate: 2026-10-19
draft: false
---

Counting the business days between two dates comes up all the time: project plans, payroll, delivery promises, leave requests. Small details, such as whether to count the first day, which days are the weekend and which holidays apply, can change the answer. This guide shows how to do it by hand, then how to do it with spreadsheet formulas.

## What counts as a business day?

A business day (or working day) is usually any day that is not a weekend day and not a public holiday. In many countries that means Monday to Friday, minus holidays. But that is not universal:

- Some countries have a Friday–Saturday weekend.
- Some workplaces run six days a week, with only Sunday off.
- Your employer may give extra days off, such as a year-end shutdown.

Before you count anything, decide three things: which days are the weekend, which holidays apply, and whether the start and end dates are included.

## Counting by hand

For short periods, counting on a calendar is perfectly reliable.

1. Write down the start and end dates.
2. Decide whether the start and end dates are included. Excel's and Google Sheets' NETWORKDAYS include both. Many online calculators, including ours by default, count the start date but not the end date.
3. Count the weekdays in the range.
4. Subtract any public holidays or other days off that fall on those weekdays.

A useful shortcut for longer ranges: every full week contains five Monday–Friday days. Count the full weeks, multiply by five, then add the leftover days individually.

### Worked example

How many business days are there from Monday 2 November 2026 to Friday 27 November 2026, inclusive, with a Saturday–Sunday weekend?

- That range is exactly four full weeks (Monday to Friday, four times), so 4 × 5 = **20 weekdays**.
- If you work in the United States, Thanksgiving falls on Thursday 26 November 2026. Subtract it: **19 business days**.
- In a country without that holiday, the answer stays at 20.

The word "inclusive" matters here. If you count the start date but not the end date, Friday 27 November drops out and the weekday count is 19 (18 with Thanksgiving).

The holiday list is what makes the biggest difference between countries, so always use the list that matches where the work is done.

## Using NETWORKDAYS in Excel and Google Sheets

Both Excel and Google Sheets have a built-in function for this, and the syntax is the same in both:

```
=NETWORKDAYS(start_date, end_date, [holidays])
```

- **start_date** and **end_date** are the two dates (cell references or real date values).
- **holidays** is optional: a range of cells containing dates to exclude.
- The weekend is fixed as Saturday and Sunday.
- Both the start date and end date are **included** if they are working days.

For the example above, with 02/11/2026 in A1, 27/11/2026 in B1 and 26/11/2026 in D1:

```
=NETWORKDAYS(A1, B1)        → 20
=NETWORKDAYS(A1, B1, D1)    → 19
```

In Excel, if the start date is later than the end date, the result is a negative number. Other spreadsheet apps may behave differently, so check with a quick test before relying on it.

Tip: type dates into cells rather than as text inside the formula, because date text can be read differently depending on regional settings.

## Using NETWORKDAYS.INTL for other weekends

If your weekend is not Saturday–Sunday, use NETWORKDAYS.INTL:

```
=NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays])
```

The **weekend** argument can be a number code or a seven-character string.

### Weekend number codes

| Code | Weekend days |
| --- | --- |
| 1 (default) | Saturday, Sunday |
| 2 | Sunday, Monday |
| 3 | Monday, Tuesday |
| 4 | Tuesday, Wednesday |
| 5 | Wednesday, Thursday |
| 6 | Thursday, Friday |
| 7 | Friday, Saturday |
| 11 | Sunday only |
| 12 | Monday only |
| 13 | Tuesday only |
| 14 | Wednesday only |
| 15 | Thursday only |
| 16 | Friday only |
| 17 | Saturday only |

### Weekend strings

The string form is more flexible. It has seven characters, one for each day starting with **Monday**. A `1` means a non-working day and a `0` means a working day.

- `"0000011"` – Saturday and Sunday off (same as code 1)
- `"0000110"` – Friday and Saturday off (same as code 7)
- `"0000001"` – Sunday only off (same as code 11)
- `"0010011"` – Wednesday, Saturday and Sunday off (a pattern no number code covers)

A string of all ones, `"1111111"`, leaves no working days. In Excel, NETWORKDAYS.INTL then always returns 0, and WORKDAY.INTL treats it as invalid.

For a Friday–Saturday weekend from Sunday 1 November to Friday 27 November 2026, with 01/11/2026 now in A1 and 27/11/2026 still in B1, and no holidays:

```
=NETWORKDAYS.INTL(A1, B1, 7)
=NETWORKDAYS.INTL(A1, B1, "0000110")
```

Both return 20.

## Common mistakes

- **Off-by-one errors.** NETWORKDAYS counts both ends. If you want the days *after* the start date, subtract one when the start date is itself a working day. Other tools may use a different rule, so check before comparing answers.
- **Missing holidays.** The functions only know about the holidays you list. Keep a holiday table for each country or region you deal with, and update it every year.
- **Regional holidays.** Some holidays apply only in one state, province or nation within a country. Check the official government list for the exact location.
- **Substitute days.** When a holiday falls on a weekend, many countries give a weekday off instead. Add the substitute date, not just the original date, to your list.

## A quicker option

If you would rather not maintain holiday tables, the [working days calculator](/) on our home page counts business days with public holidays for 41 countries, different weekend patterns and your own days off. By default it counts the start date but not the end date. Use the "Include the start date" and "Include the end date" tick boxes to change that: tick both to match NETWORKDAYS. It can also turn the count into working hours (8 hours a day unless you change it), and a "Working days in [year]" table below the calculator shows the count for every month. For anything important, such as a contractual deadline, check the result against the official holiday list.
