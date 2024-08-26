<template>
  <v-checkbox :model-value="modelValue" readonly hide-details />
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import type { PropType } from 'vue'
import '../../types/augmentations'
export default defineComponent({
  name: 'BooleanCheckbox',
  components: {},
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    item: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props) {
    const currentIsEnabled = computed(() => props.value)
    const modelValue = ref<boolean>(currentIsEnabled.value)
    return {
      modelValue,
    }
  },
})
</script>
