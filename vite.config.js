import { defineConfig } from 'vite';

export default defineConfig({
  base: '/research-curator/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
