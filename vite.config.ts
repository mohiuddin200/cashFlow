import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            runtimeCaching: [
              {
                urlPattern: /https:\/\/firestore\.googleapis\.com/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'firebase-api-cache',
                  networkTimeoutSeconds: 3,
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 5 // 5 minutes
                  }
                }
              },
              {
                urlPattern: /https:\/\/firebaseio\.com/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'firebase-realtime-cache',
                  networkTimeoutSeconds: 3,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 2 // 2 minutes
                  }
                }
              },
              {
                urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|woff|woff2)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'static-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  }
                }
              }
            ]
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'CashFlow - Personal Finance',
            short_name: 'CashFlow',
            description: 'Track your income, expenses, and achieve your financial goals with ease',
            theme_color: '#10b981',
            background_color: '#f9fafb',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'pwa-72x72.png',
                sizes: '72x72',
                type: 'image/png'
              },
              {
                src: 'pwa-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              },
              {
                src: 'pwa-128x128.png',
                sizes: '128x128',
                type: 'image/png'
              },
              {
                src: 'pwa-144x144.png',
                sizes: '144x144',
                type: 'image/png'
              },
              {
                src: 'pwa-152x152.png',
                sizes: '152x152',
                type: 'image/png'
              },
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-384x384.png',
                sizes: '384x384',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // DEEPSEEK_API_KEY intentionally excluded from client bundle — only used server-side in Vercel function
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging'],
              charts: ['recharts'],
              markdown: ['react-markdown', 'rehype-highlight', 'remark-gfm'],
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
