// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers'

const extraAppleStartupImages = [
  {
    filename: 'icons/apple-launch-1206x2622.png',
    media:
      '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    filename: 'icons/apple-launch-2622x1206.png',
    media:
      '(device-width: 874px) and (device-height: 402px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    filename: 'icons/apple-launch-2796x1290.png',
    media:
      '(device-width: 932px) and (device-height: 430px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
]

const createApplePwaCompatibilityPlugin = (publicPath: string) => ({
  name: 'inject-apple-pwa-compatibility-tags',
  transformIndexHtml() {
    return [
      {
        tag: 'meta',
        attrs: {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        injectTo: 'head-prepend' as const,
      },
      ...extraAppleStartupImages.map(({ filename, media }) => ({
        tag: 'link',
        attrs: {
          rel: 'apple-touch-startup-image',
          href: `${publicPath}${filename}`,
          media,
        },
        injectTo: 'head-prepend' as const,
      })),
    ]
  },
})

export default defineConfig((ctx) => {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [...(ctx.dev ? ['mocks'] : []), 'vue-query', 'auth', 'addressbar-color'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      // 'roboto-font', // optional, you are not bound to it
      // 'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },

      typescript: {
        strict: true,
        vueShim: true,
        // extendTsConfig (tsConfig) {}
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'
      // vueRouterBase,
      vueDevtools: ctx.dev, // Only enable devtools in development
      // vueOptionsAPI: false,

      rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      analyze: process.env.ANALYZE === 'true', // Run with ANALYZE=true npm run build
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      minify: ctx.prod, // Enable minification in production
      polyfillModulePreload: true,
      // distDir

      extendViteConf(viteConf) {
        // Ensure build config exists
        if (!viteConf.build) viteConf.build = {}
        if (!Array.isArray(viteConf.plugins)) viteConf.plugins = []

        viteConf.plugins.push(createApplePwaCompatibilityPlugin(viteConf.base || '/'))

        // Bundle size optimizations
        viteConf.build = {
          ...viteConf.build,
          // Chunk splitting for better caching
          rollupOptions: {
            ...viteConf.build?.rollupOptions,
            output: {
              ...viteConf.build?.rollupOptions?.output,
              manualChunks: {
                // Split vendor chunks
                'vendor-vue': ['vue', 'vue-router', 'pinia'],
                'vendor-supabase': ['@supabase/supabase-js'],
                'vendor-utils': ['@vueuse/core'],
                'vendor-query': ['@tanstack/vue-query'],
              },
              // Optimize chunk file names
              chunkFileNames: ctx.prod ? 'js/[name]-[hash].js' : '[name].js',
              entryFileNames: ctx.prod ? 'js/[name]-[hash].js' : '[name].js',
              assetFileNames: ctx.prod ? 'assets/[name]-[hash].[ext]' : '[name].[ext]',
            },
          },
        }

        // Minification: Terser for production (smaller), esbuild for dev (faster)
        if (ctx.prod) {
          viteConf.build.minify = 'terser'
          viteConf.build.terserOptions = {
            compress: {
              drop_console: false, // Keep console logs for debugging production issues
              drop_debugger: true,
              pure_funcs: [], // Don't remove any function calls to preserve error logging
            },
            mangle: {
              safari10: true,
            },
          }
        } else {
          viteConf.build.minify = 'esbuild'
        }

        // Optimize dependency pre-bundling
        viteConf.optimizeDeps = {
          ...viteConf.optimizeDeps,
          include: [
            'vue',
            'vue-router',
            'pinia',
            'quasar',
            '@supabase/supabase-js',
            '@vueuse/core',
            '@tanstack/vue-query',
          ],
          exclude: [
            // Exclude test utilities from production builds
            '@vue/test-utils',
            'vitest',
          ],
        }

        // Additional production optimizations
        if (ctx.prod && viteConf.build) {
          // Enable CSS code splitting
          viteConf.build.cssCodeSplit = true

          // Optimize asset handling
          viteConf.build.assetsInlineLimit = 4096 // Inline assets smaller than 4kb

          // Avoid shipping source maps publicly in production output
          viteConf.build.sourcemap = false
        }

        // CSS source maps in development for easier debugging
        viteConf.css = {
          ...viteConf.css,
          devSourcemap: !ctx.prod,
        }
      },
      // viteVuePluginOptions: {},

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            vueTsc: {
              tsconfigPath: 'tsconfig.json',
            },
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
            overlay: {
              initialIsOpen: false,
              position: 'br',
            },
            enableBuild: false, // Skip during build (CI handles this)
          },
          { server: true },
        ],
        [
          'vite-plugin-compression',
          {
            algorithm: 'gzip',
            threshold: 1024, // Only compress files > 1kb
            disable: !ctx.prod, // Only enable in production
          },
        ],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // https: true,
      open: false, // opens browser window automatically
      port: 9000,
      warmup: {
        clientFiles: ['./src/layouts/*.vue', './src/pages/*.vue'],
      },
      hmr: {
        overlay: true,
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {
        dark: 'auto',
      },

      iconSet: 'eva-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['Dark', 'Notify', 'Dialog', 'Meta', 'AddressbarColor'],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false,
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'InjectManifest', // 'GenerateSW' or 'InjectManifest'
      // swFilename: 'sw.js',
      // manifestFilename: 'manifest.json',
      extendManifestJson(json) {
        // PWA optimizations for better caching
        json.start_url = '/'
        json.display = 'standalone'
        json.orientation = 'portrait-primary'
        json.categories = ['finance', 'productivity']
        json.lang = 'en'
      },
      // useCredentialsForManifestTag: true,
      // injectPwaMetaTags: false,
      // extendPWACustomSWConf (esbuildConf) {},
      extendInjectManifestOptions(cfg) {
        cfg.globIgnores = [
          '**/_redirects',
          '**/.DS_Store',
          '**/*.map',
          '**/*.gz',
          '**/mockServiceWorker.js',
          '**/icons/apple-launch-*.png',
        ]
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'shephard',
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: [],
    },
  }
})
