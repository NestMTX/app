<template>
    <v-row justify="center">
      <v-col cols="12">
        <v-row>
          <v-col cols="12">
            <v-card color="transparent" class="glass-surface mt-3 log-output-wrapper" min-height="100" ref="logContainer">
                <v-locale-provider :rtl="false">
                  <v-table density="compact" class="nestmtx-system-info-log-table bg-transparent">
                    <tbody>
                      <tr v-for="log in toShow" :key="log.checksum">
                        <td>
                          <v-chip size="small" :color="log.meta.color" variant="flat">
                            <span class="font-weight-bold">{{ $t(log.meta.key) }}</span>
                          </v-chip>
                        </td>
                        <td>
                          <v-chip size="small" color="surface" variant="flat" label>
                            {{ log.service }}
                          </v-chip>
                        </td>
                        <td class="wrappable">{{ log.msg }}</td>
                        <td style="text-align: end">
                          {{ log.datetime.toFormat('yyyy-MM-dd HH:mm:ss') }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-locale-provider>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { logLevels, services, logs } from '@/stores/systemInfo'
  import { DateTime } from 'luxon'
  import { useI18n } from 'vue-i18n'
  import type { WatchStopHandle } from 'vue'
  import type { VCard } from 'vuetify/components/VCard'
  export default defineComponent({
    name: 'LogsIndex',
    components: {},
    setup() {
        const { locale } = useI18n({ useScope: 'global' })
        const levelsToShow = ref<string[]>([...logLevels.value].map((l) => l.key))
        const servicesToShow = ref<string[]>([...services.value])
        const toShow = computed(() => [...logs.value])
        let toShowWatcher: WatchStopHandle | undefined
        const logContainer = ref<VCard | null>(null)
        const scrollLogContainerToBottom = () => {
          if (logContainer.value) {
            logContainer.value.$el.scrollTop = logContainer.value.$el.scrollHeight + 50
          } else {
            // do nothing
            console.log('logContainer is not ready')
          }
      }
      watch(
        () => logContainer.value,
        () => {
          nextTick(() => {
            scrollLogContainerToBottom()
          })
        }
      )
      onMounted(() => {
        nextTick(() => {
          scrollLogContainerToBottom()
        })
        toShowWatcher = watch(toShow, () => {
          scrollLogContainerToBottom()
        })
      })
      onBeforeUnmount(() => {
        if (toShowWatcher) toShowWatcher()
      })
      return {
        DateTime,
        logLevels,
        services,
        close,
        toShow,
        locale,
        logContainer,
        levelsToShow,
        servicesToShow,
      }
    },
  })
  </script>
  
<style lang="scss">
    .log-output-wrapper {
        height: calc(100vh - var(--v-layout-top, 0) - var(--v-layout-bottom, 0) - 32px - 85px - 24px);
        overflow-x: hidden;
        overflow-y: auto;

    }
</style>