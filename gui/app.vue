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
import { useTheme } from "vuetify";
import { initializeLocale } from '@/utilities/i18n'
import type { PushService } from '@jakguru/vueprint/services/push'
import type { LocalStorageService , BusService } from '@jakguru/vueprint'

export default defineComponent({
  name: 'App',
  setup() {
    const theme = useTheme();
    const { mounted, booted, ready, updateable } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const updating = ref(false)
    const push = inject<PushService>('push')
    const ls = inject<LocalStorageService>('ls')
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
        bus.on('theme:changed', onThemeChanged, { crossTab: true})
      }
    })
    onBeforeUnmount(() => {
      if (bus) {
        bus.off('theme:changed', onThemeChanged, { crossTab: true})
      }
    })
    return { mounted, booted, ready, complete, updateable, updating, doUpdate }
  },
})
</script>
