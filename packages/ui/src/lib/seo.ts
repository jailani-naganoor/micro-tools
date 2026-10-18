import type { Crumb, FaqItem, SiteConfig } from './types';

export function absoluteUrl(site: SiteConfig, path: string): string {
  return new URL(path, site.env.siteUrl + '/').toString();
}

export function organizationLd(site: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.publisher,
    url: site.env.siteUrl + '/',
    logo: absoluteUrl(site, '/icon-512.png'),
  };
}

export function breadcrumbLd(site: SiteConfig, crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(site, c.path),
    })),
  };
}

export function faqLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function webAppLd(site: SiteConfig, opts: { category: string; features: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: site.name,
    url: site.env.siteUrl + '/',
    description: site.description,
    applicationCategory: opts.category,
    operatingSystem: 'Any (runs in a web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    featureList: opts.features,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: site.publisher },
  };
}

export function articleLd(
  site: SiteConfig,
  post: { title: string; description: string; path: string; pubDate: Date; updatedDate?: Date },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    mainEntityOfPage: absoluteUrl(site, post.path),
    datePublished: post.pubDate.toISOString().slice(0, 10),
    dateModified: (post.updatedDate ?? post.pubDate).toISOString().slice(0, 10),
    image: absoluteUrl(site, '/og.png'),
    author: { '@type': 'Organization', name: site.publisher },
    publisher: {
      '@type': 'Organization',
      name: site.publisher,
      logo: { '@type': 'ImageObject', url: absoluteUrl(site, '/icon-512.png') },
    },
  };
}
