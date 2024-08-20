import { h, computed, defineComponent } from 'vue'

export const renderAsDefault = defineComponent({
  name: 'RenderAsDefault',
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const val = computed(() => props.value)
    return () =>
      h('span', {
        innerHTML: val.value,
      })
  },
})

export const renderAsCode = defineComponent({
  name: 'RenderAsCode',
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const val = computed(() => props.value)
    return () =>
      h('code', {
        innerHTML: val.value,
      })
  },
})
