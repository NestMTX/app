<template>
  <v-switch
    v-model="modelValue"
    :disabled="disabled"
    color="success"
    @update:model-value="onChange"
  />
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, inject } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ApiService, SwalService, ToastService, BusService } from '@jakguru/vueprint'
import '../../types/augmentations'
export default defineComponent({
  name: 'CameraPersistantSwitch',
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
    const item = computed(() => props.item)
    const disabled = computed(() => item.value.mtx_path === null || !item.value.is_enabled)
    watch(
      () => currentIsEnabled.value,
      (newIsEnabled) => {
        modelValue.value = newIsEnabled
      },
      { immediate: true }
    )
    const { t } = useI18n({ useScope: 'global' })
    const api = inject<ApiService>('api')!
    const swal = inject<SwalService>('swal')!
    const toast = inject<ToastService>('toast')!
    const bus = inject<BusService>('bus')!
    const onChange = async () => {
      const item = { ...props.item }
      const { status, data } = await api.put(
        `/api/cameras/${item.id}`,
        {
          mtx_path: item.mtx_path,
          is_enabled: item.is_enabled,
          is_persistent: modelValue.value,
        },
        {
          validateStatus: () => true,
        }
      )
      if (status === 201) {
        toast.fire({
          icon: 'success',
          title: t('dialogs.cameras.update.title'),
        })
        bus.emit('cameras:updated', {
          crossTab: true,
          local: true,
        })
      } else {
        swal.fire({
          icon: 'error',
          title: t('errors.cameras.update.title'),
          text: t(data.error.message),
        })
      }
    }
    return {
      modelValue,
      onChange,
      disabled,
    }
  },
})
</script>
