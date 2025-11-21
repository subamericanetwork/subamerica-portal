// Force rebuild
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
  // PWA re-enabled with streaming protection
  import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 8080,
      clientPort: 8080,
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA re-enabled with streaming exclusions
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.jpg', 'favicon.png'],
      manifest: {
        name: 'Subamerica Creator Portal',
        short_name: 'Subamerica',
        description: 'Independent media network amplifying fearless art, sound, and stories 24/7',
        theme_color: '#00CCD6',
        background_color: '#0A1214',
        display: 'standalone',
        scope: '/',
        start_url: '/?pwa=true',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['music', 'entertainment', 'social'],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Open your dashboard',
            url: '/dashboard',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /\/live.*/, /\/watch-live.*/],
        runtimeCaching: [
          // CRITICAL: Never cache HLS streaming files
          {
            urlPattern: /^https:\/\/.*\.(m3u8|ts)$/i,
            handler: 'NetworkOnly'
          },
          // CRITICAL: Never cache live streaming pages
          {
            urlPattern: /\/live.*/,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\/watch-live.*/,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(mp4|webm|mp3|wav|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              rangeRequests: true
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
