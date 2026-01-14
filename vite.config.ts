
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change 'zengo' to your actual repository name if it is different
  base: './', 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});
