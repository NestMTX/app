<template>
  <form action="#" method="POST" @submit.stop="submit">
    <v-text-field v-bind="form.mtx_path" density="compact">
      <template v-if="!currentIsEnabled" #append-inner>
        <v-btn
          icon="mdi-content-save"
          :loading="formIsSubmitting"
          density="compact"
          type="submit"
          variant="plain"
          size="small"
          @click="submit"
        />
      </template>
    </v-text-field>
  </form>
</template>

<script lang="ts">
import { defineComponent, computed, watch, inject } from 'vue'
import type { PropType } from 'vue'
import { useForm } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { validatorFactory } from '../../utilities/validations'
import Joi from 'joi'
import type { ApiService, SwalService, ToastService, BusService } from '@jakguru/vueprint'
import '../../types/augmentations'
export default defineComponent({
  name: 'MtxPathForm',
  components: {},
  props: {
    value: {
      type: [String, Object] as PropType<string | null | undefined>,
      default: undefined,
    },
    item: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props) {
    const currentMtxPath = computed(() => props.value)
    const currentIsEnabled = computed(() => props.item.is_enabled)
    const { t } = useI18n({ useScope: 'global' })
    const mtxPathValidator = validatorFactory(
      Joi.string()
        .optional()
        .allow(null)
        .regex(/^[A-Za-z0-9\-._~]+$/)
    )
    const {
      handleSubmit: handleFormSubmit,
      isSubmitting: formIsSubmitting,
      isValidating: formIsValidating,
      defineComponentBinds: defineFormComponentBinds,
      setFieldTouched: setFormFieldTouched,
      setFieldValue: setFormFieldValue,
    } = useForm({
      initialValues: {
        mtx_path: null as null | string,
      },
      validationSchema: {
        mtx_path: mtxPathValidator.bind(null, t),
      },
    })
    watch(
      () => currentMtxPath.value,
      (newMtxPath) => {
        setFormFieldValue('mtx_path', newMtxPath || null)
        setFormFieldTouched('mtx_path', false)
      },
      { immediate: true }
    )
    const vuetifyConfig = (state: any) => ({
      props: {
        'error-messages': state.touched ? state.errors : [],
        'hide-details':
          !state.touched ||
          state.errors.filter((v: unknown) => typeof v === 'string' && v.trim().length > 0)
            .length === 0,
        'label': '',
        'readonly': formIsSubmitting.value || currentIsEnabled.value === true,
        'clearable': !formIsSubmitting.value && !formIsValidating.value,
        'minWidth': 200,
      },
    })
    const api = inject<ApiService>('api')!
    const swal = inject<SwalService>('swal')!
    const toast = inject<ToastService>('toast')!
    const bus = inject<BusService>('bus')!
    const submit = handleFormSubmit(async (values) => {
      const item = { ...props.item }
      const { status, data } = await api.put(
        `/api/cameras/${item.id}`,
        {
          mtx_path: values.mtx_path,
          is_enabled: item.is_enabled,
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
    })
    const form = computed(() => ({
      mtx_path: defineFormComponentBinds('mtx_path', vuetifyConfig).value,
    }))
    return {
      submit,
      form,
      currentIsEnabled,
      formIsSubmitting,
    }
  },
})
</script>
