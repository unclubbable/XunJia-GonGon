import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
const url = "127.0.0.1";
export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: {
      "/api": {
        target: "http://"+url + ":7072",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/")
      },
      "/sseApi": {
        target: "ws://"+url + ":9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sseApi/, "/")
      },
    },
  },
})
