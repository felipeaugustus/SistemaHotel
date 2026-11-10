import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const backend = { target: 'http://localhost:8000', changeOrigin: false }

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/': backend,
      '/o/': backend,
      '/accounts/': backend,
      '/admin/': backend,
      '/static/': backend,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
