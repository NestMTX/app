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
                  >
                    <template #action-buttons>
                      <v-badge icon="mdi-sync" color="primary" :model-value="!cloudSyncRunning">
                        <v-btn
                          :icon="true"
                          variant="elevated"
                          size="38"
                          title="Syncronize from the Cloud"
                          :loading="cloudSyncRunning"
                          @click="doCloudSync"
                        >
                          <img
                            :src="gcpcSvg"
                            alt="Syncronize from the Cloud"
                            width="16px"
                            height="16px"
                          />
                        </v-btn>
                      </v-badge>
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
import { defineComponent, ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import ModelIndex from '../../components/forms/modelIndex.vue'
import {
  renderAsCode,
  renderAsDeviceChip,
  renderAsCameraStatusChip,
} from '../../utilities/renderers'
import gcpcSvg from '../../assets/brand-icons/cloud-platform-console.google.svg'
import type { ToastService, ApiService, CronService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'CamerasIndex',
  components: {
    ModelIndex,
  },
  setup() {
    const modelIndex = ref<typeof ModelIndex | undefined>(undefined)
    const { t } = useI18n({ useScope: 'global' })
    const toast = inject<ToastService>('toast')!
    const api = inject<ApiService>('api')!
    const cron = inject<CronService>('cron')!
    const modelIndexColumns = computed(() => [
      {
        key: 'status',
        label: t('fields.status'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCameraStatusChip,
      },
      {
        key: 'process_id',
        label: t('fields.process_id'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
      },
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
        key: 'protocols',
        label: t('fields.protocols'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
      },
      {
        key: 'identified_as',
        label: t('fields.identified_as'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsDeviceChip,
      },
      {
        key: 'resolution',
        label: t('fields.resolution'),
        formatter: (value: unknown) => value as string,
        sortable: false,
      },
      {
        key: 'codecs_video',
        label: t('fields.codecs_video'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
      },
      {
        key: 'codecs_audio',
        label: t('fields.codecs_audio'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
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
    const cloudSyncRunning = ref(false)
    const doCloudSync = async () => {
      cloudSyncRunning.value = true
      const { status } = await api.put(
        `/api/cronjobs/SyncCloudCamerasJob/`,
        {},
        {
          validateStatus: () => true,
        }
      )
      if (status === 201) {
        toast.fire({
          title: t('dialogs.cronjobs.run.success.title'),
          icon: 'success',
        })
      } else {
        toast.fire({
          title: t('dialogs.cronjobs.run.failure.title'),
          icon: 'error',
        })
      }
      cloudSyncRunning.value = false
    }
    const refreshEveryMinute = () => {
      if (modelIndex.value) {
        modelIndex.value.manualLoadItems()
      }
    }
    onMounted(() => {
      cron.$on('* * * * *', refreshEveryMinute)
    })
    onBeforeUnmount(() => {
      cron.$off('* * * * *', refreshEveryMinute)
    })
    return {
      modelIndex,
      modelIndexColumns,
      modelIndexActions,
      cloudSyncRunning,
      doCloudSync,
      gcpcSvg,
    }
  },
})
</script>
