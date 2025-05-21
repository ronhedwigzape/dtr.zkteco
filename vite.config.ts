import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    base: env.VITE_SKIP_BASE_PATH === 'true' ? '/' : '',
    publicDir: 'assets',
    server: {
      host: 'localhost',
      port: 5000,
      strictPort: true
    },
    build: {
      outDir: 'dist'
    },
    define: {
      // expose VITE_API_URL for TS
      'process.env': process.env
    }
  };
});
