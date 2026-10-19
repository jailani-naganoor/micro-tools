# Decisions

Choices made where the brief was open or ambiguous. Each one is the simplest sensible option
and can be revisited.

## Repository and tooling

1. **Placeholder origins.** The default `SITE_URL`s are `https://working-days.example.com` and
   `https://device-test.example.com` (`example.com` is reserved for documentation), with
   `https://community.example.com` for the community site and `hello@example.com` for contact.
   All are env-driven.
2. **Publisher name.** No business name was given, so `PUBLISHER_NAME` defaults to "Micro Tools"
   (copyright line, JSON-LD and legal pages). Change it before launch.
3. **Pinned versions.** Astro 7.4.0, Tailwind 4.3.3, Vitest 5.0.5, ESLint 10 and the rest are
   pinned exactly. **TypeScript is 5.9.3**, not 7.x, because `@astrojs/check` supports TS 5–6 only.
   **Playwright is 1.56.1**, not the latest, because it matches the Chromium build preinstalled
   in the cloud build environment (no browser download needed).
4. **Shared package uses source files.** `packages/ui` has no build step; apps import `.astro` and
   `.ts` files directly through subpath exports. Simpler, and Astro/Vite compile them.
5. **`public/head.js` is duplicated** in both apps (it must be served from each site's own origin).
   It is tiny and identical.
6. **Custom `sitemap.xml` endpoint** instead of `@astrojs/sitemap`. The integration writes
   `sitemap-index.xml`, and the brief asked for `sitemap.xml`. Each site has six static pages plus
   published posts, so a 20-line endpoint is simpler.
7. **Trailing slashes everywhere** (`trailingSlash: 'always'`, directory output). This matches how
   Cloudflare Pages serves `about/index.html` and keeps canonicals consistent.
8. **Prettier is configured but was not run across the repo.** ESLint is the enforced check;
   `npm run format` is available.

## Working Days Calculator

9. **Counting convention.** "Between" counts from the start date up to the end date. By default
   the start date is included and the end date is not, like many online date calculators. Two tick
   boxes, "Include the start date" and "Include the end date", change this: for Monday to Friday of
   one week, both = 5 days, one of them = 4, neither = 3. A one-day range (start = end) counts 1 only
   when both are included, so the default still gives 0, as before. Excel's `NETWORKDAYS` counts both
   dates, so tick both boxes to match it. A note under the result explains the current count in
   words. **Add/subtract** never counts the start date (1 working day after Friday is Monday), like
   Excel's `WORKDAY`.
10. **Reversed dates are swapped** and the result shows a note, rather than a negative number.
11. **Holidays on weekends** count once, as weekend days. Substitute or observed days come from
    the date-holidays data where the country defines them.
12. **Holiday types.** Only date-holidays types `public` and `bank` are days off. `optional`,
    `school` and `observance` (e.g. Mother's Day) are ignored.
13. **Regions.** The region selector offers date-holidays' state level (US states, UK nations,
    German Länder, …), not the third "region" level, to keep the UI simple.
14. **"No public holidays" option** added to the country list for weekend-only counts.
15. **Weekend is independent of country** and defaults to Saturday–Sunday everywhere, including the
    UAE (whose federal weekend has been Saturday–Sunday since 2022). The seven day toggles are always
    visible (no layout shift); editing them switches the pattern to "Custom".
16. **Default country** comes from `navigator.languages` (`en-GB` → United Kingdom, `de` → Germany),
    falling back to the United States. A country in the URL always wins.
17. **The URL only changes after the user changes something**, so visiting `/` doesn't rewrite the
    address with today's date. "Copy link" always builds a full URL.
18. **Supported range** is 1900–2199 and up to 10,000 working days, to bound the work done
    in the browser.
19. **Per-country holiday data, lazy-loaded.** The full date-holidays dataset plus its dependencies
    is more than 1 MB. A script splits the data into one JSON file per country (1–19 KB each). The
    parser loads as a separate chunk after the page renders. Generated files are committed so
    Cloudflare needs no extra build step.
20. **Slimmed date-holidays-parser dependencies** (`aliases.mjs`):
    - moment-timezone's default entry (about 700 KB of time zone history) is replaced by a shim that
      registers each zone the data mentions as UTC. We only use each holiday's calendar date, which
      doesn't depend on offsets. A unit test compares our results with the unmodified package for
      every country and region across seven years from 1950 to 2100: identical.
    - The `astronomia` index is replaced with the six modules actually used. Its planetary data is
      kept, because Singapore's Chinese New Year calculation needs it; a test checks those dates.
21. **Holiday data licence.** date-holidays data is CC BY-SA 3.0 (from Wikipedia). It is credited
    in "How it works" and on the About page, and the generated subset carries the same licence
    (`src/data/holidays/README.md`).
22. **Copy result** copies a plain-text summary plus the share link. "Copy link" was added too.


### Working Days improvements (branch `improvements-1`)

46. **Start date in the URL.** The start date is included by default, so `incs=0` is only written
    when it is unticked. Links made before this change have no `incs` and behave exactly as before.
47. **Working hours** = working days × hours per day, rounded to two decimals. Hours per day accepts
    0.25–24, decimals allowed (`hours=7.5`). The default of 8 is not written to the URL. Add mode
    shows hours for the requested number of working days. It doesn't model part days or shifts.
48. **"Working days in [year]" table** sits directly under the calculator (above the result ad
    slot, so no ad sits beside its controls). It uses the same country, region, weekend, unticked
    holidays and custom days off as the calculator, and counts every day of each month (the start/end
    tick boxes don't apply). The year selector offers the current year ±2 and defaults to the current
    year; the chosen year is not stored in the URL. The table is rendered with placeholder cells so
    filling it in causes no layout shift.
49. **Country list is alphabetical** now that there are 41 countries. The default still comes from
    the browser language (#16).
50. **Countries added (27):** Austria, Bahrain, Belgium, Croatia, Czechia, Denmark, Finland, Greece,
    Hong Kong, Hungary, Indonesia, Italy, Kenya, Luxembourg, Malaysia, Netherlands, Nigeria, Norway,
    Pakistan, Poland, Portugal, Romania, Slovakia, Sri Lanka, Sweden, Switzerland and Thailand. Each
    one passes the "matches the full date-holidays package" test for every region and seven sample
    years. Files are 1–15 KB each and still lazy-loaded; the initial calculator script is about
    24 KB (was 18 KB) because of the new features, not the data.
51. **Countries left out:**
    - **Not in date-holidays 3.37.0:** Qatar, Kuwait, Oman, Nepal.
    - **Saudi Arabia:** the data has one day each for Eid al-Fitr and Eid al-Adha, while the official
      Eid breaks are several days, so counts would be clearly too high.
    - **Vietnam:** only two days are listed for Tết (Lunar New Year), while the official break is
      several days.
    - **Bangladesh:** the data still lists holidays such as National Mourning Day (15 August) that
      we could not confirm are current days off.
    These can be added later if the data improves, or by overriding the rules in the build script.
52. **Lunar and Islamic holidays** (Malaysia, Indonesia, Pakistan, Bahrain, UAE, Sri Lanka, …) are
    calculated in advance by date-holidays. Official dates are often confirmed close to the day and
    can differ by one day. The FAQ says so; users can untick a holiday and add a day off.

## Device Test

23. **Site name "Device Test"** (short, for the header); the H1 and title carry the keywords.
24. **Tabs** use buttons with the WAI-ARIA tabs pattern and `history.replaceState` for the hash, so
    switching tabs doesn't fill the back-button history. Panels are `panel-*` ids so the hash never
    scrolls. The panel area has a reserved minimum height to avoid layout shift when a hash link
    opens a different tab.
25. **Leaving a tab stops the mic/camera**, so the browser's "in use" indicator goes off.
26. **Mic level** is the peak amplitude on a −60…0 dB scale shown as 0–100%. "Sound detected"
    shows once the level passes 35%. The analyser is never connected to the speakers (no feedback).
27. **Webcam quality** offers "camera default / 720p / 1080p / 4K" as *ideal* constraints and
    reports the real resolution, the measured frame rate (`requestVideoFrameCallback`) and the
    camera-reported rate.
28. **Snapshots** are mirrored when the preview is mirrored (what you see is what you save), and
    saved only by the user clicking a `download` link to a local blob URL.
29. **Keyboard layout** is full size (function row, navigation cluster and numpad) in a
    horizontally scrollable box on small screens. Labels are US/UK legends; the readout shows the
    real `key` for the user's language. The ISO Enter is drawn as two pieces that light up together.
30. **Keyboard capture** listens on the document while the tab is open and suppresses default
    actions (scrolling, quick-find), except Tab, browser shortcuts with Ctrl/⌘/Alt, F5, F11 and
    F12, and keys pressed on form controls, so the page stays keyboard operable.
31. **Dead pixel test** has 9 colours (black, white, red, green, blue, cyan, magenta, yellow, grey).
    It ends automatically after the last colour. This also gives iPhone users, who have no Esc key
    and may not get full screen, a way out.
32. **Permission-denied E2E tests** use Chromium's fake devices and make `getUserMedia` reject with
    `NotAllowedError`, which is what browsers return when access is blocked. Headless Chromium
    can't produce a real block: `--deny-permission-prompts` returns `NotSupportedError`, and new
    headless waits on the prompt. `NotSupportedError` itself maps to the "unsupported browser"
    message.
33. **Browser fix steps** cover Chrome, Edge, Firefox, Safari (Mac), Safari (iPhone/iPad), Chrome
    (Android) and OS privacy settings (Windows 11, macOS). They are worded to survive small UI
    changes. See the manual checks in TESTING.md.

## SEO, privacy and ads

34. **Drafts aren't built at all** in production: no page, no sitemap entry, no link. The blog
    index says nothing is published yet. With `SHOW_DRAFTS=true` they render with `noindex` and a
    "Draft" label.
35. **Organization JSON-LD** is on every page; inner pages add BreadcrumbList; home pages add
    WebApplication and FAQPage; posts add Article. The Organization `logo` is `icon-512.png`.
36. **noindex for `*.pages.dev`** is done twice: an `X-Robots-Tag` rule in `_headers` using
    Cloudflare's `https://:project.pages.dev/*` host matching, and a meta tag added by
    `head.js` for crawlers that render JavaScript.
37. **`_headers` is generated at build time**, so the CSP always matches the env flags:
    `script-src 'self'` and `connect-src 'self'` while ads and analytics are off; AdSense and
    Cloudflare sources are added only when their flags are on. The file's comments show the AdSense
    additions. `style-src` allows `'unsafe-inline'` (Astro inlines the stylesheet, and AdSense
    injects inline styles).
38. **Permissions-Policy.** Working Days: camera, microphone, geolocation, payment, usb and
    browsing-topics all `()`. Device Test: `camera=(self)`, `microphone=(self)`, `fullscreen=(self)`.
    Note that `browsing-topics=()` may slightly limit ad targeting once ads are on; remove it then
    if you want Topics-based ads.
39. **HSTS** is `max-age=31536000` without `includeSubDomains`/`preload`, so it can't affect other
    subdomains you might run.
40. **Consent Mode v2 defaults are denied everywhere**, not only in the EEA/UK/CH. This is the
    safest default; if you want personalised ads elsewhere, add region-specific defaults in
    `packages/ui/src/scripts/consent.ts` or let your CMP update consent.
41. **Ad slots need both** `PUBLIC_ADS_ENABLED=true` and `PUBLIC_ADSENSE_CLIENT`, so a half-set
    config never shows empty boxes. Reserved heights: 300 px (result, content) and 620 px (sidebar,
    desktop only). The sidebar sits beside the content below the tool, never beside the tool.
42. **Cookie settings** opens Google's Privacy & messaging CMP if it is installed
    (`googlefc.showRevocationMessage`); otherwise a dialog says what the site actually does today.
43. **Theme choice** is saved in `localStorage` only when the user presses the toggle. Pressing it
    back to the system theme clears it. The privacy policy says so.
44. **Privacy and terms text is rendered from the env flags**, so it always matches what the build
    loads. The ads/analytics sections are marked `REVIEW BEFORE ENABLING` in the source. Neither
    page names a governing law; that is a launch checklist item.
45. **Blog posts were drafted by AI** and fact-checked where possible (worked date examples were
    verified by script). Items to verify by hand are listed in TESTING.md.
