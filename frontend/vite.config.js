import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('node_modules/lucide-react')) return 'ui-vendor'
          if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify')) return 'markdown-vendor'
        },
      },
    },
  },
})

