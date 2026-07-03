/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/beeline/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/favicon.ico', 'icons/apple-touch-icon.png', 'fonts/*.woff2'],
      manifest: {
        id: BASE,
        scope: BASE,
        start_url: BASE,
        name: 'BeeLine — bee forage map',
        short_name: 'BeeLine',
        description: 'Predict where your bees forage: a forage, pollen and hive map for beekeepers.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#120d07',
        theme_color: '#f6a800',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        // The large 512px icons are only used by the OS installer, not the running shell.
        globIgnores: ['**/icons/pwa-512.png', '**/icons/maskable-512.png'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        // Offline is app-shell only: tiles, Overpass, DAERA, Open-Meteo and NBN are
        // live third-party fetches and are deliberately never cached (stale data misleads).
        runtimeCaching: [],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
