// https://nuxt.com/docs/api/configuration/nuxt-config
import type { VueprintModuleOptions } from '@jakguru/vueprint/nuxt'
import * as languages from './locales'
import { resolve } from 'path'

const locales = Object.keys(languages)
const messages = Object.assign(
  {},
  ...locales.map((lang) => ({
    [lang]: (languages[lang as keyof typeof languages] as any).$vuetify || {},
  }))
)

export const vueprintModuleOptions: VueprintModuleOptions = {
  bus: {
    namespace: 'nestmtx',
  },
  identity: {
    tokenRefresh: async (api, signal) => {
      const { status, data } = await api.put('/api/auth/current', { signal })
      if (status === 200) {
        return data
      } else {
        throw new Error('Failed to refresh token')
      }
    },
    tokenRefreshBuffer: 60 * 5,
  },
  ls: {
    namespace: 'nestmtx',
  },
  vuetify: {
    defaultTheme: 'nestmtx-night',
    themes: {
      'nestmtx-night': {
        dark: true,
        colors: {
          accent: '#FFFFFF',
          background: '#121212',
          cancel: '#f44336',
          error: '#EF9A9A',
          highlight: '#e67e7e',
          info: '#8bb4e7',
          notify: '#F6AD01',
          primary: '#0684c2',
          question: '#3174F1',
          secondary: '#13aab9',
          success: '#29D967',
          surface: '#424242',
          warning: '#f3cc31',
        },
      },
      'nestmtx-day': {
        dark: false,
        colors: {
          accent: '#676464',
          background: '#FFFFFF',
          cancel: '#f44336',
          error: '#B71C1C',
          highlight: '#0684c2',
          info: '#2eccca',
          notify: '#F6AD01',
          primary: '#0684c2',
          question: '#3174F1',
          secondary: '#425d9d',
          success: '#29D967',
          surface: '#ffffff',
          warning: '#f3cc31',
        },
      },
    },
    options: {
      defaults: {
        VTextField: {
          variant: 'outlined',
          hideDetails: 'auto',
        },
        VSelect: {
          variant: 'outlined',
          hideDetails: 'auto',
          itemTitle: 'title',
          itemValue: 'value',
        },
        VAutocomplete: {
          variant: 'outlined',
          hideDetails: 'auto',
          itemTitle: 'title',
          itemValue: 'value',
        },
        VSwitch: {
          color: 'primary',
          hideDetails: 'auto',
        },
        VFileInput: {
          variant: 'outlined',
          hideDetails: 'auto',
        },
      },
      locale: {
        locale: 'en',
        fallback: 'en',
        messages,
      },
    },
  },
  webfontloader: {
    custom: {
      families: [
        'Noto Serif Display',
        'Noto Sans Mono',
        'Noto Sans Display',
        'Fuggles',
        'Raleway',
        'Material Icons',
      ],
    },
  },
}

export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  devServer: {
    host: '0.0.0.0',
    port: 2002,
  },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:2000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://127.0.0.1:2000',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      // exclude: ['sweetalert2'],
    },
    define: {
      'process.env.VERSION': JSON.stringify(process.env.VERSION || 'source'),
      'import.meta.env.VERSION': JSON.stringify(process.env.VERSION || 'source'),
    },
  },

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@vee-validate/nuxt',
    '@nuxtjs/i18n',
    '@jakguru/vueprint/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        if (!config.resolve) {
          config.resolve = {}
        }
        config.resolve.alias = {
          ...config.resolve.alias,
          'joi': 'joi/lib',
          'sweetalert2.scss': resolve(__dirname, 'node_modules/sweetalert2/src/sweetalert2.scss'),
          'sweetalert2': 'sweetalert2/src/sweetalert2.js',
        }
      })
    },
  ],

  vueprint: vueprintModuleOptions,

  build: {
    transpile: [
      '@jakguru/vueprint',
      // 'sweetalert2'
    ],
  },

  css: ['@/assets/glass.scss', '@/assets/fonts.scss', '@/assets/main.scss'],

  app: {
    head: {
      title: 'NestMTX',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'msapplication-TileColor', content: '#b2d7ff' },
        { name: 'theme-color', content: '#b2d7ff' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '57x57', href: '/apple-touch-icon-57x57.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: '/apple-touch-icon-60x60.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: '/apple-touch-icon-72x72.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: '/apple-touch-icon-76x76.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: '/apple-touch-icon-114x114.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-touch-icon-120x120.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: '/apple-touch-icon-144x144.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' },
      ],
    },
  },

  veeValidate: {
    autoImports: true,
  },

  i18n: {
    differentDomains: false,
    defaultLocale: 'en',
    locales: locales,
    strategy: 'prefix_except_default',
  },

  compatibilityDate: '2024-08-15',
  hooks: {
    close: () => {
      console.log('Build completed. Killing process in 5 seconds...')
      setTimeout(() => {
        process.exit(0)
      }, 5000)
    },
  },
})

declare module '@jakguru/vueprint' {
  interface BusEventCallbackSignatures {
    'theme:changed': (theme: string, from?: string) => void
  }
}
