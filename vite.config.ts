import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: mode === 'pages' ? '/365.---life-management/' : '/',
    plugins: [react()],
    server: {
      proxy: { '/api': { target: `http://127.0.0.1:${env.API_PORT || env.PORT || 3001}` } },
    },
    build: {
      rollupOptions: {
        output: { manualChunks: { charts: ['recharts'], icons: ['lucide-react'] } },
      },
    },
  };
});
