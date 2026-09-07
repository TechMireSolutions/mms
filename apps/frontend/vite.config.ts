import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

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
    },
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
            dep.includes('vendor-react')
          );
        });
      },
    },
    rollupOptions: {
      output: {
        banner: (chunk) => {
          if (chunk.name === 'vendor-validation') {
            return 'globalThis.__zod_globalConfig = Object.assign(globalThis.__zod_globalConfig || {}, { jitless: true });';
          }
          return '';
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/@tanstack/react-query/')) {
              return 'vendor-query';
            }
            if (
              id.includes('/recharts/') ||
              id.includes('/victory-vendor/') ||
              id.includes('/d3-') ||
              id.includes('/@reduxjs/toolkit/')
            ) {
              return 'vendor-charts';
            }
            if (
              id.includes('/mermaid/') ||
              id.includes('/@mermaid-js/') ||
              id.includes('/cytoscape') ||
              id.includes('/dagre')
            ) {
              return 'vendor-diagrams';
            }
            if (
              id.includes('/@radix-ui/') ||
              id.includes('/@floating-ui/') ||
              id.includes('/lucide-react/') ||
              id.includes('/aria-hidden/') ||
              id.includes('/react-remove-scroll/') ||
              id.includes('/clsx/') ||
              id.includes('/tailwind-merge/') ||
              id.includes('/class-variance-authority/')
            ) {
              return 'vendor-ui';
            }
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/zod/') || id.includes('/@ts-rest/')) {
              return 'vendor-validation';
            }
          }
          if (
            id.includes('packages/shared/dist/appTranslationsEn') ||
            id.includes('packages\\shared\\dist\\appTranslationsEn')
          ) {
            return 'mms-i18n-en';
          }
          if (
            id.includes('packages/shared/dist/appTranslationsAr') ||
            id.includes('packages\\shared\\dist\\appTranslationsAr')
          ) {
            return 'mms-i18n-ar';
          }
          if (
            id.includes('packages/shared/dist/appTranslationsUr') ||
            id.includes('packages\\shared\\dist\\appTranslationsUr')
          ) {
            return 'mms-i18n-ur';
          }
          if (
            id.includes('packages/shared/dist/appTranslationsFa') ||
            id.includes('packages\\shared\\dist\\appTranslationsFa')
          ) {
            return 'mms-i18n-fa';
          }
        },
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
              name: 'vendor-query',
              test: /node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 45,
            },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](?:@radix-ui|@floating-ui|react-remove-scroll|aria-hidden|lucide-react|clsx|tailwind-merge|class-variance-authority)[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-motion',
              test: /node_modules[\\/]framer-motion[\\/]/,
              priority: 35,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](?:recharts|victory-vendor|d3-|react-redux|@reduxjs[\\/]toolkit)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-diagrams',
              test: /node_modules[\\/](?:mermaid|@mermaid-js|cytoscape|dagre)[\\/]/,
              priority: 25,
            },
            {
              name: 'vendor-validation',
              test: /node_modules[\\/](?:zod|@ts-rest)[\\/]/,
              priority: 20,
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
    visualizer({
      filename: path.resolve(rootDir, 'dist/stats.html'),
      title: 'MMS Frontend Bundle Analysis',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }) as PluginOption,
  ],
});
