import type { APIRoute } from 'astro';
import { robotsTxt } from '@micro/ui/lib/routes';
import { site } from '../site.config';

export const GET: APIRoute = () =>
  new Response(robotsTxt(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
