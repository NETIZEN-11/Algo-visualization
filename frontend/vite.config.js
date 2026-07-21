import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,

    host: true,
    strictPort: false,
    hmr: {

      protocol: 'ws',
      overlay: true,
    },

    cors: true,

    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 3000,
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

    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
})
