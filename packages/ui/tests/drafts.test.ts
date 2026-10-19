// SHOW_DRAFTS must reach the build: with it on, both sites list and render the draft posts
// (and still keep them out of the sitemap); with it off, drafts are not built at all.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { describeFlag, parseFlag, unquote } from '../src/lib/env';

const root = join(import.meta.dirname, '../../..');
const outDirs: string[] = [];

function build(app: string, showDrafts: string | undefined) {
  const outDir = mkdtempSync(join(tmpdir(), `drafts-${app}-`));
  outDirs.push(outDir);
  const env: NodeJS.ProcessEnv = { ...process.env, PUBLIC_ADS_ENABLED: 'false', PUBLIC_CF_ANALYTICS_TOKEN: '' };
  delete env.SHOW_DRAFTS;
  if (showDrafts !== undefined) env.SHOW_DRAFTS = showDrafts;
  // Same command shape as the Cloudflare Pages build: an npm workspace script from the repo root.
  const r = spawnSync('npm', ['run', 'build', '-w', `@micro/${app}`, '--', '--outDir', outDir], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return { outDir, log: r.stdout + r.stderr };
}

function draftSlugs(app: string): string[] {
  const dir = join(root, 'apps', app, 'src/content/blog');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && /^draft:\s*true\s*$/m.test(readFileSync(join(dir, f), 'utf8')))
    .map((f) => f.replace(/\.md$/, ''));
}

afterAll(() => outDirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('SHOW_DRAFTS flag parsing', () => {
  it('accepts the usual spellings, with or without quotes', () => {
    for (const v of ['true', 'TRUE', ' true ', '1', 'yes', 'on', '"true"', "'true'", '" true "']) {
      expect(parseFlag(v), v).toBe(true);
    }
    for (const v of [undefined, '', 'false', '0', 'no', 'off', '"false"', 'truthy']) {
      expect(parseFlag(v), String(v)).toBe(false);
    }
    expect(unquote('"abc"')).toBe('abc');
    expect(unquote('"abc')).toBe('"abc');
  });

  it('describes the value for the build log and warns on unknown values', () => {
    process.env.TEST_FLAG = '"true"';
    expect(describeFlag('TEST_FLAG')).toMatchObject({ on: true, warn: false });
    process.env.TEST_FLAG = 'maybe';
    expect(describeFlag('TEST_FLAG')).toMatchObject({ on: false, warn: true });
    delete process.env.TEST_FLAG;
    expect(describeFlag('TEST_FLAG').message).toContain('not set');
  });
});

// Builds are slow-ish, so run them once (not again in the extra time zone passes).
describe.skipIf(!!process.env.TZ)('SHOW_DRAFTS builds', () => {
  for (const app of ['device-test', 'working-days']) {
    it(`${app}: SHOW_DRAFTS=true lists and builds every draft`, () => {
      const slugs = draftSlugs(app);
      expect(slugs.length).toBeGreaterThan(0);
      const { outDir, log } = build(app, 'true');
      expect(log).toContain('blog drafts included');
      const index = readFileSync(join(outDir, 'blog/index.html'), 'utf8');
      expect(index).not.toContain('No articles have been published yet');
      for (const slug of slugs) {
        expect(index, slug).toContain(`/blog/${slug}/`);
        const page = readFileSync(join(outDir, 'blog', slug, 'index.html'), 'utf8');
        expect(page).toMatch(/<meta name="robots" content="noindex/);
      }
      // Drafts never go in the sitemap, even when shown.
      const sitemap = readFileSync(join(outDir, 'sitemap.xml'), 'utf8');
      for (const slug of slugs) expect(sitemap).not.toContain(`/blog/${slug}/`);
    }, 120_000);
  }

  it('a quoted value from a hosting dashboard ("true") also shows drafts', () => {
    const { outDir } = build('device-test', '"true"');
    expect(readFileSync(join(outDir, 'blog/index.html'), 'utf8')).not.toContain('No articles have been published yet');
  }, 120_000);

  it('without SHOW_DRAFTS no draft is built or listed', () => {
    const { outDir, log } = build('device-test', undefined);
    expect(log).toContain('blog drafts hidden');
    expect(readFileSync(join(outDir, 'blog/index.html'), 'utf8')).toContain('No articles have been published yet');
    for (const slug of draftSlugs('device-test')) expect(existsSync(join(outDir, 'blog', slug))).toBe(false);
  }, 120_000);
});
