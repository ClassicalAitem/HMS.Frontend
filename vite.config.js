import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: {
      // Extend timeout so browser tab throttling doesn't prematurely drop the connection
      timeout: 120000,
    },
  },
  base: '/',
  build: {
    chunkSizeWarningLimit: 3000, // Increase warning limit to 3000kb
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Split vendor code into its own chunk
          }
        },
      },
    },
  },
});
