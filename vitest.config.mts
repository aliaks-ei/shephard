import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath } from 'node:url'

// Create separate test configuration
const testConfig = {
  environment: 'happy-dom',
  setupFiles: 'test/vitest/setup-file.ts',
  include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  environmentOptions: {
    env: {
      VITE_SUPABASE_URL: 'https://mock-supabase-url.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
      VITE_GOOGLE_CLIENT_ID: 'test-client-id',
    },
  },
}

// Create plugins separately
const vuePlugin = vue({
  template: { transformAssetUrls },
})

const quasarPlugin = quasar({
  sassVariables: 'src/quasar-variables.scss',
})

// https://vitejs.dev/config/
export default defineConfig({
  test: testConfig,
  // @ts-expect-error Plugin compatibility between Vite and Vitest versions
  plugins: [vuePlugin, quasarPlugin],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      'src/*': fileURLToPath(new URL('./src/*', import.meta.url)),
    },
  },
})
