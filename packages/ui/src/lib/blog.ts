import { getCollection, type CollectionEntry } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Shared blog collection definition; each app re-exports it from src/content.config.ts. */
export const blogCollection = {
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(155),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Posts stay unpublished until a person reviews them and sets draft: false.
    draft: z.boolean().default(true),
  }),
};

export type BlogPost = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts are included only when SHOW_DRAFTS=true. */
export async function getPublishedPosts(showDrafts: boolean): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (p: BlogPost) => showDrafts || !p.data.draft);
  return posts.sort((a: BlogPost, b: BlogPost) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}
