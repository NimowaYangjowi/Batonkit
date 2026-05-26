import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@batonkit/core': new URL(
        './packages/core/src/index.ts',
        import.meta.url
      ).pathname,
      '@batonkit/postgres': new URL(
        './packages/postgres/src/index.ts',
        import.meta.url
      ).pathname,
      '@batonkit/worker': new URL(
        './packages/worker/src/index.ts',
        import.meta.url
      ).pathname,
      '@batonkit/next': new URL(
        './packages/next/src/index.ts',
        import.meta.url
      ).pathname,
      '@batonkit/provider-railway': new URL(
        './packages/provider-railway/src/index.ts',
        import.meta.url
      ).pathname,
      '@batonkit/monitor-webhook': new URL(
        './packages/monitor-webhook/src/index.ts',
        import.meta.url
      ).pathname,
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'examples/railway-live-drill/src/**/*.test.ts'],
  },
});
