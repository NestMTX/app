<template>
  <v-dialog v-bind="dialogBind">
    <v-card color="transparent">
      <v-toolbar color="transparent">
        <v-toolbar-title class="font-raleway font-weight-bold">{{
          $t('dialogs.systemInfo.title')
        }}</v-toolbar-title>
        <v-spacer />
        <slot name="toolbar" />
        <v-toolbar-items>
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-divider />
      <v-container fluid>
        <v-row>
          <!-- <v-col cols="12" md="3" lg="4">
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.uptime') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.cpu') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.memory') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.network') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.info') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.app') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
          </v-col> -->
          <!-- <v-col cols="12" md="9" lg="8"> -->
            <v-col cols="12">
            <v-card color="transparent" class="glass-surface d-flex flex-column" max-height="1014">
              <v-card-title class="flex-grow-0">{{
                $t('dialogs.systemInfo.cards.logs')
              }}</v-card-title>
              <v-divider class="flex-grow-0" />
              <v-sheet
                ref="logContainer"
                color="transparent"
                class="flex-grow-1"
                style="overflow-y: auto"
              >
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
                        {{
                          log.datetime.toFormat('yyyy-MM-dd HH:mm:ss')
                        }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                </v-locale-provider>
              </v-sheet>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { logLevels, services, logs } from '@/stores/systemInfo'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'
import type { WatchStopHandle } from 'vue'
import type { VSheet } from 'vuetify/components/VSheet'
export default defineComponent({
  name: 'SystemInfoDialog',
  emits: ['close'],
  setup(_props, { emit }) {
    const { locale } = useI18n({ useScope: 'global' })
    const close = () => emit('close')
    const dialogBind = computed(() => ({
      'modelValue': true,
      'fullscreen': true,
      'opacity': 0,
      'persistent': true,
      'no-click-animation': true,
    }))
    const levelsToShow = ref<string[]>([...logLevels.value].map((l) => l.key))
    const servicesToShow = ref<string[]>([...services.value])
    const toShow = computed(() => [...logs.value])
    let toShowWatcher: WatchStopHandle | undefined
    const logContainer = ref<VSheet | null>(null)
    const scrollLogContainerToBottom = () => {
      if (logContainer.value) {
        logContainer.value.$el.scrollTop = logContainer.value.$el.scrollHeight
      } else {
      }
    }
    watch(() => logContainer.value, () => {
      nextTick(() => {
        scrollLogContainerToBottom()
      })
    })
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
      dialogBind,
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
.nestmtx-system-info-log-table {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
  direction: ltr !important;

  td:not(.wrappable) {
    white-space: nowrap;
  }

  &.v-theme--nestmtx-night {
    td {
      color: #00ff00 !important;
    }
  }

  &.v-theme--nestmtx-day {
    td {
      color: #2e7d32 !important;
    }
  }
}
</style>
