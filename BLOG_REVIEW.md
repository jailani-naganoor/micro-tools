# Blog review 1

A fact-check of the 10 draft blog posts (5 per site), done on 19 October 2026 on branch
`blog-review-1`. Every post is still `draft: true`; each now has `updatedDate: 2026-10-19`
(an optional field in the blog schema). Publishing is left to you.

## How the checking was done

- **Sources.** Claims were checked against official pages: Microsoft, Apple, Google, Mozilla and
  Logitech support, Excel and Google Sheets function documentation, OPM, GOV.UK, the Fair Work
  Ombudsman, u.ae, USPS/UPS, the W3C, and similar. Where no official page existed, the claim was
  softened or removed, or it is listed under "Couldn't verify".
- **Limitation:** this cloud container can't open web pages directly (DNS lookups fail), so
  sources were read through search-engine extracts of those pages, not the full pages. The links
  below are the official URLs those extracts came from. Please open the ones that matter most
  before publishing, especially the settings paths, because vendor menus change often.
- **Worked date examples** in the Working Days posts were recalculated with a script (`Date.UTC`
  weekday arithmetic) and all were correct.
- **Tool references** were updated to match the improvements-1 release:
  - Working Days: start/end date tick boxes, working hours, the yearly table and 41 countries.
  - Device Test: the Speaker tab, mic details, processing toggles and Download recording,
    rollover and chatter checks, the phone keyboard message, the 12-step screen test with
    fullscreen fallback and iPhone tip, and the stuck pixel fixer with its photosensitivity warning.

## Things to check by hand before publishing

1. **UK, Christmas 2027:** Monday 27 December 2027 as the Christmas Day substitute wasn't confirmed
   from a current GOV.UK extract (Tuesday 28 December 2027 was). Check gov.uk/bank-holidays.
2. **Gulf weekends:** the Friday–Saturday weekends for Qatar, Kuwait and Bahrain rest on reputable
   news reports, not government pages. Israel's Sunday–Thursday week has no single official source.
3. **USPS on Veterans Day 2026:** USPS hadn't published its 2026 notice, so the post describes
   recent years.
4. **Google Sheets with reversed dates:** no Google page confirms that `NETWORKDAYS` returns a
   negative number when the dates are reversed, so the post now says this only for Excel.
5. **Keyboards:**
   - The "six keys" limit of the USB boot keyboard format came from secondary sources only.
   - Debounce and other chatter fixes are forum advice only, so the post words them cautiously.
6. **Monitors:** we found the ISO 9241-307 pixel-fault classes on vendor policy pages, not in the
   standard itself, so the post states no numbers.
7. **Browser and OS paths:**
   - The current Microsoft Edge menu path for site permissions.
   - Whether macOS needs the browser restarted after changing camera permission.
   - The Windows 11 option to let several apps use the camera, which was left out.
8. **On-site fix steps (not changed in this PR):**
   - Chrome: our error box says "site controls icon", but Google's help calls it the "site
     information" icon.
   - Edge: "lock icon › Permissions for this site" couldn't be confirmed from Microsoft's docs.

   It's worth checking both in the browsers and updating `ProblemBox.astro` if needed.

---

## Working Days Calculator posts

All five posts keep `draft: true`. Each post gained `updatedDate: 2026-10-19`, which the schema in `packages/ui/src/lib/blog.ts` allows. Internal links are only to `/`. `SHOW_DRAFTS=true npm run build -w @micro/working-days` succeeded and `npx eslint apps/working-days` is clean. I checked every worked date with node (Date.UTC) and checked holiday dates against the repo's date-holidays data.

