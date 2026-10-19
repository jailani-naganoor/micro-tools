import { fileURLToPath } from 'node:url';

const local = (path) => fileURLToPath(new URL(path, import.meta.url));

// Slim down date-holidays-parser's dependencies for the browser. See the comments in
// src/lib/moment-tz.js and src/lib/astronomia-shim.js. Shared by astro.config.mjs and
// the root vitest.config.ts so unit tests exercise exactly what ships.
export const holidayAliases = [
  { find: /^moment-timezone$/, replacement: local('./src/lib/moment-tz.js') },
  { find: /^astronomia$/, replacement: local('./src/lib/astronomia-shim.js') },
];
