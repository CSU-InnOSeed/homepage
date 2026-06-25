import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for InnOSeed landing.
// Output is plain static assets (dist/) — Vercel serves them as-is.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Keep chunks small; landing has no router / no heavy deps.
    target: 'es2020',
  },
  server: {
    port: 8765,
    host: '127.0.0.1',
  },
});
