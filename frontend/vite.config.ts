import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      // Only proxy backend API endpoints, not frontend routes like /api-test
      '^/api/(?!test)': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Ensure client-side routing works properly
  build: {
    rollupOptions: {
      // Handle history API fallback for production builds
      output: {
        manualChunks: undefined,
      },
    },
  },
})
