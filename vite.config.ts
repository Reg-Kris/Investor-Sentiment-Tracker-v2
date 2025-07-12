import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Investor-Sentiment-Tracker-v2/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
