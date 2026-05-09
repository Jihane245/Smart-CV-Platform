import { defineConfig } from 'vitest/config';

// Angular's `@angular/build:unit-test` defaults to Vitest. On some Windows setups,
// the default `forks` pool can time out when spawning workers.
// Using the `threads` pool with a single worker makes runs more reliable.
export default defineConfig({
  test: {
    pool: 'threads',
    // Vitest v4: pool options are top-level
    minThreads: 1,
    maxThreads: 1,
  },
});

