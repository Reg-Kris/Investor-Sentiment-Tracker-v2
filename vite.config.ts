import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/Investor-Sentiment-Tracker-v2/',

  // Build optimization for production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor libraries for better caching
          if (id.includes('node_modules')) {
            if (id.includes('animejs') || id.includes('gsap')) {
              return 'vendor-animation';
            }
            if (id.includes('lottie-web')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (ext === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },

  // Development server
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
  },

  // Asset optimization
  assetsInclude: ['**/*.woff2', '**/*.svg'],

  // Define global constants for optimization
  define: {
    __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },

  // CSS optimization
  css: {
    devSourcemap: false,
    postcss: {},
  },

  // Resolve configuration for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // Performance optimizations
  optimizeDeps: {
    include: ['animejs', 'gsap', 'lottie-web'],
    exclude: [],
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
});
