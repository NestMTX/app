<template>
  <v-text-field
    readonly
    :model-value="value"
    hide-details
    append-inner-icon="mdi-content-copy"
    v-bind="bound"
    @click:append-inner="copy"
  >
    <template v-for="(_, slot) of $slots" #[slot]="scope"
      ><slot :name="slot" v-bind="scope"
    /></template>
  </v-text-field>
</template>

<script lang="ts">
import { computed } from 'vue'
import { VTextField } from 'vuetify/components/VTextField'
import { useClipboard } from '@vueuse/core'
import { useDefaults } from 'vuetify'
const toSkip = [
  'readonly',
  'value',
  'model-value',
  'modelValue',
  'hide-details',
  'append-inner-icon',
  'hideDetails',
  'appendInnerIcon',
  'onClick:prependInner',
]
const makeProps = (additional: any = {}) => {
  const props: any = {}
  for (const key in VTextField.props) {
    if (toSkip.includes(key)) {
      continue
    }
    props[key] = VTextField.props[key]
  }
  return {
    ...props,
    ...additional,
  }
}

export default {
  name: 'VTextFieldWithCopy',
  props: makeProps({
    value: {
      type: String,
      default: '',
    },
  }),
  emits: ['copied', 'copy-failed'],
  setup(props, { emit }) {
    const value = computed(() => props.value)
    const { copy: doCopy, copied, isSupported, text } = useClipboard()
    const copy = async () => {
      await doCopy(value.value)
      if (copied.value && text.value === value.value) {
        emit('copied')
      } else {
        emit('copy-failed')
      }
    }
    const defaults = useDefaults(props, 'VTextField')
    const bound = computed(() => {
      const ret: any = {}
      for (const key in VTextField.props) {
        if (toSkip.includes(key)) {
          continue
        }
        ret[key] = defaults[key as keyof typeof defaults]
      }
      return ret
    })
    return {
      copy,
      isSupported,
      bound,
    }
  },
}
</script>

<style></style>
