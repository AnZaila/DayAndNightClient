import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'

function apiProxy(target: string): ProxyOptions {
  return {
    target,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin')
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:1004'
  const port = Number(env.VITE_PORT || 602)

  return {
    plugins: [
      vue(),
      // vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port,
      strictPort: true,
      proxy: {
        '/api': apiProxy(target),
        '/uploads': apiProxy(target),
      },
    },
  }
})
