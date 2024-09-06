<template>
  <v-row justify="center">
    <v-col cols="12">
      <v-row>
        <v-col cols="12">
          <v-card color="transparent" class="glass-surface mt-3" min-height="100">
            <v-toolbar color="transparent" density="compact">
              <v-toolbar-title class="font-raleway font-weight-bold">{{
                $t('index.htop.cpu')
              }}</v-toolbar-title>
            </v-toolbar>
            <v-divider />
            <v-container fluid>
              <v-row>
                <v-col v-for="(c, i) in cpu" :key="`cpi-${i}`" cols="6" :sm="cpuCols">
                  <v-card color="transparent" class="glass-surface" style="position: relative">
                    <v-progress-linear v-bind="c">
                      <template #default="{ value }">
                        <small>{{ Math.ceil(value) }}%</small>
                      </template>
                    </v-progress-linear>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
            <v-divider />
            <v-toolbar color="transparent" density="compact">
              <v-toolbar-title class="font-raleway font-weight-bold">{{
                $t('index.htop.memory')
              }}</v-toolbar-title>
            </v-toolbar>
            <v-divider />
            <v-container fluid>
              <v-card color="transparent" class="glass-surface" style="position: relative">
                <v-progress-linear v-bind="memoryProgressBindings">
                  <template #default="{ value }">
                    <small
                      >{{ filesize(memory.used, { base: 2 }) }} of
                      {{ filesize(memory.total, { base: 2 }) }} ({{ Math.ceil(value) }}%)</small
                    >
                  </template>
                </v-progress-linear>
              </v-card>
            </v-container>
            <v-divider />
            <v-toolbar color="transparent" density="compact">
              <v-toolbar-title class="font-raleway font-weight-bold">{{
                $t('index.htop.processes.title')
              }}</v-toolbar-title>
            </v-toolbar>
            <v-divider />
            <v-table class="bg-transparent">
              <thead>
                <tr>
                  <th width="50px;">&nbsp;</th>
                  <th>{{ $t('index.htop.processes.pid') }}</th>
                  <th>{{ $t('index.htop.processes.name') }}</th>
                  <th>{{ $t('index.htop.processes.cpu') }}</th>
                  <th>{{ $t('index.htop.processes.memory') }}</th>
                  <th>{{ $t('index.htop.processes.uptime') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in processes" :key="`process-${i}`">
                  <td class="px-0">
                    <v-toolbar-items v-if="'nestmtx' !== p.name" class="h-100">
                      <v-btn
                        v-if="!p.pid"
                        icon
                        color="success-darken-2"
                        :title="$t('actions.start')"
                        :loading="actionsInProgress[p.name] === 'start'"
                        @click="doAction(p.name, 'start')"
                      >
                        <v-icon>mdi-play</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="!!p.pid"
                        icon
                        color="warning"
                        :title="$t('actions.restart')"
                        :loading="actionsInProgress[p.name] === 'restart'"
                        @click="doAction(p.name, 'restart')"
                      >
                        <v-icon>mdi-restart</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="!!p.pid"
                        icon
                        color="error"
                        :title="$t('actions.stop')"
                        :loading="actionsInProgress[p.name] === 'stop'"
                        @click="doAction(p.name, 'stop')"
                      >
                        <v-icon>mdi-stop</v-icon>
                      </v-btn>
                    </v-toolbar-items>
                  </td>
                  <td>
                    <code>{{ p.pid }}</code>
                  </td>
                  <td>
                    <code>{{ p.name }}</code>
                  </td>
                  <td>{{ 'number' === typeof p.cpu ? `${Math.ceil(p.cpu)}%` : '' }}</td>
                  <td>{{ 'number' === typeof p.memory ? filesize(p.memory, { base: 2 }) : '' }}</td>
                  <td>
                    {{
                      'number' === typeof p.uptime
                        ? Duration.fromObject({ milliseconds: p.uptime }).rescale().toHuman({
                            listStyle: 'long',
                            unitDisplay: 'short',
                          })
                        : ''
                    }}
                  </td>
                </tr>
                <tr v-if="processes.length === 0">
                  <td colspan="6" class="pa-0">
                    <v-alert color="info" type="info" dense rounded="0">{{
                      $t('index.htop.processes.empty')
                    }}</v-alert>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card color="transparent" class="glass-surface mt-3" min-height="100">
            <v-toolbar color="transparent" density="compact">
              <v-toolbar-title class="font-raleway font-weight-bold">{{
                $t('index.htop.paths.title')
              }}</v-toolbar-title>
            </v-toolbar>
            <v-divider />
            <v-table class="bg-transparent">
              <thead>
                <tr>
                  <th>{{ $t('index.htop.paths.path') }}</th>
                  <th style="width: 50px" class="text-center">
                    {{ $t('index.htop.paths.ready') }}
                  </th>
                  <th>{{ $t('index.htop.paths.uptime') }}</th>
                  <th>{{ $t('index.htop.paths.tracks') }}</th>
                  <th>{{ $t('index.htop.paths.dataRx') }}</th>
                  <th>{{ $t('index.htop.paths.dataTx') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in paths" :key="`path-${i}`">
                  <td>
                    <code>{{ p.path }}</code>
                  </td>
                  <td class="text-center">
                    <v-chip v-if="p.ready" variant="elevated" color="success">{{
                      $t('general.yes')
                    }}</v-chip>
                    <v-chip v-else variant="elevated" color="error">{{ $t('general.no') }}</v-chip>
                  </td>
                  <td>
                    {{ timestampToTimeSinceDuration(p.uptime) }}
                  </td>
                  <td>
                    {{ numberAsFormattedInteger(p.tracks) }}
                  </td>
                  <td>
                    {{ filesize(p.dataRx) }}
                  </td>
                  <td>
                    {{ filesize(p.dataTx) }}
                  </td>
                </tr>
                <tr v-if="paths.length === 0">
                  <td colspan="7" class="pa-0">
                    <v-alert color="info" type="info" dense rounded="0">{{
                      $t('index.htop.paths.empty')
                    }}</v-alert>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  onMounted,
  onBeforeUnmount,
  inject,
  computed,
  triggerRef,
} from 'vue'
import { filesize } from 'filesize'
import { DateTime, Duration } from 'luxon'
import numeral from 'numeral'
import type { CronService, ApiService } from '@jakguru/vueprint'

interface CpuUsage {
  cpu: number
  user: number
  nice: number
  sys: number
  idle: number
  irq: number
}

interface MemoryUsage {
  total: number
  used: number
}

interface ProcessDescription {
  name: string
  pid: number | null
  memory: number | null
  cpu: number | null
  uptime: number | null
}

interface MtxPath {
  path: string
  src: string
  ready: boolean
  uptime: string | null
  tracks: number
  dataRx: number
  dataTx: number
  consumers: number
}

interface HtopResponse {
  cpu: CpuUsage[]
  memory: MemoryUsage
  processes: ProcessDescription[]
  paths: MtxPath[]
}

const timestampToTimeSinceDuration = (timestamp: string | null) => {
  if (!timestamp) {
    return ''
  }
  const datetime = DateTime.fromISO(timestamp)
  return datetime.diffNow().negate().rescale().toHuman({
    listStyle: 'long',
    unitDisplay: 'short',
  })
}

const numberAsFormattedInteger = (value: number | null) => {
  if ('number' !== typeof value) {
    return ''
  }
  return numeral(value).format('0,0')
}

export default defineComponent({
  setup() {
    const api = inject<ApiService>('api')!
    const cron = inject<CronService>('cron')!
    const cpu = shallowRef<CpuUsage[]>([])
    const memory = shallowRef<MemoryUsage>({ total: 0, used: 0 })
    const processes = shallowRef<ProcessDescription[]>([])
    const paths = shallowRef<MtxPath[]>([])
    const updating = ref(false)
    let abortController: AbortController | undefined = undefined
    const update = async () => {
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()
      updating.value = true
      const { status, data } = await api.get<HtopResponse>('/api/htop', {
        validateStatus: () => true,
        signal: abortController.signal,
      })
      if (200 === status) {
        cpu.value = data.cpu
        memory.value = data.memory
        processes.value = data.processes
        paths.value = data.paths
        triggerRef(cpu)
        triggerRef(memory)
        triggerRef(processes)
        triggerRef(paths)
      }
      updating.value = false
    }
    onMounted(() => {
      cron.$on('*/5 * * * * *', update)
      update()
    })
    onBeforeUnmount(() => {
      cron.$off('*/5 * * * * *', update)
      if (abortController) {
        abortController.abort()
      }
    })
    const cpuCols = computed(() => {
      switch (true) {
        case cpu.value.length % 4 === 0:
          return 3

        case cpu.value.length % 3 === 0:
          return 4

        case cpu.value.length % 2 === 0 && cpu.value.length > 2:
          return 6

        default:
          return 12
      }
    })
    const cpuProgressLinearBindings = computed(() =>
      [...cpu.value].map((c) => ({
        modelValue: 100 - c.idle,
        bufferValue: 100 - c.idle + c.sys + c.user + c.nice + c.irq,
        color: 'green',
        bufferColor: 'red',
        bufferOpacity: 1,
        bgColor: 'transparent',
        height: 16,
      }))
    )
    const memoryProgressBindings = computed(() => ({
      modelValue: (memory.value.used / memory.value.total) * 100,
      bufferValue: 0,
      color: 'green',
      bufferColor: 'red',
      bufferOpacity: 1,
      bgColor: 'transparent',
      height: 16,
    }))
    const actionsInProgress = shallowRef<Record<string, 'start' | 'stop' | 'restart' | undefined>>(
      {}
    )
    const doAction = async (name: string, action: 'start' | 'stop' | 'restart') => {
      actionsInProgress.value[name] = action
      triggerRef(actionsInProgress)
      const { status } = await api.put(
        `/api/htop/${name}`,
        { action },
        {
          validateStatus: () => true,
        }
      )
      if (201 === status) {
        update()
      }
      actionsInProgress.value[name] = undefined
      triggerRef(actionsInProgress)
    }
    return {
      cpu: cpuProgressLinearBindings,
      memory,
      memoryProgressBindings,
      processes,
      paths,
      updating,
      cpuCols,
      filesize,
      Duration,
      actionsInProgress,
      doAction,
      timestampToTimeSinceDuration,
      numberAsFormattedInteger,
    }
  },
})
</script>
