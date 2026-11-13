import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/earth-jukebox/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          chartjs: ['chart.js', 'react-chartjs-2'],
          react: ['react', 'react-dom'],
          jszip: ['jszip']
        }
      }
    }
  }
});
