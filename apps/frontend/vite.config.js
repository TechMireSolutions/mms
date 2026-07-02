import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('x-forwarded-host', host);
            }
          });
        },
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/packages/shared/dist/')) {
            if (id.includes('/appTranslations')) {
              return 'mms-shared-i18n';
            }
            if (id.includes('/tenantUtils')) {
              return 'mms-shared-tenant';
            }
            return 'mms-shared';
          }
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          if (id.includes('@radix-ui') || id.includes('@floating-ui') || id.includes('react-remove-scroll') || id.includes('aria-hidden')) {
            return 'vendor-radix';
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('/zod/')) {
            return 'vendor-validation';
          }
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('react-router') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
  ]
});
