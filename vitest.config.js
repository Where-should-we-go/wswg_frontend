import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // 테스트는 개발자 로컬 .env(.local)의 VITE_USE_MOCK 값과 무관하게
      // 항상 mock 서비스로 결정적으로 돌린다. (실모드면 jsdom에서 실 fetch 발생)
      env: { VITE_USE_MOCK: 'true' },
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
