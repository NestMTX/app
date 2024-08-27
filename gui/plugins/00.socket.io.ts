import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

declare module '#app' {
  interface NuxtApp {
    $io: Socket
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $io: Socket
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const IO = io({
    transports: ['websocket', 'polling'],
    autoConnect: false,
  })
  IO.on('connect_error', () => {
    // revert to classic upgrade
    IO.io.opts.transports = ['polling', 'websocket']
  })
  nuxtApp.vueApp.provide('io', IO)
  nuxtApp.vueApp.config.globalProperties.$io = IO
})
