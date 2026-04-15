import { defineConfig } from 'vite';

export default defineConfig({
  base: '/fishfight/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
