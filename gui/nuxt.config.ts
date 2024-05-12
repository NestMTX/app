// https://nuxt.com/docs/api/configuration/nuxt-config
import type { VueprintModuleOptions } from '@jakguru/vueprint/nuxt'

export const vueprintModuleOptions: VueprintModuleOptions = {
  bus: {
    namespace: 'nestmtx',
  },
  identity: {
    tokenRefresh: async (api, signal) => {
      const { status, data } = await api.get('/api/token/refresh', { signal })
      if (status === 200) {
        return data
      } else {
        throw new Error('Failed to refresh token')
      }
    },
    tokenRefreshBuffer: 24 * 60 * 60 * 1000,
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
          error: '#FFB74D',
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
        dark: true,
        colors: {
          accent: '#676464',
          background: '#FFFFFF',
          cancel: '#f44336',
          error: '#D50000',
          highlight: '#0684c2',
          info: '#8bb4e7',
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
  devtools: { enabled: true },
  ssr: true,
  devServer: {
    host: '0.0.0.0',
    port: 2001,
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:2000',
          changeOrigin: true,
        },
      },
    },
  },
  modules: ['@jakguru/vueprint/nuxt'],
  vueprint: vueprintModuleOptions,
  build: {
    transpile: ['@jakguru/vueprint'],
  },
  css: ['@/assets/glass.scss', '@/assets/fonts.scss', '@/assets/main.scss'],
})
