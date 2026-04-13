import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'fs';
import path from 'path';
const url = "127.0.0.1";
export default defineConfig({
  plugins: [uni()],
  server: {
    // 浏览器本地开发代理配置
    proxy: {
      "/api": {
        target: "http://" + url + ":7073",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/")
      },
      "/sseApi": {
        target:  "ws://" + url + ":9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sseApi/, "/")
      },

      "/payApi": {
        target:  "http://" + url + ":7073",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/payApi/, "/")
      },
    },
  },
})
