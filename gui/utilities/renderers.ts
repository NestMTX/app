import { h, computed, defineComponent } from 'vue'
import DeviceChip from '../components/renderers/deviceChip.vue'
import CameraStatusChip from '../components/renderers/cameraStatusChip.vue'
import MtxPathForm from '../components/renderers/mtxPathForm.vue'
import type { PropType } from 'vue'

export const renderAsDefault = defineComponent({
  name: 'RenderAsDefault',
  props: {
    value: {
      type: String,
      required: true,
    },
    item: {
      type: Object as PropType<Record<string, unknown>>,
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
    item: {
      type: Object as PropType<Record<string, unknown>>,
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

export { DeviceChip as renderAsDeviceChip }
export { CameraStatusChip as renderAsCameraStatusChip }
export { MtxPathForm as renderAsMtxPathForm }