### How to Count Business Days Between Two Dates (`count-business-days-between-two-dates.md`)
**Checked:**
- 2–27 Nov 2026 with both dates included gives 20 weekdays, and 19 after taking out Thanksgiving (Thu 26 Nov 2026). Both correct.
- NETWORKDAYS syntax, that it includes both dates, and its fixed Sat–Sun weekend (Excel and Google Sheets).
- NETWORKDAYS.INTL syntax, weekend codes 1–7 and 11–17, and 7-character strings starting on Monday (Excel and Sheets).
- The weekend string examples, and what happens with "1111111".
- A start date later than the end date gives a negative result in Excel.
- The Friday–Saturday example for 1–27 Nov 2026 gives 20. Correct.
**Changed:**
- Step 2 used to say "most spreadsheet functions include both". It now names NETWORKDAYS and says that many calculators, including ours by default, count the start date but not the end date.
- Added a note on what "inclusive" changes: with the start counted and the end not, the count is 19 (18 with Thanksgiving).
- The NETWORKDAYS.INTL example now says A1 holds 01/11/2026. Before, it reused A1 = 02/11/2026, which gives a different answer.
- The "1111111" statement was wrong ("not allowed"). It now says NETWORKDAYS.INTL in Excel always returns 0 and WORKDAY.INTL treats it as invalid.
- The negative-result statement is now limited to Excel.
- The off-by-one tip now warns that other tools may use a different rule.
- The closing section now says 41 countries, explains the start/end tick boxes (default: start included, end excluded; tick both to match NETWORKDAYS), and mentions working hours (default 8) and the "Working days in [year]" table.
**Sources:**
- [Microsoft: NETWORKDAYS function](https://support.microsoft.com/en-us/excel/functions/networkdays-function)
- [Microsoft: NETWORKDAYS.INTL function](https://support.microsoft.com/en-us/office/networkdays-intl-function-a9b26239-4f20-46a1-9ab8-4e925bfd5e28)
- [Microsoft: WORKDAY.INTL function](https://support.microsoft.com/en-us/office/workday-intl-function-a378391c-9ba7-4678-8a39-39611a9bf81d)
- [Microsoft Learn: WorksheetFunction.NetworkDays_Intl](https://learn.microsoft.com/en-ca/office/vba/api/excel.worksheetfunction.networkdays_intl)
- [Google: NETWORKDAYS](https://support.google.com/docs/answer/3092979?hl=en)
- [Google: NETWORKDAYS.INTL](https://support.google.com/docs/answer/3295902?hl=en)
- [OPM: Federal holidays](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/) (Thanksgiving)
**Couldn't verify:**
- Whether Google Sheets also returns a negative number for reversed dates. Google's help page doesn't say, so the post now makes that claim about Excel only.

### How to Add Business Days to a Date (`how-to-add-business-days-to-a-date.md`)
**Checked:**
- England holidays: Fri 25 Dec 2026, Mon 28 Dec 2026 (Boxing Day substitute), Fri 1 Jan 2027. Matches gov.uk and the date-holidays data.
- 10 business days after Fri 18 Dec 2026 is Wed 6 Jan 2027; skipping weekends only gives Fri 1 Jan 2027.
- 30 calendar days after 18 Dec 2026 is Sun 17 Jan 2027; 30 business days is Wed 3 Feb 2027.
- Shipping example: dispatch Tue 10 Nov 2026, delivery between Fri 13 and Tue 17 Nov.
- Veterans Day falls on Wed 11 Nov 2026. Checked how USPS and UPS treat it.
- WORKDAY and WORKDAY.INTL: syntax, start date not counted, negative days count backwards.
**Changed:**
- The Veterans Day sentence was vague ("some carriers' services are affected"). It now gives specifics:
  - In recent years USPS has closed post offices and paused regular mail delivery on Veterans Day, with Priority Mail Express still running.
  - UPS lists normal pickup and delivery for Veterans Day 2026, except services handed to USPS.
- Added a worked WORKDAY formula (`=WORKDAY(A1, 10, D1:D3)` returns 06/01/2027).
- The closing section now says 41 countries, says the tool never counts the start date (like WORKDAY), and mentions working hours.
**Sources:**
- [GOV.UK: UK bank holidays](https://www.gov.uk/bank-holidays)
- [Microsoft: WORKDAY function](https://support.microsoft.com/en-us/excel/functions/workday-function)
- [Microsoft: WORKDAY.INTL function](https://support.microsoft.com/en-us/office/workday-intl-function-a378391c-9ba7-4678-8a39-39611a9bf81d)
- [Google: WORKDAY](https://support.google.com/docs/answer/3093059?hl=en)
- [Google: WORKDAY.INTL](https://support.google.com/docs/answer/3294972?hl=en)
- [USPS: Veterans Day holiday, 2025](https://about.usps.com/newsroom/local-releases/oh/2025/1104-usps-to-observe-veterans-day-holiday-nov-11.htm)
- [UPS: holiday schedule](https://www.ups.com/us/en/support/shipping-support/shipping-services/holiday-shipping-schedule) and its [2026 US holiday operations PDF](https://assets.ups.com/adobe/assets/urn:aaid:aem:4756cbe3-c3b7-4bfb-a79e-1d285308dc2e/original/as/2026-holiday-operations-schedule-us-en.pdf)
- [OPM: Federal holidays](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/)
**Couldn't verify:**
- USPS's 2026 Veterans Day notice isn't out yet. The post describes the pattern from 2024–2025 ("in recent years").
- The invoice-terms bullets are general and make no factual claims, so they were left as they were.

### When a Public Holiday Falls on a Weekend (`public-holiday-falls-on-weekend.md`)
**Checked:**
- OPM rule: a Saturday holiday is observed on the preceding Friday, a Sunday holiday on the following Monday. OPM also has "in lieu of" rules for other schedules.
- US examples:
  - 4 Jul 2026 (Sat) observed Fri 3 Jul.
  - 25 Dec 2027 (Sat) observed Fri 24 Dec.
  - 4 Jul 2027 (Sun) observed Mon 5 Jul.
  - New Year's Day on a Saturday is observed on 31 Dec (for example 1 Jan 2028, observed 31 Dec 2027).
- Federal Reserve Banks stay open on the Friday before a Saturday holiday.
- UK substitute days for 2026 and 2027.
- Scotland has 2 January and St Andrew's Day; Northern Ireland has St Patrick's Day and 12 July.
- UK workers have no statutory right to paid bank holidays.
- Anzac Day 2026: Saturday 25 April, with an additional Monday 27 April holiday in NSW, WA and the ACT only.
- Worked example: 21–31 Dec 2026 has 9 weekdays, leaving 7 working days.
**Changed:**
- Credited the US rule to OPM and limited it to Monday-to-Friday employees.
- Mentioned OPM's separate "in lieu of" rules for other schedules and that some holidays have exceptions.
- The Federal Reserve line now says the Reserve Banks stay open on the Friday before a Saturday holiday, the Board itself closes, and the Banks close on the Monday after a Sunday holiday.
- Reworded "no automatic legal right" to "no statutory right to paid leave on bank holidays", which is GOV.UK's wording.
- Added a note that the worked example includes both start and end dates, so both "Include" boxes need ticking in the calculator.
- The closing section now says 41 countries, explains that a holiday on a weekend counts once as a weekend day, and gives real substitute examples from the tool's data (28 Dec 2026 England; 27 Apr 2026 NSW, WA, ACT).
**Sources:**
- [OPM: Federal holidays](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/)
- [OPM: "In lieu of" determination fact sheet](https://www.opm.gov/policy-data-oversight/pay-leave/work-schedules/fact-sheets/Federal-Holidays-In-Lieu-Of-Determination)
- [Federal Reserve Board: Holidays observed (K.8)](https://www.federalreserve.gov/aboutthefed/k8.htm)
- [Federal Reserve Financial Services: holiday schedules](https://www.frbservices.org/about/holiday-schedules/)
- [GOV.UK: UK bank holidays](https://www.gov.uk/bank-holidays)
- [Privy Council: 2026 proclamation (bank holidays incl. 28 Dec 2027)](https://privycouncil.independent.gov.uk/wp-content/uploads/2026/07/2026-07-08-Proclamation-England-Wales-and-Northern-Ireland-Bank-Holiday.pdf)
- [GOV.UK: Holiday entitlement](https://www.gov.uk/holiday-entitlement-rights)
- [Fair Work Ombudsman: Anzac Day public holidays 2026](https://www.fairwork.gov.au/newsroom/news/anzac-day-public-holidays)
- [Fair Work Ombudsman: 2026 public holidays](https://www.fairwork.gov.au/employment-conditions/public-holidays/2026-public-holidays)
**Couldn't verify:**
- I couldn't confirm Monday 27 Dec 2027 (the Christmas Day substitute) directly from a current gov.uk extract. Tuesday 28 Dec 2027 is confirmed by the Privy Council proclamation. The 27 Dec date fits the 1971 Act pattern, which was used in 2021, and date-holidays lists both days. Worth a quick look at gov.uk/bank-holidays before publishing.

### Weekend Days by Country: Patterns Around the World (`weekend-patterns-around-the-world.md`)
**Checked:**
- Friday–Saturday weekend countries and when each changed:
  - Saudi Arabia: June 2013, from Thu–Fri.
  - Oman: May 2013, from Thu–Fri.
  - Kuwait: government from Sept 2007.
  - Bahrain: Sept 2006.
  - Qatar: 2003.
- Israel's Sunday–Thursday week.
- UAE: Saturday–Sunday federal weekend from 1 Jan 2022 with a Friday half day (a 4.5-day week), and which other emirates followed.
- Sharjah government: four-day week (Mon–Thu) with a Friday–Sunday weekend.
- UAE private sector working week.
- Worked examples: 3 working days after Thu 5 Nov 2026 is Tue 10 Nov under both weekends. 2 working days after Wed 4 Nov is Fri 6 Nov (Sat–Sun weekend) or Sun 8 Nov (Fri–Sat weekend). All correct.
- What the tool offers: weekend presets, weekend set separately from country (default Sat–Sun everywhere), Bahrain and UAE in the list, and no Saudi Arabia, Qatar, Kuwait or Oman.
**Changed:**
- Added Bahrain, Qatar and Kuwait's earlier switches.
- Added a caveat that these are official or government weekends and that private employers may set their own rest days.
- Reworded the Israel paragraph to describe the usual Sunday–Thursday week, rather than flatly saying "Israel has a Friday–Saturday weekend".
- UAE: now says "four-and-a-half-day week … half day on Friday", names the six emirates that adopted a similar week (per u.ae), and adds Sharjah's Monday–Thursday working days.
- Replaced the unsourced "Many [private firms] moved to Saturday–Sunday, but not all did" with "a private firm's weekend may differ from the government's".
- The closing section now says 41 countries and covers custom weekends and the Saturday–Sunday default. It also says Saudi Arabia, Qatar, Kuwait and Oman aren't in the country list, so use "No public holidays" plus custom days off.
**Sources:**
- [u.ae: Working hours in the public sector](https://u.ae/en/information-and-services/jobs/Sector-of-employment/working-in-uae-government-sector/working-hours-in-the-public-sector)
- [u.ae: Working hours (private sector)](https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/working-hours)
- [MOHRE: New working week system (8 Dec 2021)](https://mohre.gov.ae/en/media-center/news/8/12/2021/new-working-week-system-a-boost-to-labour-market-says-abdulrahman-al-awar)
- [WAM: Fujairah adopts Saturday–Sunday weekend](https://www.wam.ae/en/details/1395303001255)
- [Arab News: Saudi Arabia's Friday–Saturday weekend (2013)](https://www.arabnews.com/news/455923)
- [Crowell: Saudi Arabia changes weekend from 29 June 2013](https://www.crowell.com/en/insights/client-alerts/saudi-arabia-changes-weekend-to-friday-saturday-from-29-june-2013)
- [Gulf Business: Oman to shift to Friday–Saturday weekend (2013)](https://gulfbusiness.com/en/2013/industry/oman-to-shift-to-friday-saturday-weekend)
- [Ahram Online: Saudi Arabia changes working week](https://english.ahram.org.eg/News/74730.aspx)
- [Asharq Al-Awsat: Kuwait switches to Friday–Saturday weekend (2007)](https://en-archive.aawsat.com/2007/05/27/kuwait-switches-to-friday-saturday-weekend/)
- [Gulf Bank: 2007 branch hours for the new official weekend](https://www.e-gulfbank.com/en/about-us/media/press-releases/2007/08/gulf-bank-announces-new-branch-opening-hours/)
- [Arab News: Qatar changes weekend (2003)](https://www.arabnews.com/node/234601)
**Couldn't verify:**
- I found no government page for the current weekends of Qatar, Kuwait or Bahrain. These rely on reputable news reports of the original decisions, plus secondary guides saying they still apply.
- Bahrain's 2006 switch is sourced only from Global Voices, a blog-style source.
- I found no official Israeli government source for the Sunday–Thursday week; this is from news and secondary sources.
- The exact UAE announcement date (7 Dec 2021) is not stated in the post. It says "December 2021", which official sources support.
- "Saturday–Sunday is standard across most of Europe, the Americas…" is general knowledge with no single official source. Left as written.

### Working Days vs Calendar Days in Deadlines (`working-days-vs-calendar-days.md`)
**Checked:**
- 10 calendar days from Monday 2 Nov 2026 is Thursday 12 Nov (Thursday of the following week). 10 working days is Monday 16 Nov (two weeks later).
- 5 working days after Mon 2 Nov 2026, not counting that day, is Mon 9 Nov. 5 calendar days is Sat 7 Nov.
- The post's general deadline guidance (clear days, deemed receipt, moving deadlines) is hedged, with no country-specific legal claims.
**Changed:**
- The closing section now says 41 countries and explains that add mode never counts the start date (matching the worked example). It also says to use the start/end tick boxes to match the wording when counting between dates.
**Sources:**
- No outside sources needed. Dates checked by calculation, and tool behaviour checked against `apps/working-days/src/pages/index.astro` FAQ and DECISIONS.md #9, #47–49.
**Couldn't verify:**
- "Clear days usually means neither the first nor the last day is counted" is a common legal usage (especially in the UK). I found no single authoritative source, so it stays hedged with "usually" as written.

---

## Device Test posts

All five posts keep `draft: true`. `updatedDate: 2026-10-19` added to each (the schema has an optional `updatedDate`). `SHOW_DRAFTS=true npm run build -w @micro/device-test` succeeds, and all 5 posts build. Note: the WebSearch tool returned result extracts, not full pages, so each item below is checked against those extracts from the official domains listed.

### Dead Pixels vs Stuck Pixels: How to Tell and What to Do (`dead-pixels-vs-stuck-pixels.md`)
**Checked:**
- Subpixel structure. Each LCD subpixel has its own transistor, and a fault leaves a subpixel off (dark) or on (bright) (Apple).
- Dead pixel: a black dot on white or coloured backgrounds that can't be seen on black. Software can't revive it, and the only fix is replacing the panel (Dell, Lenovo).
- Stuck/bright/hot pixel definitions (Dell, Lenovo, ISO 9241-307 fault types as quoted in vendor policies).
- Dust can look like a pixel fault, and a lint-free cloth removes it (Apple, Dell).
- "Some stuck pixels clear up on their own": Dell says stuck pixels don't get better or worse on their own.
- Pixel-fixing software and pressure: Lenovo suggests both. Dell advises against both, says they're unsupported and may void the warranty. Third-party evidence is anecdotal and mixed.
- Manufacturer pixel policies and ISO 9241-307 fault classes (Dynabook bases its policy on ISO 9241-307 Class II; Lenovo refers to ISO 9241 classes; Dell has per-product thresholds).
- Tool description against DeviceTests.astro and DECISIONS #59–62.
**Changed:**
- Added that LCD subpixels each have their own transistor and that faults are "stays off or stays on". Added that a dead pixel is invisible on black.
- Hot pixel line now says "hot pixel or a bright pixel" (Dell's term).
- Toned down "more likely to recover" to "more likely to respond… but there is no guarantee, and some never change".
- Cleaning: "dry, soft, lint-free cloth such as a microfibre cloth".
- Test steps: added the corners and edges, and hot pixels on black.
- Replaced the vague "shows full-screen solid colours" with the real 12-step test: 9 colours, grey gradient (banding), checkerboard, final black for backlight bleed. Added the full-screen fallback message and the iPhone tip (landscape / Add to Home Screen).
- New intro to the fixes section: the evidence is mostly anecdotal, Dell advises against software and pressure methods, and readers should check the pixel policy first.
- "Wait" section rewritten. It now says user reports are anecdotal and quotes Dell's position.
- "Rapidly changing colours" now describes our stuck pixel fixer: the colours it flashes, drag over the pixel, can't revive dead pixels, and a recovered pixel can stick again. It has a bold photosensitivity warning, covers the confirmation tick box, the extra confirmation with reduce motion, and Esc or one tap to stop, and suggests short sessions.
- Pressure section: added "some manufacturers say it may void the warranty".
- Pixel policy: added a sentence on ISO 9241-307 (bright, dark and subpixel faults, fault classes per million pixels). I didn't add specific thresholds.
- Summary updated to match.
**Sources:**
- [Apple: About LCD display pixel anomalies](https://support.apple.com/en-us/102187)
- [Dell Display Pixel Guidelines](https://www.dell.com/support/kbdoc/en-us/000126004/dell-display-pixel-guidelines)
- [Lenovo: What are dead pixels](https://www.lenovo.com/us/en/glossary/what-is-dead-pixel/)
- [Lenovo monitor defective pixel policy](https://support.lenovo.com/us/en/solutions/ht002800-what-if-defective-pixel-is-found-on-your-montior-policy-and-standard-lenovo-monitors-and-all-in-one-desktop)
- [Dynabook pixel policy (ISO 9241-307 Class II)](https://asia.dynabook.com/pixelpolicy)
**Couldn't verify:**
- The ISO 9241-307 text itself. Fault types and classes are described from vendor policy pages only, which is why the post gives no numbers.
- Whether flashing-colour fixers work in any measurable way. There is no official or independent evidence, only anecdotes, and the post says so.
- The claim that pressing an OLED panel can create more faulty pixels. It is general caution and is kept as a warning.

### How to Test a Keyboard for Ghosting, Rollover and Chatter (`keyboard-ghosting-rollover-chattering-test.md`)
**Checked:**
- Keyboard matrix ghosting and blocking. Many 3-key combinations fail even on some "anti-ghosting" keyboards, and the protocol and software can also limit keys (Microsoft Applied Sciences anti-ghosting pages and FAQ).
- USB boot keyboard report: 8 modifiers plus 6 key codes. The report protocol isn't limited this way.
- 2KRO/6KRO/NKRO definitions.
- Chatter causes (worn or dirty switch), which matches the site text.
- Fn, Print Screen and Win/⌘ keys not reaching the browser (site FAQ and DeviceTests.astro).
- Tool features (DECISIONS #29, #57, #58).
**Changed:**
- 6KRO: the vague "standard simple USB keyboard report format" now names the boot format and says it has room for six regular keys plus the modifiers.
- Ghosting: "strictly means" a phantom key. Softened "Most modern keyboards" to "Most keyboards today". Noted that manufacturers also call blocking "ghosting".
- Anti-ghosting: added that some 3+ key combinations may still fail (Microsoft).
- Chatter: "tends to get worse" changed to "may get worse".
- Tool section: added that tested keys stay marked, the full-size layout, and the ANSI/ISO switch. Added the phone/tablet message and the **I have a keyboard connected** button.
- Rollover: added the **Most keys at once** counter, that the OS can limit it so it is a guide, and the macOS ⌘ key-up quirk.
- Chatter test: added the automatic chatter warning (registers again <30 ms after release, auto-repeat ignored). Kept the manual count method. Added that event timing is rounded and that the test can't measure polling rate.
- Debounce: "Some keyboard software" changed to "Some keyboards' companion software or firmware… may help".
- ANSI/ISO: removed "Keyboard testers usually show one layout", which is wrong for our tool. Added "choose ISO if your Enter key is tall".
**Sources:**
- [Microsoft: Keyboard Ghosting and the SideWinder X4](https://www.microsoft.com/applied-sciences/projects/anti-ghosting)
- [Microsoft: Anti-Ghosting FAQ](https://www.microsoft.com/applied-sciences/projects/anti-ghosting-faq)
- [USB-IF: Device Class Definition for HID 1.11](https://www.usb.org/sites/default/files/documents/hid1_11.pdf)
**Couldn't verify:**
- The exact boot-report byte layout (6 key codes plus modifiers). Search extracts confirmed it only through secondary sources such as Wikipedia "Key rollover" and devever.net, not from the HID 1.11 Appendix B text. It is widely documented, but please spot-check it.
- "Many USB keyboards stick to that limit": no official source.
- Debounce settings in keyboard software, and compressed air or hot-swap switch replacement fixing chatter. There was no official manufacturer documentation, only forum and community posts. Both are worded as "may/often".
- ANSI and ISO physical layout details. These are from general knowledge and match the site FAQ.

### Microphone Not Working on Windows or Mac? Try These Fixes (`microphone-not-working-windows-mac.md`)
**Checked:**
- Windows 11: Settings > System > Sound > Input, the device properties page, Input volume, Start test, and the audio enhancements suggestion.
- Windows 11: Privacy & security > Microphone toggles, including "Let desktop apps access your microphone". Browsers count as desktop apps.
- Windows: Get Help audio troubleshooter, and Device Manager update/uninstall. Microsoft's audio driver steps use "Sound, video and game controllers".
- macOS: System Settings > Sound > Input, input level meter and input volume. Digital inputs can't be adjusted from the Mac.
- macOS: Privacy & Security > Microphone. Apple says to quit the app before changing it.
- Mac orange dot and Control Center. Only one indicator shows, and green wins when the camera is also on.
- Chrome, Edge, Firefox and Safari site permission paths. Chrome lets you choose a default device. Chrome on managed devices: admin controls.
- HTTPS / secure context requirement (MDN).
- Tool features (DECISIONS #54–56).
**Changed:**
- Bluetooth: "paired, connected and charged".
- Windows input device steps: removed "check that it is allowed", which I couldn't verify. Replaced it with the arrow to properties, Input volume, and **Start test**. Added Microsoft's audio-enhancements tip.
- macOS Sound: added the note about digital mics and audio interfaces.
- macOS privacy: reordered to follow Apple (quit the app first, then change the setting, then reopen). Added "If the app isn't in the list it hasn't asked yet".
- Firefox: clear the block with the **×** next to **Blocked**. Settings path reworded to "scroll to Permissions, click Settings next to Microphone".
- Safari: "Settings for This Website" capitalisation now matches Apple's wording.
- Added "Menu names may differ" and a work/school IT policy line, which matches ProblemBox.
- Mic test paragraph expanded: device list, the Microphone details panel (name, sample rate, channels, EC/NS/AGC, "Not reported by this browser"), NS/EC toggles that restart the mic, the 5-second record and play back, and **Download recording** saved to the device with nothing uploaded.
- Mac indicator: an orange dot next to the Control Center icon, green if the camera is also in use.
- Windows drivers: added the Get Help audio troubleshooter. Device Manager now names both "Audio inputs and outputs" and "Sound, video and game controllers".
- Mac: replaced "drivers come with system updates" (unverified) with "you don't normally install drivers for the built-in microphone yourself", plus checking the maker's site for external mics and interfaces (Apple).
**Sources:**
- [Microsoft: Fix microphone problems](https://support.microsoft.com/en-us/windows/hardware/drivers/fix-microphone-problems)
- [Microsoft: How to set up and test microphones in Windows](https://support.microsoft.com/en-us/windows/how-to-set-up-and-test-microphones-in-windows-ba9a4aab-35d1-12ee-5835-cccac7ee87a4)
- [Microsoft: Turn on app permissions for your microphone in Windows](https://support.microsoft.com/en-us/windows/turn-on-app-permissions-for-your-microphone-in-windows-94991183-f69d-b4cf-4679-c98ca45f577a)
- [Microsoft: Fix sound or audio problems in Windows (Get Help troubleshooter)](https://support.microsoft.com/en-us/windows/fix-sound-or-audio-problems-in-windows-73025246-b61c-40fb-671a-2535c7cd56c8)
- [Microsoft: Update audio drivers in Windows](https://support.microsoft.com/en-us/windows/hardware/audio/update-audio-drivers-in-windows)
- [Microsoft: Windows camera, microphone, and privacy](https://support.microsoft.com/en-us/windows/privacy/windows-camera-microphone-and-privacy)
- [Apple: Change the sound input settings on Mac](https://support.apple.com/guide/mac-help/change-the-sound-input-settings-mchlp2567/mac)
- [Apple: Control access to the microphone on Mac](https://support.apple.com/guide/mac-help/control-access-to-the-microphone-on-mac-mchla1b1e1fe/mac)
- [Apple: If you can't record audio on a Mac](https://support.apple.com/en-us/102071)
- [Apple: Use Control Center on Mac (recording indicators)](https://support.apple.com/guide/mac-help/quickly-change-settings-mchl50f94f8f/mac)
- [Apple: Customize settings per website in Safari on Mac](https://support.apple.com/guide/safari/customize-settings-per-website-ibrw7f78f7fe/mac)
- [Google Chrome Help: Use your camera and microphone in Chrome](https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DDesktop)
- [Mozilla: How to manage your camera and microphone permissions with Firefox](https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions)
- [MDN: getUserMedia() (secure context)](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
**Couldn't verify:**
- The current Edge path and the old "Cookies and site permissions" name. Microsoft pages show both "Privacy, search, and services > Site permissions" and "Cookies and site permissions". I left the post's wording, which covers both and which TESTING.md says the original writer verified.
- Where Windows 11 shows the audio enhancements option. The post says "usually found on the same properties page".
- "Restart clears most device-in-use problems": general advice, kept.
- The Windows 11 Get Help search term for the specific Recording Audio troubleshooter. The post says "audio troubleshooter".

### Webcam Not Working in Your Browser? How to Fix It (`webcam-not-working-in-browser.md`)
**Checked:**
- Secure-context requirement and the localhost exception (MDN).
- Chrome, Edge, Firefox and Safari (Mac) permission steps. Chrome lets you choose a default camera.
- Windows 11 Privacy & security > Camera toggles. Edge and other browsers are desktop apps.
- Settings > Bluetooth & devices > Cameras.
- macOS Privacy & Security > Camera. Apps appear after they ask.
- Microsoft camera troubleshooting: privacy shutter or camera key (grey image or lock icon), Device Manager drivers, and the "camera in use by another app" error.
- iPhone: Settings > Apps > Safari > Camera (Ask/Deny/Allow).
- Chrome on Android: site info icon > Permissions, and Settings > Site settings > Camera.
**Changed:**
- Firefox: the step now says to click **×** next to **Blocked**, after which Firefox asks again.
- Safari: changed to "Settings for This Website".
- Added **Safari on iPhone or iPad** and **Chrome on Android** sections, worded like ProblemBox and checked against Apple and Google.
- Added the "menu names may differ" line and the work/school IT line.
- macOS: "Quit and reopen the browser so the change takes effect" changed to "If the browser was already open, quit and reopen it".
- One app at a time: "On many systems, especially Windows, only one app can use a webcam" changed to "Often only one app can use a webcam at a time". Windows 11 now has a multi-app camera option, which I couldn't confirm officially, so I don't mention it.
- Camera key: added the grey image or lock icon symptom (Microsoft).
- Test paragraph: added the camera list, the real resolution and frame rate readouts, on-page fix steps, and that snapshots are only saved if you choose to save them.
**Sources:**
- [MDN: getUserMedia() (secure context)](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Google Chrome Help: Use your camera and microphone in Chrome (desktop)](https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DDesktop)
- [Google Chrome Help: Change site settings permissions (Android)](https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DAndroid)
- [Mozilla: How to manage your camera and microphone permissions with Firefox](https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions)
- [Apple: Customize settings per website in Safari on Mac](https://support.apple.com/guide/safari/customize-settings-per-website-ibrw7f78f7fe/mac)
- [Apple: Control access to the camera on Mac](https://support.apple.com/guide/mac-help/control-access-to-your-camera-mchlf6d108da/mac)
- [Apple: Control access to hardware features on iPhone](https://support.apple.com/guide/iphone/control-access-to-hardware-features-iph168c4bbd5/ios)
- [Microsoft: Manage app permissions for a camera in Windows](https://support.microsoft.com/en-us/windows/privacy/manage-app-permissions-for-a-camera-in-windows)
- [Microsoft: Camera doesn't work in Windows](https://support.microsoft.com/en-us/windows/camera-doesn-t-work-in-windows-32adb016-b29c-a928-0073-53d31da0dad5)
- [Microsoft: My camera isn't working in Microsoft Teams (privacy shutter/key)](https://support.microsoft.com/en-us/teams/meetings/my-camera-isn-t-working-in-microsoft-teams)
- [Microsoft: Manage cameras with Camera settings in Windows 11](https://support.microsoft.com/en-us/windows/hardware/camera/manage-cameras-with-camera-settings-in-windows-11)
**Couldn't verify:**
- Whether macOS needs the browser restarted after a camera permission change. Apple's camera page doesn't say, so it is worded conditionally. Apple's microphone guidance does say to quit the app.
- The "Settings for Websites" heading label on iPhone. Apple confirms Settings > (Apps >) Safari > Camera, but not that heading. It matches ProblemBox.
- The Edge path: same note as the microphone post.

### Why Is My Webcam Blurry? Common Causes and Fixes (`why-is-my-webcam-blurry.md`)
**Checked:**
- Lens cleaning with a soft lint-free cloth, and lighting from the front without a backlight (Apple).
- Low light causes grain, motion blur and lower frame rate, and brightening in software adds noise (Logitech).
- Autofocus fixes: cover and uncover the lens, manual focus in the companion app. Digital zoom softens the image (Logitech).
- Browser default resolution: W3C says implementations tend to default to 640×480 at 30 fps. Constraints are ideal, so the closest available is used.
- USB bandwidth: Logitech Brio needs USB 3.0 for 4K, and USB 2.0 is limited to 1080p/30.
- Windows 11 Camera settings (brightness, contrast and more, depending on camera and version).
- Wi-Fi and bandwidth affect video calls (Apple).
**Changed:**
- "Poor lighting is the biggest cause" changed to "one of the most common causes" (unverifiable superlative).
- Cleaning: "dry, soft, lint-free cloth".
- Focus: added Logitech's cover/uncover autofocus tip, the manual-focus option, and the digital zoom note.
- Resolution: added "at 30 frames per second" (W3C).
- The webcam test paragraph now explains **Requested quality** (default/720p/1080p/4K) and that it shows the real resolution and frame rate.
- USB: added the Logitech Brio 4K / USB 3.0 example.
- Windows 11 camera settings wording made more precise.
- Removed "Built-in laptop cameras are often small" and replaced it with "have to fit into thin screens, and older ones in particular can struggle in low light".
**Sources:**
- [Apple: Use the camera on Mac (improve image quality)](https://support.apple.com/guide/mac-help/use-the-camera-mchlp2980/mac)
- [Logitech: Improving the image quality for Logitech Webcams](https://support.logi.com/hc/en-001/articles/360023206914-Improving-the-image-quality-for-Logitech-Webcams)
- [Logitech: My video looks out of focus](https://support.logi.com/hc/en-gb/articles/360023362433-My-video-looks-out-of-focus)
- [Logitech: Why does my webcam video look out of focus when using BRIO 505](https://support.logi.com/hc/en-au/articles/13100856138775-Why-does-my-webcam-video-look-out-of-focus-when-using-BRIO-505)
- [Logitech: What type of cable does BRIO come with (USB 3.0 for 4K)](https://support.logi.com/hc/en-150/articles/360023363813-What-type-of-cable-does-BRIO-come-with)
- [Logitech: Specification - BRIO 4K Webcam](https://support.logi.com/hc/en-au/articles/4415100718359-Specification-BRIO-4K-Webcam)
- [W3C: Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
- [Microsoft: Manage cameras with Camera settings in Windows 11](https://support.microsoft.com/en-us/windows/hardware/camera/manage-cameras-with-camera-settings-in-windows-11)
**Couldn't verify:**
- "Many laptop webcams have fixed focus designed for a typical sitting distance". No official source, but it is plausible and kept as general advice.
- "Some apps have an HD video option that may need turning on". This is true for some apps, but I didn't check it against a specific vendor page.
- "Avoid spraying liquid directly on the camera": general cleaning advice, kept.

## Notes on on-site fix steps (ProblemBox)
None of the official sources showed ProblemBox to be wrong. I didn't edit ProblemBox. Minor wording notes:
- **Chrome desktop:** ProblemBox says "site controls icon". Chrome Help extracts call it "View site information" / site information icon. Both describe the icon to the left of the address bar. You may want to say "site information (site controls) icon".
- **Edge:** ProblemBox says "lock icon > Permissions for this site". I couldn't confirm that label from Microsoft extracts, which only cover the Settings path (Privacy, search, and services > Site permissions, or the older Cookies and site permissions). It's worth a manual check in current Edge.
- **Firefox, Safari Mac, Safari iPhone (Settings > Apps > Safari), Chrome Android, Windows 11 and macOS privacy paths:** consistent with Mozilla, Apple, Google and Microsoft documentation.
- **Android "Settings > Apps > Chrome > Permissions":** not checked against Google documentation (general Android behaviour).
