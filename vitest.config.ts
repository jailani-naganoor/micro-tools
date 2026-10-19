import { defineConfig } from 'vitest/config';
import { holidayAliases } from './apps/working-days/aliases.mjs';

export default defineConfig({
  resolve: { alias: holidayAliases },
  test: {
    include: ['apps/*/tests/unit/**/*.test.ts', 'packages/*/tests/**/*.test.ts'],
    environment: 'node',
    // date-holidays-parser is CommonJS-free ESM; inline it so the aliases above apply to its imports.
    server: { deps: { inline: ['date-holidays-parser', 'caldate', 'date-chinese', 'date-bengali-revised'] } },
  },
});
