import type { Env } from './env';

export interface SiteConfig {
  /** Short id, e.g. "working-days". */
  id: string;
  name: string;
  /** Organisation / publisher name used in JSON-LD and the copyright line. */
  publisher: string;
  /** Default meta description for the site. */
  description: string;
  /** Main keyword phrase used in the H1 of the home page. */
  keyword: string;
  themeColor: { light: string; dark: string };
  sibling: { name: string; url: string; blurb: string };
  env: Env;
}

export interface Crumb {
  name: string;
  path: string;
}

export interface FaqItem {
  q: string;
  a: string;
}
