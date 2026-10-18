import type { APIRoute } from 'astro';
import { getPublishedPosts } from '@micro/ui/lib/blog';
import { STATIC_PATHS, sitemapXml } from '@micro/ui/lib/routes';
import { site } from '../site.config';

export const GET: APIRoute = async () => {
  // Drafts are never listed, even when SHOW_DRAFTS is on for local review.
  const posts = await getPublishedPosts(false);
  const paths = [...STATIC_PATHS, ...posts.map((p) => `/blog/${p.id}/`)];
  return new Response(sitemapXml(site, paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
