import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the same build works at a domain root (Vercel) and under
  // a project subpath (GitHub Pages, e.g. /gentech-phone-checker/).
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
