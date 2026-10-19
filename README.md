# micro-tools

Two small, independent, ad-ready utility sites in one npm workspaces monorepo. Each tool works
entirely in the browser on its home page; there is no backend, database or account system.

| Site | Folder | What it does |
| --- | --- | --- |
| Working Days Calculator | `apps/working-days` | Count business days between two dates, or add/subtract business days, with public holidays for 14 countries (date-holidays), custom weekends and days off. State is kept in the URL. |
| Device Test | `apps/device-test` | Online mic, webcam, keyboard and dead pixel tests in four hash-linked tabs (`#mic`, `#webcam`, `#keyboard`, `#screen`). Audio and video never leave the device. |

Shared code lives in `packages/ui` (layout, SEO head and JSON-LD, header, footer, theme toggle,
cookie settings, consent hook, ad slots, analytics loader, legal page text, blog components,
`_headers` generator and test fixtures).

Stack: Astro 7 (static output), Tailwind CSS 4, TypeScript, small vanilla TS scripts, Vitest,
Playwright, axe-core and Lighthouse. All dependency versions are pinned (`save-exact`).

## Local development

Requirements: Node.js 22.12 or later (22.22.3+ recommended; see `.nvmrc`) and npm 10+.

```bash
npm install
npm run dev:wd      # Working Days Calculator → http://localhost:4321
npm run dev:dt      # Device Test → http://localhost:4321 (run one at a time, or pass --port)
npm run build       # build both sites into apps/*/dist
```

Preview a production build of one site:

```bash
npm run build -w @micro/working-days
cd apps/working-days && npx astro preview --ignore-lock --port 4321
```

> Astro 7's `astro preview` runs as a background server with a lock file. Use `--ignore-lock`
> to run several at once, and `npx astro preview stop` to stop the background one.

Microphone and camera access needs a secure context: `http://localhost` counts as secure, but a
LAN address such as `http://192.168.x.x` does not.

### Checks and tests

```bash
npm run check       # astro check (TypeScript) for both apps
npm run lint        # ESLint
npm run test:unit   # Vitest, run in three time zones
npm run test:e2e    # Playwright for both sites (builds and previews each site itself)
npm run lighthouse  # Lighthouse mobile on the built previews (run `npm run build` first)
npm test            # unit + e2e
```

Playwright uses Chromium. Outside the cloud environment this repo was built in, install it once
with `npx playwright install chromium`. Lighthouse uses the same Chromium (or `CHROME_PATH`).

Other scripts:

- `npm run images` regenerates favicons, app icons and `og.png` for both sites from each
  `public/favicon.svg`.
- `npm run holidays -w @micro/working-days` regenerates the per-country holiday data after
  upgrading `date-holidays`.

## Environment variables

Set these in `apps/<site>/.env` locally (see `.env.example`) or in Cloudflare Pages under
**Settings → Variables and Secrets** for each project. All are optional and the defaults are safe.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SITE_URL` | `https://working-days.example.com` / `https://device-test.example.com` | Canonical origin, used in canonical URLs, Open Graph tags, `robots.txt` and `sitemap.xml`. No trailing slash. |
| `COMMUNITY_URL` | `https://community.example.com` | Community site linked under each tool. |
| `WORKING_DAYS_URL` | `https://working-days.example.com` | Link from Device Test to the calculator. |
| `DEVICE_TEST_URL` | `https://device-test.example.com` | Link from the calculator to Device Test. |
| `CONTACT_EMAIL` | `hello@example.com` | Shown on `/contact/`, privacy and terms pages. |
| `PUBLISHER_NAME` | `Micro Tools` | Copyright line, JSON-LD organisation and legal pages. |
| `SHOW_DRAFTS` | `false` | `true` renders `draft: true` blog posts (with `noindex`) for local review. Never set it in production. |
| `PUBLIC_ADS_ENABLED` | `false` | Turns on ad slots, the AdSense loader and the AdSense CSP sources. Needs `PUBLIC_ADSENSE_CLIENT` too. |
| `PUBLIC_ADSENSE_CLIENT` | empty | AdSense publisher ID, e.g. `ca-pub-1234567890123456`. Also writes `ads.txt`. |
| `PUBLIC_ADSENSE_SLOT_RESULT` / `_CONTENT` / `_SIDEBAR` | empty | Optional ad unit IDs for the three placements. |
| `PUBLIC_CF_ANALYTICS_TOKEN` | empty | Cloudflare Web Analytics token. When empty, no analytics script loads. |

Everything is read at **build time**, so changing a variable needs a new deployment.

## Deploying to Cloudflare Pages

Create **one Pages project per site** from the same Git repository
(**Workers & Pages → Create → Pages → Connect to Git**).

| Setting | Working Days Calculator | Device Test |
| --- | --- | --- |
| Production branch | `main` | `main` |
| Framework preset | None (or Astro, then override the fields below) | None |
| Root directory | *(leave empty: repository root)* | *(leave empty: repository root)* |
| Build command | `npm run build -w @micro/working-days` | `npm run build -w @micro/device-test` |
| Build output directory | `apps/working-days/dist` | `apps/device-test/dist` |
| Environment variables | `NODE_VERSION=22`, `SITE_URL`, and the others above | same |

Keep the root directory at the repository root so npm installs the whole workspace (the apps
depend on `packages/ui`). Optionally set **Build watch paths** so each project only rebuilds when
its files change: include `apps/working-days/*` (or `apps/device-test/*`), `packages/*`,
`package.json` and `package-lock.json`.

Pushes to other branches (such as a pull request branch) create preview deployments on
`*.pages.dev` URLs, which are kept out of search results as described below.

The build writes `dist/_headers` with the security headers, CSP, caching rules and an
`X-Robots-Tag: noindex` rule for `*.pages.dev` hostnames. A small script in `public/head.js` also
adds `<meta name="robots" content="noindex">` on `*.pages.dev`, so preview and default URLs don't
compete with your custom domain in search results.

### Custom domain

1. In the Pages project, open **Custom domains → Set up a custom domain** and enter the domain
   (e.g. `workingdayscalculator.example`). If the domain's DNS is on Cloudflare the record is
   created for you; otherwise add the CNAME record Cloudflare shows you at your DNS provider.
2. Set `SITE_URL` to `https://` plus that domain, then redeploy, so canonical URLs, Open Graph
   tags and the sitemap use it.
3. Pick one hostname (with or without `www`) and redirect the other to it, for example with a
   Cloudflare Redirect Rule.

### Google Search Console and Bing Webmaster Tools

After the custom domain is live:

1. **Google Search Console** (<https://search.google.com/search-console>): add a **Domain**
   property and verify it with the DNS TXT record Google gives you (easiest when DNS is on
   Cloudflare), or a URL-prefix property verified with the HTML tag or file method.
2. Under **Sitemaps**, submit `https://<your-domain>/sitemap.xml`.
3. Use **URL inspection** on the home page and request indexing.
4. **Bing Webmaster Tools** (<https://www.bing.com/webmasters>): sign in and either import the
   site from Google Search Console or add it and verify (DNS, meta tag or XML file). Submit the
   same sitemap URL.
5. Repeat for the second site.

## Project docs

- [CLAUDE.md](CLAUDE.md): conventions for future work on this repo.
- [DECISIONS.md](DECISIONS.md): choices made where the brief was open.
- [TESTING.md](TESTING.md): automated results and a manual test list.
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md): before go-live, before applying for AdSense, before enabling ads.
