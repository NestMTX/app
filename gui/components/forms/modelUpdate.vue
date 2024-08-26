<template>
  <v-container tag="form" action="#" method="POST" fluid @submit.stop="submit">
    <v-row v-for="(field, i) in formFields" :key="`form-field-${i}`">
      <v-col cols="12">
        <component :is="field.is" v-bind="field.bindings" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-btn
          type="submit"
          color="secondary"
          size="x-large"
          block
          :disabled="formIsValidating"
          :loading="formIsSubmitting"
          class="text-white"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from 'vue'
import { VTextField } from 'vuetify/components/VTextField'
import VPasswordField from '@/components/fields/password.vue'
import { VAutocomplete } from 'vuetify/components/VAutocomplete'
import { VSwitch } from 'vuetify/components/VSwitch'
import { useForm } from 'vee-validate'
import { useI18n } from 'vue-i18n'

import type { PropType } from 'vue'
import type { ApiService, SwalService } from '@jakguru/vueprint'
import type { ModelUpdateField } from '../../types/forms.js'

export default defineComponent({
  name: 'ModelUpdate',
  components: {
    VTextField,
    VPasswordField,
    VAutocomplete,
    VSwitch,
  },
  props: {
    fields: {
      type: Array as PropType<ModelUpdateField[]>,
      required: true,
    },
    id: {
      type: [String, Number],
      required: true,
    },
    updateEndPoint: {
      type: String,
      required: true,
    },
  },
  emits: ['submitted'],
  setup(props, { emit }) {
    const { t } = useI18n({ useScope: 'global' })
    const fields = computed(() => props.fields)
    const updateEndPoint = computed(() => props.updateEndPoint)
    const initialValues = Object.assign(
      {},
      ...[...fields.value].map((field) => ({ [field.key]: field.value || field.default }))
    )
    const validationSchema = Object.assign(
      {},
      ...[...fields.value].map((field) => ({ [field.key]: field.validator.bind(null, t) }))
    )
    const {
      handleSubmit: handleFormSubmit,
      isSubmitting: formIsSubmitting,
      isValidating: formIsValidating,
      defineComponentBinds: defineFormComponentBinds,
      setFieldValue: setFormFieldValue,
    } = useForm({
      initialValues,
      validationSchema,
    })
    const vuetifyConfig = (field: ModelUpdateField, state: any) => ({
      props: {
        ...field.bindings,
        'label': field.label,
        'density': 'comfortable',
        'disabled': !!formIsSubmitting.value,
        'clearable': !formIsSubmitting.value && !formIsValidating.value,
        'error-messages': state.touched ? state.errors : [],
        'hide-details':
          !state.touched ||
          state.errors.filter((v: unknown) => typeof v === 'string' && v.trim().length > 0)
            .length === 0,
      },
    })
    const api = inject<ApiService>('api')!
    const swal = inject<SwalService>('swal')!
    const toast = inject<SwalService>('toast')!
    watch(
      () => fields.value,
      (updated) => {
        for (const field of updated) {
          setFormFieldValue(field.key, field.value || field.default)
        }
      },
      { deep: true }
    )
    const submit = handleFormSubmit(async (values) => {
      const { status, data } = await api.put(`${updateEndPoint.value}/${props.id}`, values, {
        validateStatus: () => true,
      })
      if (status === 201) {
        emit('submitted')
        toast.fire({
          icon: 'success',
          title: t('dialogs.update.success.title'),
        })
      } else {
        swal.fire({
          icon: 'error',
          title: t('errors.update.title'),
          text: t(data.error.message),
        })
      }
    })
    const formFieldBindings = computed(() =>
      Object.assign(
        {},
        ...fields.value.map((f) => ({
          [f.key]: defineFormComponentBinds(f.key, vuetifyConfig.bind(null, f)).value,
        }))
      )
    )
    const formFields = computed(() =>
      Object.assign(
        {},
        ...fields.value.map((f) => ({
          [f.key]: {
            is: f.component,
            bindings: formFieldBindings.value[f.key],
          },
        }))
      )
    )
    return {
      submit,
      formFields,
      formIsValidating,
      formIsSubmitting,
    }
  },
})
</script>
