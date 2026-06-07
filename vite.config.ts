/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Servi depuis https://<user>.github.io/cadence/ : toutes les URLs (assets,
  // manifeste, service worker) doivent être préfixées par ce sous-chemin.
  base: '/cadence/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        id: '.',
        name: 'Cadence',
        short_name: 'Cadence',
        description: 'Organise tes routines, tâches et plannings de la semaine.',
        theme_color: '#171221',
        background_color: '#171221',
        display: 'standalone',
        orientation: 'any',
        // Chemins relatifs : résolus par rapport à l'URL du manifeste lui-même,
        // donc valables aussi bien en local qu'à la racine du sous-chemin GitHub Pages.
        start_url: '.',
        scope: '.',
        lang: 'fr',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Aujourd’hui',
            short_name: 'Aujourd’hui',
            url: '.',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Semaine',
            short_name: 'Semaine',
            url: './#/semaine',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
