import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Dev proxy keeps the API same-origin (no CORS, no hard-coded URLs in source).
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
});
