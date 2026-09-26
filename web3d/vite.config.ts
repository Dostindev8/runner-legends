import { defineConfig } from 'vite';

export default defineConfig({
  base: '/3d/',
  build: {
    outDir: '../3d',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
  },
  server: {
    port: 5173,
    open: false,
  },
});
