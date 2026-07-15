import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        proposta: resolve(__dirname, 'proposta.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        pdf: resolve(__dirname, 'pdf.html'),
        pdfCerrado: resolve(__dirname, 'pdf-cerrado.html'),
        lead: resolve(__dirname, 'lead.html'),
        historico: resolve(__dirname, 'historico.html'),
        tv: resolve(__dirname, 'tv.html'),
        adminEquipamentos: resolve(__dirname, 'admin/equipamentos.html'),
        adminFornecedores: resolve(__dirname, 'admin/fornecedores.html'),
        relatorios: resolve(__dirname, 'relatorios.html'),
      }
    }
  }
});
