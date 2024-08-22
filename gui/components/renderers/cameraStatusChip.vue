<template>
  <v-chip :title="title" :color="color">
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
      type: String as PropType<'unconfigured' | 'stopped' | 'unstopped' | 'dead' | 'running'>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n({ useScope: 'global' })
    const value = computed(() => props.value)
    const color = computed(() => {
      switch (value.value) {
        case 'unconfigured':
          return 'grey'
        case 'unstopped':
        case 'stopped':
          return 'red'
        case 'dead':
          return 'black'
        case 'running':
          return 'green'
        default:
          return 'grey'
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
