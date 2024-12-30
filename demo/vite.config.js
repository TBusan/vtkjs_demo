import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vtk: ['@kitware/vtk.js']
        }
      }
    }
  }
}); 