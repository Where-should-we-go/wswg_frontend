import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // host:true → 0.0.0.0 바인딩. 같은 LAN의 다른 PC가 http://<호스트-IP>:3000 으로 접속 가능.
    // 프록시는 dev 서버(호스트 PC)에서 돌므로 target 은 localhost:8080 그대로 둔다.
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login/oauth2': 'http://localhost:8080',
      // 실시간 공동편집 WebSocket — ws:true 로 업그레이드를 백엔드로 터널링.
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
})
