# Testing

## Automated results (18 October 2026, branch `initial-build`)

Environment: Linux cloud container, Node 22.22.0, npm 10.9.4, Chromium 141 (Playwright 1.56.1),
Lighthouse 13.5.0. All env flags off (no ads, no analytics, drafts hidden).

| Check | Command | Result |
| --- | --- | --- |
| Build | `npm run build` | ✅ Both sites build (7 pages each, plus `robots.txt` and `sitemap.xml`) |
| Type check | `npm run check` | ✅ 0 errors, 0 warnings in both apps (one deprecation hint for the `execCommand` copy fallback) |
| Lint | `npm run lint` | ✅ No problems |
| Unit tests | `npm run test:unit` | ✅ 32/32, run in three time zones: system (UTC), `Pacific/Kiritimati` (UTC+14) and `America/Los_Angeles` |
| E2E: Working Days | `npm run test:e2e -w @micro/working-days` | ✅ 41/41 |
| E2E: Device Test | `npm run test:e2e -w @micro/device-test` | ✅ 48/48 (two projects: media allowed and media denied) |
| Lighthouse mobile | `npm run lighthouse` | ✅ 100 in every category on all 8 pages tested, CLS 0 (table below) |
| External requests with flags off | E2E fixture | ✅ None: every E2E test fails on any cross-origin request |
| Console errors | E2E fixture | ✅ None: every E2E test fails on a console error (except the deliberate 404 and CSP-violation tests) |

### Lighthouse (mobile preset, simulated throttling)

| Site | Page | Performance | Accessibility | Best practices | SEO | CLS | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| working-days | `/` | 100 | 100 | 100 | 100 | 0 | 1.26 s | 38 ms |
| working-days | `/about/` | 100 | 100 | 100 | 100 | 0 | 1.21 s | 0 ms |
| working-days | `/blog/` | 100 | 100 | 100 | 100 | 0 | 1.21 s | 0 ms |
| working-days | `/privacy/` | 100 | 100 | 100 | 100 | 0 | 1.25 s | 0 ms |
| device-test | `/` | 100 | 100 | 100 | 100 | 0 | 1.12 s | 0 ms |
| device-test | `/#keyboard` | 100 | 100 | 100 | 100 | 0 | 1.43 s | 0 ms |
| device-test | `/about/` | 100 | 100 | 100 | 100 | 0 | 1.25 s | 0 ms |
| device-test | `/privacy/` | 100 | 100 | 100 | 100 | 0 | 1.21 s | 0 ms |

