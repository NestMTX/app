<template>
  <v-row justify="center">
    <v-col cols="12">
      <v-row>
        <v-col cols="12">
          <v-card color="transparent" class="glass-surface mt-3" min-height="100">
            <v-card-text>
              <v-alert color="info" icon="mdi-information">
                <p>
                  <strong>{{ $t('credentials.redirectUrl.title') }}</strong>
                </p>
                <p>
                  {{ $t('credentials.redirectUrl.cta') }}
                </p>
              </v-alert>
            </v-card-text>
            <v-container v-if="authUrl" fluid>
              <v-row>
                <v-col cols="12">
                  <VTextFieldWithCopy
                    :value="authUrl"
                    :label="$t('fields.redirectUrl')"
                    readonly
                    @copied="onCopySuccess"
                    @copy-failed="onCopyFail"
                  />
                </v-col>
              </v-row>
            </v-container>
            <v-card-text v-if="!https">
              <v-alert color="warning" icon="mdi-alert">
                <p>
                  <strong>{{ $t('credentials.redirectUrl.insecure.title') }}</strong>
                </p>
                <i18n-t keypath="credentials.redirectUrl.insecure.message" tag="p">
                  <template #https>
                    <code>https://</code>
                  </template>
                  <template #http>
                    <code>http://</code>
                  </template>
                </i18n-t>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card color="transparent" class="glass-surface" min-height="100">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <ModelIndex
                    model-i18n-key="models.credentials"
                    search-end-point="/api/credentials/"
                  >
                    <template #action-buttons>
                      <v-btn icon color="secondary" variant="elevated" size="38">
                        <v-icon>mdi-key-plus</v-icon>
                      </v-btn>
                    </template>
                  </ModelIndex>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import VTextFieldWithCopy from '../../components/fields/VTextFieldWithCopy.vue'
import ModelIndex from '../../components/forms/modelIndex.vue'
import type { ToastService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'Credentials',
  components: {
    VTextFieldWithCopy,
    ModelIndex,
  },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const origin = ref<string | undefined>(undefined)
    const url = computed<URL | undefined>(() => {
      if (origin.value) {
        return new URL(origin.value)
      }
      return undefined
    })
    const https = computed<boolean>(() => {
      if (url.value) {
        return url.value.protocol === 'https:'
      }
      return false
    })
    const authUrl = computed<string | undefined>(() => {
      if (url.value) {
        const ret = new URL('/credentials/authorize', url.value)
        ret.protocol = 'https:'
        return ret.toString()
      }
      return undefined
    })
    const onCopySuccess = () => {
      toast.fire({
        title: t('credentials.redirectUrl.actions.copy.success'),
        icon: 'success',
      })
    }
    const onCopyFail = () => {
      toast.fire({
        title: t('credentials.redirectUrl.actions.copy.failure'),
        icon: 'error',
      })
    }
    onMounted(() => {
      origin.value = window.location.origin
    })
    onBeforeUnmount(() => {
      origin.value = undefined
    })
    return {
      https,
      authUrl,
      onCopySuccess,
      onCopyFail,
    }
  },
})
</script>
