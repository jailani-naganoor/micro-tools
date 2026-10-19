import type { SiteConfig } from './types';

/** Static pages every site has. Blog posts are appended by the sitemap endpoint. */
export const STATIC_PATHS = ['/', '/about/', '/contact/', '/privacy/', '/terms/', '/blog/'];

export function robotsTxt(site: SiteConfig): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.env.siteUrl}/sitemap.xml\n`;
}

export function sitemapXml(site: SiteConfig, paths: string[]): string {
  const urls = paths
    .map((p) => `  <url><loc>${new URL(p, site.env.siteUrl + '/').toString()}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
