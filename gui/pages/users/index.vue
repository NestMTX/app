<template>
  <v-row justify="center">
    <v-col cols="12">
      <v-row>
        <v-col cols="12">
          <v-card color="transparent" class="glass-surface mt-3" min-height="100">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <ModelIndex
                    ref="modelIndex"
                    model-i18n-key="models.users"
                    search-end-point="/api/users/"
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
                        <v-icon>mdi-account-plus</v-icon>
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
            $t('dialogs.users.add.title')
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
    <v-dialog
      v-model="showUpdateDialog"
      :persistent="persistShowUpdateDialog"
      max-width="500"
      scrim="surface"
      opacity="0.38"
    >
      <v-card color="transparent" class="glass-surface">
        <v-toolbar color="transparent" density="compact">
          <v-toolbar-title class="font-raleway font-weight-bold">{{
            $t('dialogs.users.update.title')
          }}</v-toolbar-title>
          <v-toolbar-items>
            <v-btn icon :disabled="persistShowUpdateDialog" @click="showUpdateDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-divider />
        <ModelUpdate
          v-if="showUpdateDialog"
          v-bind="modelUpdateBindings"
          @submitted="onModelUpdateSubmitted"
        />
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { validatorFactory } from '@/utilities/validations'
import Joi from 'joi'
import ModelIndex from '../../components/forms/modelIndex.vue'
import ModelAdd from '../../components/forms/modelAdd.vue'
import ModelUpdate from '../../components/forms/modelUpdate.vue'
import { renderAsCode, renderAsBooleanCheckbox } from '../../utilities/renderers'
import type { ModelIndexField, ModelAddField, ModelUpdateField } from '../../types/forms.js'
import type { ToastService, ApiService, IdentityService } from '@jakguru/vueprint'
import '../../types/augmentations'

export default defineComponent({
  name: 'CamerasIndex',
  components: {
    ModelIndex,
    ModelAdd,
    ModelUpdate,
  },
  setup() {
    const modelIndex = ref<typeof ModelIndex | undefined>(undefined)
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const api = inject<ApiService>('api')!
    const identity = inject<IdentityService>('identity')!
    const modelIdToUpdate = ref<number | undefined>(undefined)
    const modelIndexColumns = computed<Array<ModelIndexField>>(() => [
      {
        key: 'username',
        label: t('fields.username'),
        formatter: (value: unknown) => value as string,
        renderer: renderAsCode,
        sortable: true,
      },
      {
        key: 'can_login',
        label: t('fields.can_login'),
        formatter: (value: unknown) => value as string,
        renderer: renderAsBooleanCheckbox,
        sortable: true,
      },
    ])
    const modelIndexActions = computed(() => [
      {
        icon: 'mdi-account-edit',
        label: t('actions.edit'),
        callback: async (row: Record<string, unknown>) => {
          modelIdToUpdate.value = row.id as number
        },
      },
      {
        icon: 'mdi-account-cancel',
        label: t('actions.disable'),
        color: 'warning',
        callback: async (row: Record<string, unknown>) => {
          const { status } = await api.put(`/api/users/${row.id}/`, {
            can_login: false,
          })
          if (status === 201) {
            toast.fire({
              title: t('dialogs.users.update.success.title'),
              icon: 'success',
            })
            if (modelIndex.value) {
              modelIndex.value.manualLoadItems()
            }
          } else {
            toast.fire({
              title: t('dialogs.users.update.failure.title'),
              icon: 'error',
            })
          }
        },
        condition: (row: Record<string, unknown>) =>
          Boolean(row.can_login && row.id !== identity.user.value!.id),
      },
      {
        icon: 'mdi-account-check',
        label: t('actions.enable'),
        color: 'success',
        callback: async (row: Record<string, unknown>) => {
          const { status } = await api.put(`/api/users/${row.id}/`, {
            can_login: true,
          })
          if (status === 201) {
            toast.fire({
              title: t('dialogs.users.update.success.title'),
              icon: 'success',
            })
            if (modelIndex.value) {
              modelIndex.value.manualLoadItems()
            }
          } else {
            toast.fire({
              title: t('dialogs.users.update.failure.title'),
              icon: 'error',
            })
          }
        },
        condition: (row: Record<string, unknown>) =>
          Boolean(!row.can_login && row.id !== identity.user.value!.id),
      },
      {
        icon: 'mdi-account-remove',
        label: t('actions.delete'),
        color: 'error',
        callback: async (row: Record<string, unknown>) => {
          const { status } = await api.delete(`/api/users/${row.id}/`)
          if (status === 204) {
            toast.fire({
              title: t('dialogs.users.delete.success.title'),
              icon: 'success',
            })
            if (modelIndex.value) {
              modelIndex.value.manualLoadItems()
            }
          } else {
            toast.fire({
              title: t('dialogs.users.delete.failure.title'),
              icon: 'error',
            })
          }
        },
        condition: (row: Record<string, unknown>) => Boolean(row.id !== identity.user.value!.id),
      },
    ])
    const showAddDialog = ref(false)
    const persistShowAddDialog = ref(false)
    const onAddDialogPersist = (persist: boolean) => {
      persistShowAddDialog.value = persist
    }
    const modelAddBindings = computed(() => ({
      fields: [
        {
          key: 'username',
          label: t('fields.username'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VTextField',
          bindings: {} as any,
        },
        {
          key: 'password',
          label: t('fields.password'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VPasswordField',
          bindings: {} as any,
        },
        {
          key: 'can_login',
          label: t('fields.can_login'),
          validator: validatorFactory(Joi.boolean().required()),
          default: true,
          component: 'VSwitch',
          bindings: {} as any,
        },
      ] as ModelAddField[],
      addEndPoint: '/api/users/',
    }))
    const onModelAddSubmitted = () => {
      showAddDialog.value = false
      if (modelIndex.value) {
        modelIndex.value.manualLoadItems()
      }
    }
    const showUpdateDialog = computed({
      get: () => modelIdToUpdate.value !== undefined,
      set: (value: boolean) => {
        if (!value) {
          modelIdToUpdate.value = undefined
        }
      },
    })
    const persistShowUpdateDialog = ref(false)
    const onUpdateDialogPersist = (persist: boolean) => {
      persistShowUpdateDialog.value = persist
    }
    const modelUpdateBindings = computed(() => ({
      fields: [
        {
          key: 'password',
          label: t('fields.password'),
          validator: validatorFactory(Joi.string().required()),
          default: '',
          component: 'VPasswordField',
          bindings: {} as any,
        },
      ] as ModelUpdateField[],
      id: modelIdToUpdate.value!,
      updateEndPoint: '/api/users/',
    }))
    const onModelUpdateSubmitted = () => {
      modelIdToUpdate.value = undefined
      if (modelIndex.value) {
        modelIndex.value.manualLoadItems()
      }
    }

    return {
      modelIndex,
      modelIndexColumns,
      modelIndexActions,
      showAddDialog,
      persistShowAddDialog,
      onAddDialogPersist,
      modelAddBindings,
      onModelAddSubmitted,
      showUpdateDialog,
      persistShowUpdateDialog,
      onUpdateDialogPersist,
      modelUpdateBindings,
      onModelUpdateSubmitted,
    }
  },
})
</script>
