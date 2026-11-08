import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Vite dev server proxies API calls to the backend.
// In Docker, Nginx does the same job (see nginx.conf).
const backend = process.env.VITE_BACKEND_URL || 'http://localhost:5761';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': backend, '/health': backend },
  },
});
