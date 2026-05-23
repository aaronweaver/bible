import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Cornerstone',
        short_name: 'Cornerstone',
        description: 'Bible + Lessons for new believers (KJV)',
        theme_color: '#2563eb',
        background_color: '#f4f4f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/bible/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,woff2,svg,png}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  base: '/bible/',
  server: { host: true, port: 3000 },
  preview: { host: true, port: 3001 },
});
