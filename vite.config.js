import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        screensaver: resolve(__dirname, 'screensaver.html'),
        disclaimer: resolve(__dirname, 'disclaimer.html'),
        register: resolve(__dirname, 'register.html'),
        coins: resolve(__dirname, 'coins.html'),
        confirm: resolve(__dirname, 'confirm.html'),
        spin: resolve(__dirname, 'spin.html'),
        result: resolve(__dirname, 'result.html'),
        allResult: resolve(__dirname, 'allResult.html'),
        summary: resolve(__dirname, 'summary.html'),
        slot3d: resolve(__dirname, 'slot3d.html'),
      },
    },
  },
});
