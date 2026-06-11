import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[64, 'favicon-64x64.png'], [48, 'favicon-48x48.png']],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: '#0c0c15' },
    },
  },
  images: ['public/logo.svg'],
})
