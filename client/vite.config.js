import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Better tree-shaking feedback during dev; safe for production.
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split vendor code into stable chunks for better caching and smaller
        // initial download. React/i18n/lucide are split out so that app-code
        // changes don't invalidate the cached vendor bundles.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
          }
        },
      },
    },
  },
})
