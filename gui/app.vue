<template>
  <NuxtLayout>
    <NuxtPage v-if="complete && !updating" />
    <v-snackbar
      :model-value="updateable"
      :close-on-back="false"
      :timeout="-1"
      color="info"
      location="bottom right"
    >
      {{ $t('sw.updatable') }}
      <template #actions>
        <v-btn variant="elevated" color="primary" :loading="updating" @click="doUpdate">{{
          $t('actions.update')
        }}</v-btn>
      </template>
    </v-snackbar>
  </NuxtLayout>
</template>

<script lang="ts">
import { defineComponent, inject, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import { useTheme } from 'vuetify'
import { initializeLocale } from '@/utilities/i18n'
import { getDebugger } from '@jakguru/vueprint/utilities/debug'
import type { PushService } from '@jakguru/vueprint/services/push'
import type { LocalStorageService, BusService } from '@jakguru/vueprint'
import type { Socket } from 'socket.io-client'

const iodbg = getDebugger('socket.io', '#121212', '#0684c2')

export default defineComponent({
  name: 'App',
  setup() {
    const theme = useTheme()
    const io = inject<Socket>('io')!
    const ls = inject<LocalStorageService>('ls')

    const updateSocketConnection = () => {
      if (io) {
        io.disconnect()
        const bearer = ls?.get('bearer')
        if (bearer) {
          io.io.opts.extraHeaders = { Authorization: `Bearer ${bearer}` }
          // @ts-expect-error auth is not in the types
          io.io.opts.auth = { token: bearer }
          io.io.opts.query = { token: bearer }
        } else {
          io.io.opts.extraHeaders = {}
          // @ts-expect-error auth is not in the types
          delete io.io.opts.auth
          io.io.opts.query = {}
        }
        io.connect()
      }
    }

    const { mounted, booted, ready, updateable } = useVueprint({
      onReady: {
        onTrue: () => {
          updateSocketConnection()
          if (io) {
            io.on('connect', () => {
              iodbg('connect')
            })
            io.on('connect_error', () => {
              iodbg('connect_error')
            })
            io.on('disconnect', () => {
              iodbg('disconnect')
            })
            io.on('error', () => {
              iodbg('error')
            })
            io.on('ping', () => {
              iodbg('ping')
            })
            io.on('reconnect', () => {
              iodbg('reconnect')
            })
            io.on('reconnect_attempt', () => {
              iodbg('reconnect_attempt')
            })
            io.on('reconnect_error', () => {
              iodbg('reconnect_error')
            })
            io.on('reconnect_failed', () => {
              iodbg('reconnect_failed')
            })
            io.on('log', (msg: string) => {
              iodbg('log', msg)
            })
          }
        },
        onFalse: () => {
          updateSocketConnection()
          if (io) {
            io.off('connect')
            io.off('connect_error')
            io.off('disconnect')
            io.off('error')
            io.off('ping')
            io.off('reconnect')
            io.off('reconnect_attempt')
            io.off('reconnect_error')
            io.off('reconnect_failed')
            io.off('log')
          }
        },
      },
      onAuthenticated: {
        onTrue: () => {
          updateSocketConnection()
        },
        onFalse: () => {
          updateSocketConnection()
        },
      },
    }, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const updating = ref(false)
    const push = inject<PushService>('push')
    const bus = inject<BusService>('bus')
    const doUpdate = async () => {
      updating.value = true
      await push?.update()
      updating.value = false
    }
    const onThemeChanged = (ct: string) => {
      if (theme && ct) {
        theme.global.name.value = ct
      }
    }
    onMounted(() => {
      initializeLocale()
      if (ls) {
        const ct = ls.get('theme')
        if (theme && ct) {
          theme.global.name.value = ct
        }
      }
      if (bus) {
        bus.on('theme:changed', onThemeChanged, { crossTab: true })
      }
    })
    onBeforeUnmount(() => {
      if (bus) {
        bus.off('theme:changed', onThemeChanged, { crossTab: true })
      }
    })
    return { mounted, booted, ready, complete, updateable, updating, doUpdate }
  },
})
</script>
