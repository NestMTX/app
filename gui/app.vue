<template>
  <NuxtLayout>
    <v-app-bar app color="transparent" class="glass-primary">
      <v-toolbar-title>NestMTX</v-toolbar-title>
      <v-spacer />
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
import { defineComponent, inject, computed, ref } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import type { PushService } from '@jakguru/vueprint/services/push'
export default defineComponent({
  setup() {
    const { mounted, booted, ready, updateable } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const updating = ref(false)
    const push = inject<PushService>('push')
    const doUpdate = async () => {
      updating.value = true
      await push?.update()
      updating.value = false
    }
    return { mounted, booted, ready, complete, updateable, updating, doUpdate }
  },
})
</script>
