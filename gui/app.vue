<template>
  <NuxtLayout>
    <v-app-bar app color="transparent" class="glass-primary">
      <v-toolbar-title>NestMTX</v-toolbar-title>
      <v-spacer />
      <ThemeToggle />
    </v-app-bar>
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
import { defineComponent, inject, computed, ref, onMounted } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import { useTheme } from "vuetify";
import type { PushService } from '@jakguru/vueprint/services/push'
import type { LocalStorageService } from '@jakguru/vueprint'

import ThemeToggle from '@/components/theme/toggle.vue'

export default defineComponent({
  components: {
    ThemeToggle,
  },
  setup() {
    const theme = useTheme();
    const { mounted, booted, ready, updateable } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const updating = ref(false)
    const push = inject<PushService>('push')
    const ls = inject<LocalStorageService>('ls')
    const doUpdate = async () => {
      updating.value = true
      await push?.update()
      updating.value = false
    }
    onMounted(() => {
      if (ls) {
        const theme = ls.get('theme')
        if (theme) {
          theme.global.name.value = theme
        }
      }
    })
    return { mounted, booted, ready, complete, updateable, updating, doUpdate }
  },
})
</script>
