import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    // The React plugin is required for JSX and the legacy plugin emits fallback bundles.
    react(),
    legacy({
      targets: ['and_chr >= 80', 'iOS >= 13.4', 'Chrome >= 80', 'Safari >= 13.1'],
      polyfills: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
