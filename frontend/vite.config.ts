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
    base: env.VITE_SKIP_BASE_PATH === 'true' ? '/' : '',
    publicDir: 'assets',
    server: {
      host: 'localhost',
      port: 2000,
      strictPort: true
    },
    build: {
      chunkSizeWarningLimit: 1000,
      outDir: 'public',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id
                  .toString()
                  .split('node_modules/')[1]
                  .split('/')[0]
                  .toString();
            }
          }
        },
      }
    }
  }
})
