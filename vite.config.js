import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [],
      },
      manifest: {
        name: 'Novel Viewer',
        short_name: 'NovelVR',
        description: '웹소설 리더 + AI 사이드패널',
        theme_color: '#0c0c15',
        background_color: '#0c0c15',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
})
