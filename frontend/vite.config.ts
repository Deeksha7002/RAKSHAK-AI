import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: {
    host: true, // Listens on all local IPs (0.0.0.0)
    proxy: {
      '/api': {
        target: 'https://scam-defender-honeypot-1-fi61.onrender.com',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Rakshak AI Defense',
        short_name: 'Rakshak AI',
        description: 'Autonomous Counter-Offensive Against Digital Fraud',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 3000000, // Increase limit to 3MB for map chunks
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
})
