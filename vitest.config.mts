import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

// Create separate test configuration
const testConfig = {
  environment: 'happy-dom',
  setupFiles: 'test/vitest/setup-file.ts',
  include: [
    // Matches vitest tests in any subfolder of 'src' or into 'test/vitest/__tests__'
    // Matches all files with extension 'js', 'jsx', 'ts' and 'tsx'
    'src/**/*.vitest.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'test/vitest/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ],
};

// Create plugins separately
const vuePlugin = vue({
  template: { transformAssetUrls },
});

const quasarPlugin = quasar({
  sassVariables: 'src/quasar-variables.scss',
});

const tsconfigPathsPlugin = tsconfigPaths();

// https://vitejs.dev/config/
export default defineConfig({
  test: testConfig,
  // @ts-expect-error Plugin compatibility between Vite and Vitest versions
  plugins: [vuePlugin, quasarPlugin, tsconfigPathsPlugin],
});
