<template>
  <form action="#" method="POST" @submit.stop="submit">
    <pre v-text="JSON.stringify(fields, null, 2)" />
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { ValidationRule } from '@/utilities/validations'

interface ModelAddField {
  key: string
  label: string
  validator: ValidationRule
  default: any
  component: 'VTextField' | 'VPasswordField' | 'VAutocomplete' | 'VSwitch'
  bindings: Record<string, any>
}

export default defineComponent({
  name: 'ModelAdd',
  props: {
    fields: {
      type: Array as PropType<ModelAddField[]>,
      required: true,
    },
  },
})
</script>