Fixed during testing: the first run scored accessibility 97 on `/#keyboard` (an `aria-label` on
a plain `div`; it now has `role="region"`), and the calculator bundle was cut from 1 MB to an
18 KB initial script plus a lazily loaded holiday engine (see DECISIONS.md #19–20). Lighthouse
on localhost doesn't see the Cloudflare `_headers`, so re-run it against the live domain after
launch (PageSpeed Insights).

### What the automated tests cover

**Unit (Vitest, `apps/working-days/tests/unit`)**
- Date parsing and validation, weekdays (including before 1970), leap years, month arithmetic,
  local "today".
- Counting: plain weeks, include/exclude the end date, same-day ranges, reversed dates,
  Fri–Sat and Sun-only weekends, holidays on weekdays and weekends, custom days off, whole leap
  and non-leap years, a 100-year range, the leap day, DST transition weeks, invalid input.
- Adding/subtracting: across weekends, zero days, starting on a weekend, skipping holidays and
  days off in both directions, year boundaries and leap days, agreement with counting, limits.
- Holiday data: UK (England) 2026 bank holidays, US observed Independence Day, UK region-specific
  holidays, every country loads, Singapore lunar holidays, and a full comparison against the
  unmodified date-holidays package for every country and region across seven years from 1950 to 2100.

**E2E: Working Days (Playwright)**
- Home page SEO (title/description length, canonical, one H1, OG image, JSON-LD types), no ad
  markup while ads are off, URL untouched until the user changes something, country from locale.
- Calculator: Scottish holidays plus a day off (19 days), end-date toggle, unticking a holiday (URL
  `skip`, focus kept, survives reload), adding and removing days off, weekend presets and custom
  weekdays, reversed-date note, region list per country, add mode over Christmas, mode switch plus
  subtract, invalid input, copy result (clipboard content), result above the fold on a 390 px
  phone with no horizontal scroll, theme toggle persistence, keyboard operation of the mode switch.
- Site: crawls every internal link (all 200), SEO and breadcrumbs on each inner page, truthful
  privacy text, drafts hidden (post URL is 404), 404 page with `noindex`, `robots.txt`,
  `sitemap.xml`, manifest, commented-only `ads.txt`, cookie settings dialog.
- Production headers: the calculator works under the generated CSP and Permissions-Policy, and the
  CSP blocks an injected inline script.
- Accessibility: axe-core WCAG 2.2 A/AA on six pages and states, in light and dark themes.

**E2E: Device Test (Playwright, fake camera and microphone)**
- Home SEO and JSON-LD; tab clicks update the hash; direct links to all four hashes open the right
  tab without scrolling; arrow/Home/End keys move between tabs; hash changes switch tabs.
- Mic: start, device list, track settings, "sound detected", 5-second recording to a `blob:` URL,
  stop; leaving the tab releases the mic; no non-GET requests (nothing uploaded).
- Webcam: preview, resolution and fps readouts, mirror on/off, snapshot as a `blob:` download,
  quality change, stop; no non-GET requests.
- Errors: permission denied (fix steps for six browsers, `role="alert"`), unsupported browser,
  insecure context, no camera found, camera in use.
- Keyboard: highlight and readouts (`key`, `code`, `keyCode`, location), held-key state, Space and
  arrows don't scroll, count, reset, ISO layout extra key, Tab moves focus (no keyboard trap).
- Dead pixel: colour cycling by click and arrow keys, Esc exits and returns focus, finishes after
  the last colour.
- Site: all internal links, inner-page SEO and breadcrumbs, privacy wording, drafts hidden, 404,
  `robots.txt`, `sitemap.xml`, `ads.txt`.
- Production headers: everything works under `camera=(self)`, `microphone=(self)` and the strict CSP.
- Accessibility: axe-core on every tab, inner pages, running mic/webcam/keyboard states and the
  denied error box, in light and dark themes.

### Also checked by hand during the build
- An ads-on build (`PUBLIC_ADS_ENABLED=true` with a dummy publisher ID): three labelled slots
  (result, mid-content, desktop sidebar beside the content, not the tool), the Consent Mode
  loader, the widened CSP, a generated `ads.txt` line and the "ads" wording in the privacy policy
  and cookie dialog. The sandbox blocks Google's servers, so real ad rendering was not tested.
- A `SHOW_DRAFTS=true` build: all 10 posts render with the "Draft" label, `noindex` and Article
  JSON-LD, and stay out of the sitemap.
- Screenshots of both sites at desktop and phone widths, light and dark.

## Manual test list (for you)

Please run these on real devices and browsers before launch. Tick them off as you go.

### Both sites
- [ ] Chrome, Edge, Firefox and Safari (Mac): pages look right in light and dark mode; the theme
      toggle works and is remembered.
- [ ] iPhone (Safari) and Android (Chrome): the tool is visible without scrolling; no sideways scroll.
- [ ] Keyboard only: Tab through each page; focus is always visible; nothing traps focus.
- [ ] Screen reader spot check (VoiceOver or NVDA): the result is announced after a change; tab
      names and errors are read out.
- [ ] Zoom to 200%: content reflows and stays usable.
- [ ] Footer links, Cookie settings dialog, 404 page.
- [ ] After deploying to a `*.pages.dev` URL: response headers include the CSP,
      Permissions-Policy and `X-Robots-Tag: noindex` (DevTools → Network → document → Headers).
      The custom domain must **not** have `X-Robots-Tag: noindex`.
- [ ] Share previews: paste each home URL into a chat app or social post composer and check
      the title, description and image.
- [ ] Validate structured data with Google's Rich Results Test on each home page and one inner page.

### Working Days Calculator
- [ ] Compare a few results with a source you trust (e.g. your HR calendar or a government
      holiday page) for your main countries and regions.
- [ ] Spot check holidays for each of the 14 countries for the current and next year.
- [ ] Copy result and Copy link on desktop and mobile; open a copied link in a private window and
      check it shows the same result.
- [ ] Date pickers behave well on iOS and Android.

### Device Test
- [ ] Mic test with a built-in mic, a USB mic and a Bluetooth headset; switch devices in the list.
- [ ] Record and play back on Chrome, Firefox and Safari (Safari records in a different format).
- [ ] Webcam with built-in and external cameras; try 720p/1080p; check the mirror and snapshot download.
- [ ] Deny permission in each browser, then follow the on-page steps to re-allow it. **Check the
      wording of each browser's steps against its current UI**: menus change between versions.
- [ ] Open the site over plain `http://` on a LAN IP to see the insecure-context message.
- [ ] Keyboard test on an ANSI and an ISO keyboard (and a Mac keyboard); check Fn and media
      keys behave as described.
- [ ] Dead pixel test: full screen on desktop; on iPhone the colours fill the browser and the test
      ends after the last colour.
- [ ] Confirm the browser's camera/mic "in use" indicator turns off when you press Stop or switch tabs.

### Blog drafts (all `draft: true`)
- [ ] Read all 10 posts and set `draft: false` only on those you approve.
- [ ] Device posts: check the Windows 11, macOS, Chrome, Firefox and Safari settings paths. The
      writer verified the Edge path against Microsoft's documentation but wrote the others from
      knowledge.
- [ ] Working-days posts: check the Excel/Sheets `NETWORKDAYS`, `NETWORKDAYS.INTL`, `WORKDAY` and
      `WORKDAY.INTL` syntax and weekend codes, the list of Friday–Saturday countries, the US
      observed-holiday rule, UK substitute days, and the US Veterans Day shipping example. The UAE
      2022 weekend change and Australia's 2026 Anzac Day arrangements were checked against official
      sources by the writer.
