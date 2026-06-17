import { defineConfig } from 'vitest/config'
import tsconfigPaths    from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals:     true,
    environment: 'node',
    setupFiles:  ['./test/setup.ts'],
    include:     ['test/**/*.test.ts'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov', 'html'],
      include:    ['src/application/use-cases/**'],
      exclude:    ['src/infrastructure/**', 'src/interface/**'],
      thresholds: {
        lines:      85,
        functions:  85,
        branches:   80,
        statements: 85,
      },
    },
    // Each file runs isolated — prevents container singleton bleed between tests
    isolate:     true,
    testTimeout: 10_000,
  },
})
