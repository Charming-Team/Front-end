import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://skala3-team12-dev-alb-604801636.ap-northeast-2.elb.amazonaws.com'
  const stripBrowserOrigin = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('origin')
    })
  }

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: stripBrowserOrigin,
        },
        '/ai': {
          target: apiTarget,
          changeOrigin: true,
          configure: stripBrowserOrigin,
        },
      },
    },
  }
})
