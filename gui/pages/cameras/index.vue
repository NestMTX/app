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
                    model-i18n-key="models.cameras"
                    search-end-point="/api/cameras/"
                    :columns="modelIndexColumns"
                    :actions="modelIndexActions"
                  />
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
import { defineComponent, ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import ModelIndex from '../../components/forms/modelIndex.vue'
import type { ToastService, ApiService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'CamerasIndex',
  components: {
    ModelIndex,
  },
  setup() {
    const modelIndex = ref<ModelIndex | undefined>(undefined)
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const api = inject<ApiService>('api')!
    const modelIndexColumns = computed(() => [
      {
        key: 'name',
        label: t('fields.name'),
        formatter: (value: unknown) => value as string,
        sortable: true,
      },
      {
        key: 'room',
        label: t('fields.room'),
        formatter: (value: unknown) => value as string,
        sortable: true,
      },
      {
        key: 'resolution',
        label: t('fields.resolution'),
        formatter: (value: unknown) => value as string,
        sortable: false,
      },
    ])
    const modelIndexActions = computed(() => [
      // {
      //   icon: 'mdi-play-circle',
      //   label: t('actions.run'),
      //   callback: async (row: Record<string, unknown>) => {
      //     const { status } = await api.put(`/api/cameras/${row.name}/`)
      //     if (status === 201) {
      //       toast.fire({
      //         title: t('dialogs.cameras.run.success.title'),
      //         icon: 'success',
      //       })
      //     } else {
      //       toast.fire({
      //         title: t('dialogs.cameras.run.failure.title'),
      //         icon: 'error',
      //       })
      //     }
      //   },
      // },
    ])
    return {
      modelIndex,
      modelIndexColumns,
      modelIndexActions,
    }
  },
})
</script>
