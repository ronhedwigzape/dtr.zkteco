import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const SKIP_BASE_PATH = env.VITE_SKIP_BASE_PATH

  return {
    plugins: [react()],
    base: SKIP_BASE_PATH === 'true' ? '/' : '/dtr.gvs/',
    publicDir: 'assets',
    server: {
      host: 'localhost',
      port: 5000,
      strictPort: true
    },
    build: {
      outDir: 'public'
    }
  }
})
