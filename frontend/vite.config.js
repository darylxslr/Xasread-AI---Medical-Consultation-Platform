import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.url?.startsWith('/auth/callback')) {
            return req.url
          }
        },
      },
      '/conversations': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})