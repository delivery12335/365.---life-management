import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Build-only JavaScript configuration helper.
import { validateCloudConfig } from './scripts/cloud-config.mjs';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  validateCloudConfig(env);
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
