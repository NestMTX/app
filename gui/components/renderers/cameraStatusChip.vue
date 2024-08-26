<template>
  <v-chip :title="title" :color="color" variant="elevated">
    {{ title }}
  </v-chip>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PropType } from 'vue'
export default defineComponent({
  name: 'CameraStatusChip',
  props: {
    value: {
      type: String as PropType<
        'unconfigured' | 'disabled' | 'dead' | 'stopped' | 'unavailable' | 'starting' | 'running'
      >,
      required: true,
    },
    item: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n({ useScope: 'global' })
    const value = computed(() => props.value)
    const color = computed(() => {
      switch (value.value) {
        case 'disabled':
          return 'grey-darken-2'
        case 'dead':
          return 'blue-gray-lighten-3'
        case 'stopped':
          return 'red-lighten-1'
        case 'unavailable':
          return 'orange-darken-3'
        case 'starting':
          return 'yellow-accent-3'
        case 'running':
          return 'green-accent-3'
        case 'unconfigured':
        default:
          return 'grey-lighten-2'
      }
    })
    const title = computed(() => t(`camera.status.${value.value}`))
    return {
      color,
      title,
    }
  },
})
</script>
