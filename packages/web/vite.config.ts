import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss() as any],
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}']
  }
});
