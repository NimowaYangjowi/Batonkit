import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@local-first-worker/core': new URL(
        './packages/core/src/index.ts',
        import.meta.url
      ).pathname,
      '@local-first-worker/postgres': new URL(
        './packages/postgres/src/index.ts',
        import.meta.url
      ).pathname,
      '@local-first-worker/worker': new URL(
        './packages/worker/src/index.ts',
        import.meta.url
      ).pathname,
      '@local-first-worker/next': new URL(
        './packages/next/src/index.ts',
        import.meta.url
      ).pathname,
      '@local-first-worker/provider-railway': new URL(
        './packages/provider-railway/src/index.ts',
        import.meta.url
      ).pathname,
      '@local-first-worker/monitor-webhook': new URL(
        './packages/monitor-webhook/src/index.ts',
        import.meta.url
      ).pathname,
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
