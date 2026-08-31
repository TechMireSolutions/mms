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
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('x-forwarded-host', host);
            }
          });
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('x-forwarded-host', host);
            }
          });
        },
      },
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
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
            // Translations: keep one chunk per language (each is loaded only
            // when its language is selected).
            if (id.includes('/appTranslationsEn')) return 'mms-i18n-en';
            if (id.includes('/appTranslationsAr')) return 'mms-i18n-ar';
            if (id.includes('/appTranslationsUr')) return 'mms-i18n-ur';
            if (id.includes('/appTranslationsFa')) return 'mms-i18n-fa';
            // Everything else from @mms/shared: let Rollup chunk by the real
            // import graph instead of one forced `mms-shared` chunk, which was
            // eagerly loaded in full on boot (all module manifests/contracts
            // even when only one module is routed).
            return undefined;
          }
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/react@') ||
            id.includes('/react-dom@') ||
            id.includes('react/jsx-runtime') ||
            id.includes('react/jsx-dev-runtime') ||
            id.includes('/scheduler/') ||
            id.includes('/scheduler@')
          ) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          if (id.includes('@radix-ui') || id.includes('@floating-ui') || id.includes('react-remove-scroll') || id.includes('aria-hidden')) {
            return 'vendor-radix';
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
          if (id.includes('react-router')) {
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
