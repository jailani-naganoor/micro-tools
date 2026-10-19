# Project conventions

Two static Astro sites (`apps/working-days`, `apps/device-test`) sharing `packages/ui`, in an npm
workspaces monorepo. Read README.md for commands and DECISIONS.md for why things are the way
they are.

## Ground rules

- **Static and private by default.** No backend, database, accounts or form submissions. Tools run
  entirely in the browser. Device Test media (audio, video, snapshots, recordings) must never leave
  the device: no `fetch`/upload of media, blob URLs only, CSP `connect-src 'self'`.
- **Nothing external loads while env flags are off.** No CDNs, web fonts, third-party scripts or
  images. The E2E fixture (`packages/ui/testing/fixtures.ts`) fails any test that makes a
  cross-origin request or logs a console error. Keep it that way.
- **Ads and analytics are off unless `PUBLIC_ADS_ENABLED` / `PUBLIC_CF_ANALYTICS_TOKEN` are set.**
  When off, render nothing at all: no ad boxes, scripts or reserved space. Ads never go inside or
  directly beside tool controls, are never sticky, and are always labelled "Advertisement".
- **Don't deploy, buy domains or add real ad/analytics IDs.**
- **Pin dependency versions** (`.npmrc` has `save-exact=true`). Playwright is pinned to the version
  whose Chromium is preinstalled in the cloud environment (1.56.1 → Chromium 141).

## Code style

- Astro components plus small vanilla TypeScript modules in `src/scripts/`, loaded with
  `<script>` tags that Astro bundles as external files. No React. No inline scripts: the CSP is
  `script-src 'self'` (JSON-LD data blocks are fine). `vite.build.assetsInlineLimit` is 0 for this
  reason.
- Tailwind 4 with design tokens in `packages/ui/src/styles/base.css` (`bg-bg`, `text-fg`,
  `text-muted`, `border-line`, `bg-surface`, `text-accent`, …). Use the tokens, not raw colours, so
  light and dark themes both stay at WCAG AA contrast. Dark mode is `[data-theme='dark']`, set by
  `public/head.js` before first paint.
- System font stack only. Minimal animation; `prefers-reduced-motion` is respected globally.
- Plain, friendly English. No hype, invented stats, fake reviews or unverifiable claims.
- Keep layout shift at zero: reserve space for anything JS fills in (result panels, holiday list,
  tab panels, ad slots).
- Astro's HTML compression drops the space between text and a link that starts a new source line.
  End the previous line with `{' '}`.

## Shared package (`packages/ui`)

Import with subpaths: `@micro/ui/layouts/BaseLayout.astro`, `@micro/ui/components/AdSlot.astro`,
`@micro/ui/lib/seo` (TS modules without extension), `@micro/ui/testing/fixtures`. Build-time env
access goes through `getEnv()` in `lib/env.ts`, never `import.meta.env` directly. Each app's
`astro.config.mjs` loads `.env` into `process.env`.

`integrations/cloudflare-headers.ts` writes `dist/_headers` (CSP, Permissions-Policy, caching,
noindex for `*.pages.dev`) and `dist/ads.txt` when a publisher ID is set. Change headers there,
not in `public/`.

## Working days specifics

- Dates are `YYYY-MM-DD` strings converted to integer epoch days via `Date.UTC`. Never do local
  `Date` arithmetic. Format for display with `timeZone: 'UTC'`.
- Holiday data: `scripts/build-holiday-data.mjs` splits date-holidays into per-country JSON files
  in `src/data/holidays/` (generated, committed, CC BY-SA 3.0). Only `public` and `bank` holidays
  count. `aliases.mjs` swaps moment-timezone for a UTC-only shim and trims the astronomia index.
  The unit test "matches the full date-holidays package" proves the browser build gives identical
  results. Run it after any change there.
- URL query parameters are the share format (`mode, start, end, inc, days, op, country, region,
  weekend, weekdays, skip, off`). Keep them backwards compatible.

## Device test specifics

- Tabs follow the WAI-ARIA tabs pattern. Panel ids are `panel-<tab>` so the `#<tab>` hash never
  scrolls the page.
- Every getUserMedia failure goes through `classifyError` → `describeProblem` → `ProblemBox`.
- The keyboard test must never trap focus: Tab is recorded but not prevented.

## Blog

Markdown in `apps/*/src/content/blog/`, schema in `packages/ui/src/lib/blog.ts`. Posts default to
`draft: true` and are not built, linked or listed in the sitemap until a person sets
`draft: false`. Preview drafts locally with `SHOW_DRAFTS=true`.

## Before committing

`npm run build && npm run check && npm run lint && npm run test:unit && npm run test:e2e`.
Run `npm run lighthouse` after layout or bundle changes (target: 95+ mobile in every category, CLS 0).
