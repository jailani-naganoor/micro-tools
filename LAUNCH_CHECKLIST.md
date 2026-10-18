# Launch checklist

Work through each section in order, once per site, unless the item says otherwise.

## 1. Before go-live

- [ ] Choose the domains and set `SITE_URL` for each Cloudflare Pages project (see README).
- [ ] Set `PUBLISHER_NAME`, `CONTACT_EMAIL`, `COMMUNITY_URL`, `WORKING_DAYS_URL` and `DEVICE_TEST_URL`.
      Make sure the contact mailbox exists and is monitored.
- [ ] Review the Privacy Policy and Terms (`packages/ui/src/components/PrivacyContent.astro`,
      `TermsContent.astro` and each app's `privacy.astro`/`terms.astro`). Add a governing law and
      the legal entity details if you want them, and get legal advice if you are unsure. Update
      the "Last updated" dates.
- [ ] Review the About pages and FAQs for accuracy and tone.
- [ ] Review the blog drafts (TESTING.md lists the facts to check) and set `draft: false` on the
      approved posts. AdSense reviewers look for useful original content, so publish at least a
      few.
- [ ] Optional: replace the generated favicon and `og.png` designs (`public/favicon.svg`, then
      `npm run images`).
- [ ] Deploy, attach the custom domain and redirect the non-canonical hostname (www or apex).
- [ ] Check the live response headers (CSP, Permissions-Policy, HSTS, caching). `*.pages.dev`
      should have `X-Robots-Tag: noindex`; the custom domain should not.
- [ ] Run PageSpeed Insights (mobile) on each live home page; aim for 95+ in every category.
- [ ] Work through the manual test list in TESTING.md.
- [ ] Submit each sitemap to Google Search Console and Bing Webmaster Tools (README has the steps).
- [ ] Optional analytics: create a Cloudflare Web Analytics site, set `PUBLIC_CF_ANALYTICS_TOKEN`
      and redeploy. Don't also turn on Cloudflare's automatic beacon injection, or the beacon loads
      twice. The privacy policy and CSP update automatically from the flag; re-read the
      "Analytics" section afterwards.

## 2. Before applying for AdSense

- [ ] The site is on its own domain, has been live for a while, and has published original content
      (the tool, FAQ, How it works and approved blog posts). No placeholder text or example.com links
      remain.
- [ ] About, Contact, Privacy Policy and Terms are reachable from every page (footer). They are now.
- [ ] Read the AdSense Program Policies and Google Publisher Policies and confirm the site complies
      (no encouraging clicks, ads not placed to look like site content, no content Google restricts).
- [ ] Sign up at <https://adsense.google.com>, add the site, and follow Google's site
      verification steps. If Google asks for its code snippet on the page during review, set
      `PUBLIC_ADS_ENABLED=true` and `PUBLIC_ADSENSE_CLIENT` (and complete section 3 first).
- [ ] `ads.txt`: once you have your publisher ID, either set `PUBLIC_ADSENSE_CLIENT` (the build
      writes `ads.txt`) or edit `apps/<site>/public/ads.txt`. It must be reachable at
      `https://<domain>/ads.txt`. If the sites are subdomains of one domain, read Google's
      ads.txt guidance on subdomains; the file is checked on the root domain.
- [ ] Decide how you'll handle consent (section 3) before any ads are served.

## 3. Before enabling ads

- [ ] **A Google-certified consent management platform (CMP) that integrates with the IAB
      Transparency & Consent Framework (TCF) is required before serving personalised ads to users in
      the EEA, the UK and Switzerland.** Google's own Privacy & messaging tool (in AdSense) is one
      certified option; third-party certified CMPs also work. Set it up for each site.
- [ ] If the CMP needs its own script tag, add its domains to the CSP in
      `packages/ui/src/integrations/cloudflare-headers.ts` (`fundingchoicesmessages.google.com` is
      already allowed for Google's CMP) and load it before the AdSense script in
      `packages/ui/src/components/AdsLoader.astro`.
- [ ] Consent Mode v2: the loader sets `ad_storage`, `ad_user_data`, `ad_personalization` and
      `analytics_storage` to `denied` by default, everywhere. A TCF CMP updates consent itself;
      other tools can call `window.microConsent.update({...})`. If you want different defaults
      outside the EEA/UK/CH, add region-specific defaults in `packages/ui/src/scripts/consent.ts`.
- [ ] Confirm "Cookie settings" in the footer opens the CMP (it calls Google's
      `googlefc.showRevocationMessage` when available) and lets users change their choice.
- [ ] Set `PUBLIC_ADS_ENABLED=true`, `PUBLIC_ADSENSE_CLIENT=ca-pub-…` and optionally the three
      `PUBLIC_ADSENSE_SLOT_*` ad unit IDs in Cloudflare, then redeploy.
- [ ] Re-read the Privacy Policy "Advertising" and "Cookies" sections (marked
      `REVIEW BEFORE ENABLING ADS` in the source); they switch on with the flag. Make sure they
      match your CMP and ad settings, and update "Last updated".
- [ ] Open each site with DevTools open: no CSP errors in the console, ads render in the reserved
      slots, and there is no layout shift. Add any newly required Google domains to the CSP.
      AdSense uses changing domains, so check again after a while.
- [ ] Check placements on phone and desktop: ads are labelled "Advertisement", sit below the result,
      mid-content and in the desktop sidebar, never next to tool buttons or inputs, and never sticky
      over content. Don't add wording that encourages clicks.
- [ ] Consider removing `browsing-topics=()` from the Permissions-Policy if you want Topics-based ads.
- [ ] Re-run Lighthouse/PageSpeed Insights. Ads will lower performance; keep CLS at 0.
- [ ] Never click your own ads; use AdSense's preview tools instead.
