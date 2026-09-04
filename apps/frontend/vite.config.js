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
    manifest: true,
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      resolveDependencies(url, deps) {
        return deps.filter((dep) => {
          return (
            dep.includes('rolldown-runtime') ||
            dep.includes('vendor-react') ||
            dep.includes('vendor-ui-core') ||
            dep.includes('vendor-query') ||
            dep.includes('mms-i18n-en')
          );
        });
      },
    },
    rolldownOptions: {
      output: {
        banner: (chunk) => {
          if (chunk.name === 'vendor-validation') {
            return 'globalThis.__zod_globalConfig = Object.assign(globalThis.__zod_globalConfig || {}, { jitless: true });';
          }
          return '';
        },
        codeSplitting: {
          minSize: 20000,
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 50,
            },
            {
              name: 'vendor-ui-core',
              test: /node_modules[\\/](?:clsx|tailwind-merge|class-variance-authority)[\\/]/,
              priority: 45,
            },
            {
              name: 'vendor-query',
              test: /node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-radix',
              test: /node_modules[\\/](?:@radix-ui|@floating-ui|react-remove-scroll|aria-hidden)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-motion',
              test: /node_modules[\\/]framer-motion[\\/]/,
              priority: 25,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](?:recharts|victory-vendor|d3-|react-redux|@reduxjs[\\/]toolkit)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-icons',
              test: /node_modules[\\/]lucide-react[\\/]/,
              priority: 15,
            },
            {
              name: 'vendor-validation',
              test: /node_modules[\\/]zod[\\/]/,
              priority: 10,
            },
            {
              name: 'mms-i18n-en',
              test: /packages[\\/]shared[\\/]dist[\\/]appTranslationsEn/,
              priority: 5,
            },
            {
              name: 'mms-i18n-ar',
              test: /packages[\\/]shared[\\/]dist[\\/]appTranslationsAr/,
              priority: 5,
            },
            {
              name: 'mms-i18n-ur',
              test: /packages[\\/]shared[\\/]dist[\\/]appTranslationsUr/,
              priority: 5,
            },
            {
              name: 'mms-i18n-fa',
              test: /packages[\\/]shared[\\/]dist[\\/]appTranslationsFa/,
              priority: 5,
            },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
  ]
});
