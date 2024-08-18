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
                    ref="modelIndex"
                    model-i18n-key="models.credentials"
                    search-end-point="/api/credentials/"
                    :columns="modelIndexColumns"
                    :actions="modelIndexActions"
                  >
                    <template #action-buttons>
                      <v-btn
                        icon
                        color="secondary"
                        variant="elevated"
                        size="38"
                        @click="showAddDialog = true"
                      >
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
    <v-dialog
      v-model="showAddDialog"
      :persistent="persistShowAddDialog"
      max-width="500"
      scrim="surface"
      opacity="0.38"
    >
      <v-card color="transparent" class="glass-surface">
        <v-toolbar color="transparent" density="compact">
          <v-toolbar-title class="font-raleway font-weight-bold">{{
            $t('dialogs.credentials.add.title')
          }}</v-toolbar-title>
          <v-toolbar-items>
            <v-btn icon :disabled="persistShowAddDialog" @click="showAddDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-divider />
        <ModelAdd v-bind="modelAddBindings" @submitted="onModelAddSubmitted" />
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { validatorFactory } from '@/utilities/validations'
import Joi from 'joi'
import VTextFieldWithCopy from '../../components/fields/VTextFieldWithCopy.vue'
import ModelIndex from '../../components/forms/modelIndex.vue'
import ModelAdd from '../../components/forms/modelAdd.vue'
import type { ToastService, ApiService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'Credentials',
  components: {
    VTextFieldWithCopy,
    ModelIndex,
    ModelAdd,
  },
  setup() {
    const modelIndex = ref<ModelIndex | undefined>(undefined)
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const api = inject<ApiService>('api')!
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
    const showAddDialog = ref(false)
    const persistShowAddDialog = ref(false)
    const onAddDialogPersist = (persist: boolean) => {
      persistShowAddDialog.value = persist
    }
    const modelIndexColumns = computed(() => [
      {
        key: 'description',
        label: t('fields.description'),
        formatter: (value: unknown) => value as string,
        sortable: true,
      },
    ])
    const modelIndexActions = computed(() => [
      {
        icon: 'mdi-delete',
        label: t('actions.delete'),
        callback: async (row: Record<string, unknown>) => {
          const { status } = await api.delete(`/api/credentials/${row.id}/`)
          if (status === 204) {
            toast.fire({
              title: t('dialogs.credentials.delete.success.title'),
              icon: 'success',
            })
          } else {
            toast.fire({
              title: t('dialogs.credentials.delete.failure.title'),
              icon: 'error',
            })
          }
        },
      },
      {
        icon: 'mdi-shield-check',
        label: t('actions.authorize'),
        callback: async (row: Record<string, unknown>) => {
          const { status, data } = await api.put(`/api/credentials/${row.id}/`, {
            origin: window.location.origin,
          })
          if (201 !== status) {
            toast.fire({
              title: t('dialogs.credentials.authorize.failure.title'),
              icon: 'error',
            })
          }
          window.location.href = data
        },
        condition: (row: Record<string, unknown>) => row.tokens === null,
      },
      {
        icon: 'mdi-pencil',
        label: t('actions.manage'),
        callback: async (row: Record<string, unknown>) => {
          const { status, data } = await api.put(`/api/credentials/${row.id}/`, {
            origin: window.location.origin,
          })
          if (201 !== status) {
            toast.fire({
              title: t('dialogs.credentials.manage.failure.title'),
              icon: 'error',
            })
          }
          window.location.href = data
        },
        condition: (row: Record<string, unknown>) => row.tokens !== null,
      },
    ])
    const modelAddBindings = computed(() => ({
      fields: [
        {
          key: 'description',
          label: t('fields.description'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VTextField',
          bindings: {},
        },
        {
          key: 'oauth_client_id',
          label: t('fields.oauth_client_id'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VTextField',
          bindings: {},
        },
        {
          key: 'oauth_client_secret',
          label: t('fields.oauth_client_secret'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VPasswordField',
          bindings: {},
        },
        {
          key: 'dac_project_id',
          label: t('fields.dac_project_id'),
          validator: validatorFactory(Joi.string().allow(null)),
          default: null,
          component: 'VTextField',
          bindings: {},
        },
      ],
      addEndPoint: '/api/credentials/',
    }))
    const onModelAddSubmitted = () => {
      showAddDialog.value = false
      if (modelIndex.value) {
        modelIndex.value.loadItems()
      }
    }
    return {
      https,
      authUrl,
      onCopySuccess,
      onCopyFail,
      showAddDialog,
      persistShowAddDialog,
      onAddDialogPersist,
      modelAddBindings,
      modelIndex,
      onModelAddSubmitted,
      modelIndexColumns,
      modelIndexActions,
    }
  },
})
</script>
