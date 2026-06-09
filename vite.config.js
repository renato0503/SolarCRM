import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/SolarCRM/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        proposta: resolve(__dirname, 'proposta.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        pdf: resolve(__dirname, 'pdf.html'),
      }
    }
  }
});
