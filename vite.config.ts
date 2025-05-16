import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: env.VITE_SKIP_BASE_PATH === 'true' ? '/' : '/dtr.zkteco/',
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
