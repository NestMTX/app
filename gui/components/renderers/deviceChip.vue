<template>
  <v-chip-group>
    <template v-for="device in value" :key="device">
      <v-chip :title="device">
        <DeviceIcon :device="device" variant="posterized" height="18px" />
      </v-chip>
    </template>
  </v-chip-group>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DeviceIcon from '../icons/device.vue'
import type { PropType } from 'vue'
export default defineComponent({
  name: 'DeviceChip',
  components: {
    DeviceIcon,
  },
  props: {
    value: {
      type: Array as PropType<string[]>,
      required: true,
    },
    item: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
})
</script>
