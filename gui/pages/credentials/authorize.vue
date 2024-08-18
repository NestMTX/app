<template>
  <v-row justify="center">
    <v-col cols="12" sm="6" md="4" lg="3" xxl="2">
      <v-dialog
        :model-value="true"
        :persistent="true"
        max-width="500"
        scrim="surface"
        opacity="0.38"
      >
        <v-card color="transparent" class="glass-surface">
          <v-toolbar color="transparent" density="compact">
            <v-toolbar-title class="font-raleway font-weight-bold">{{
              $t('dialogs.credentials.authorize.title')
            }}</v-toolbar-title>
          </v-toolbar>
          <v-divider />
          <v-card-text>
            <v-alert color="warning" icon="mdi-alert" class="mb-3">
              <p>
                {{ $t('dialogs.credentials.authorize.text') }}
              </p>
            </v-alert>
            <v-progress-linear indeterminate height="20"></v-progress-linear>
            <p class="mt-3">
              {{ $t('dialogs.credentials.authorize.postText') }}
            </p>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ToastService, ApiService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'CredentialsAuthorize',
  components: {},
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const api = inject<ApiService>('api')!
    const origin = ref<string | undefined>(undefined)
    const route = useRoute()
    const router = useRouter()
    const localeRoute = useLocaleRoute()
    const doAuthorization = async () => {
      const query = {
        ...route.query,
        origin: origin.value,
      }
      const encoded = btoa(JSON.stringify(query))
      const uri = `/api/credentials/${encoded}`
      try {
        const { status, data } = await api.get(uri)
        if (status === 200) {
          toast.fire({
            title: t('dialog.credentials.authorize.success'),
            icon: 'success',
          })
        } else {
          if (
            'object' === typeof data &&
            null !== data &&
            'object' === typeof data.error &&
            null !== data.error &&
            'string' === typeof data.error.message
          ) {
            toast.fire({
              title: t('errors.credentials.authorize.unhandled.title'),
              text: t(data.error.message),
              icon: 'error',
            })
          } else {
            toast.fire({
              title: t('errors.credentials.authorize.unexpected.title'),
              text: t('errors.credentials.authorize.unexpected.text'),
              icon: 'error',
            })
          }
        }
      } catch (error) {
        // error
        console.error(error)
        toast.fire({
          title: t('errors.credentials.authorize.unexpected.title'),
          text: t('errors.credentials.authorize.unexpected.text'),
          icon: 'error',
        })
      }
      router.push(localeRoute({ name: 'credentials' }))
    }

    onMounted(() => {
      origin.value = window.location.origin
      doAuthorization()
    })
    onBeforeUnmount(() => {
      origin.value = undefined
    })
    return {}
  },
})
</script>
