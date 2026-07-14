import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Vitest is configured as the test runner for the frontend.
// We piggy-back on the Vite config so all @/aliases, JSX, and
// CSS modules work the same way as in dev/build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Vitest scans for *.test.{js,jsx,ts,tsx} and *.spec.* by default.
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    // CSS and asset imports are stubbed by jsdom + Vite test plugin.
    css: false,
    // Coverage report (run with `npm run test:coverage`).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{js,jsx}',
        'src/main.jsx',
        'src/styles/**',
      ],
    },
  },
})
