import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Listen on all interfaces so the dev server works whether the
    // browser is opened to `localhost`, `127.0.0.1`, or the LAN IP.
    // The HMR WS endpoint is then reachable regardless of hostname.
    host: true,
    strictPort: false,
    hmr: {
      // Use 'auto' so Vite picks the right host:port from the page URL.
      // Hard-coding `host: 'localhost'` breaks the WS handshake when
      // the browser is opened at `127.0.0.1:3000` (or via LAN IP).
      protocol: 'ws',
      overlay: true,
    },
    // Permissive CORS for the dev server — the production app is
    // fronted by nginx with a strict allow-list.
    cors: true,
    // OneDrive (and other cloud sync tools) modify file timestamps while
    // syncing, which triggers Vite's native fs watcher and causes full
    // page reloads that wipe React form state.
    // Using polling with a generous interval prevents false-positive reloads.
    watch: {
      usePolling: true,
      interval: 1000,        // check every 1 second
      binaryInterval: 3000,  // binary files even less often
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // `force: true` makes Vite re-run dep pre-bundling on every `npm run dev`
  // start. With our manual-chunk split we don't want a stale
  // `node_modules/.vite` cache (left over from before any of these deps
  // existed in `optimizeDeps`) to serve a half-built React module, which
  // manifests as "Cannot read properties of null (reading 'useState')"
  // at the first render of a lazy page.
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'zustand',
      'react-hot-toast',
      'react-icons/fa',
      'react-syntax-highlighter',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Manual chunk splitting keeps the initial bundle small and improves
    // cache hit rates — vendor / motion / icons / syntax highlighter are
    // each cached independently of app code.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-syntax-highlighter') || id.includes('prismjs') || id.includes('refractor')) {
            return 'syntax'
          }
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-icons')) return 'icons'
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          // All react/scheduler/etc go into a single chunk; everything
          // else from node_modules (axios, zustand, react-router-dom,
          // react-hot-toast, clsx, ...) goes into the generic vendor chunk.
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/@remix-run/') ||
            id.includes('node_modules/react-refresh')
          ) {
            return 'react-vendor'
          }
          return 'vendor'
        },
      },
    },
    // Targets modern browsers; we ship a single bundle instead of legacy
    // chunks since the user base is 2025+ tooling.
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
})
