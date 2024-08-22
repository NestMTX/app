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
  renderAsMtxPathForm,
} from '../../utilities/renderers'
import { formatInteger, formatFileSize } from '../../utilities/formatters'
import gcpcSvg from '../../assets/brand-icons/cloud-platform-console.google.svg'
import type { ToastService, ApiService, CronService, BusService } from '@jakguru/vueprint'
import type { ModelIndexField } from '../../types/forms.js'
import '../../types/augmentations'
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
    const bus = inject<BusService>('bus')!
    const modelIndexColumns = computed<Array<ModelIndexField>>(() => [
      {
        key: 'status',
        label: t('fields.status'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCameraStatusChip,
        align: 'center',
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
        key: 'mtx_path',
        label: t('fields.mtx_path'),
        formatter: (value: unknown) => value as string,
        sortable: true,
        renderer: renderAsMtxPathForm,
      },
      {
        key: 'identified_as',
        label: t('fields.identified_as'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsDeviceChip,
      },
      {
        key: 'protocols',
        label: t('fields.protocols'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
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
        align: 'end',
      },
      {
        key: 'codecs_audio',
        label: t('fields.codecs_audio'),
        formatter: (value: unknown) => value as string,
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'process_id',
        label: t('fields.process_id'),
        formatter: (value: unknown) => (null === value ? '' : (value as string)),
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'stream_ready',
        label: t('fields.stream_ready'),
        formatter: (value: unknown) => (true === value ? 'Yes' : 'No'),
        sortable: false,
        align: 'end',
      },
      {
        key: 'stream_uptime',
        label: t('fields.stream_uptime'),
        formatter: (value: unknown) => (null === value ? '' : (value as string)),
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'stream_track_count',
        label: t('fields.stream_track_count'),
        formatter: formatInteger,
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'stream_consumer_count',
        label: t('fields.stream_consumer_count'),
        formatter: formatInteger,
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'stream_data_rx',
        label: t('fields.stream_data_rx'),
        formatter: formatFileSize,
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
      },
      {
        key: 'stream_data_tx',
        label: t('fields.stream_data_tx'),
        formatter: formatFileSize,
        sortable: false,
        renderer: renderAsCode,
        align: 'end',
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
      bus.on('cameras:updated', refreshEveryMinute, { crossTab: true, local: true })
    })
    onBeforeUnmount(() => {
      cron.$off('* * * * *', refreshEveryMinute)
      bus.off('cameras:updated', refreshEveryMinute, { crossTab: true, local: true })
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
