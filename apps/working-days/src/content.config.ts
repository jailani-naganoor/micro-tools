import { defineCollection } from 'astro:content';
import { blogCollection } from '@micro/ui/lib/blog';

export const collections = { blog: defineCollection(blogCollection) };
