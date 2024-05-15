<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { VTextField } from 'vuetify/components/VTextField'
import { useDefaults } from 'vuetify'

export default defineComponent({
  name: 'VPasswordField',
  props: { ...VTextField.props },
  emits: Object.keys({ ...VTextField.emits }),
  setup(props, { emit }) {
    const passwordFieldType = ref('password')
    const passwordFieldTypeIcon = computed(() =>
      passwordFieldType.value === 'password' ? 'mdi-eye-lock-open-outline' : 'mdi-eye-off-outline'
    )
    const togglePasswordFieldType = () => {
      passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password'
    }
    const passedProps = computed(() => props)
    const defaults = useDefaults(passedProps.value, 'VTextField')
    const updatedProps = computed(() => ({
      ...defaults,
      'type': passwordFieldType.value,
      'append-inner-icon': passwordFieldTypeIcon.value,
    }))
    const updatedEmitters = computed(() => {
      const ret: any = {
        'click:append-inner': togglePasswordFieldType,
      }
      Object.keys({ ...VTextField.emits }).forEach((evnt) => {
        ret[evnt] = (e: any) => emit(evnt, e)
      })
      return ret
    })
    const field = ref<VTextField | undefined>(undefined)
    return { updatedProps, updatedEmitters, field }
  },
})
</script>

<template>
  <v-text-field ref="field" v-bind="updatedProps" class="v-password-field" v-on="updatedEmitters" />
</template>

<style lang="scss">
.v-password-field {
  input:focus,
  input:active {
    opacity: 1;
  }
}
</style>
