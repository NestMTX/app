<template>
    <v-card color="transparent" class="glass-surface" min-height="100" tag="form" action="#" method="POST" @submit.stop="submit">
        <v-toolbar color="transparent">
            <img src="~/assets/icon.png" alt="NestMTX" class="ms-4" height="32" width="32" />
            <v-toolbar-title class="font-raleway font-weight-bold">NestMTX</v-toolbar-title>
            <v-spacer />
            <ThemeToggle />
        </v-toolbar>
        <v-divider />
        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-text-field
                    v-bind="form.username"
                    scroll-into-view
                    :label="$t('fields.username')"
                    autocomplete="username"
                    :disabled="formIsSubmitting"
                    density="comfortable"
                    :clearable="!formIsSubmitting && !formIsValidating"
                    prepend-inner-icon="mdi-account-outline"
                    >
                    <template #append-inner>
                        <slot name="email-append"></slot>
                    </template>
                    </v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
                    <VPasswordField
                    v-bind="form.password"
                    scroll-into-view
                    :label="$t('fields.password')"
                    autocomplete="current-password"
                    prepend-inner-icon="mdi-lock-outline"
                    :disabled="formIsSubmitting"
                    density="comfortable"
                    :clearable="!formIsSubmitting && !formIsValidating"
                    />
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
                    {{ $t('actions.login') }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import ThemeToggle from '@/components/theme/toggle.vue'
  import VPasswordField from '@/components/fields/password.vue'
  import { useForm } from 'vee-validate'
  import { useI18n } from 'vue-i18n'
  import { validateUsername, validatePassword } from '@/utilities/validations'

  import type { IdentityService } from '@jakguru/vueprint'
  export default defineComponent({
    name: 'LoginForm',
    components: { ThemeToggle, VPasswordField },
    setup() {
        const { t } = useI18n({ useScope: 'global' })
        const vuetifyConfig = (state: any) => ({
            props: {
                'error-messages': state.touched ? state.errors : [],
                'hide-details':
                !state.touched ||
                state.errors.filter((v: unknown) => typeof v === 'string' && v.trim().length > 0)
                    .length === 0,
            },
        })
        const {
            handleSubmit: handleFormSubmit,
            isSubmitting: formIsSubmitting,
            isValidating: formIsValidating,
            defineComponentBinds: defineFormComponentBinds,
            setFieldValue: setFormFieldValue,
            errors: formErrors,
            resetForm: resetFormFields,
            resetField: resetFormField,
            setFieldTouched: setFormFieldTouched,
            setTouched: setFormTouched,
        } = useForm({
            initialValues: {
                username: '',
                password: '',
            },
            validationSchema: {
                username: validateUsername.bind(null, t),
                password: validatePassword.bind(null, t),
            },
        })
        const submit = handleFormSubmit(async (values) => {
            console.log(values)
        })
        const form = computed(() => ({
            username: defineFormComponentBinds('username', vuetifyConfig).value,
            password: defineFormComponentBinds('password', vuetifyConfig).value,
        }))
      return {
        submit,
        form,
        formIsSubmitting,
        formIsValidating,
        resetFormFields,
        resetFormField,
        formErrors,
        setFormFieldTouched,
        setFormTouched,
      }
    },
  })
  </script>
  