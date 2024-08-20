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
                <v-col v-for="(c, i) in cpu" :key="`cpi-${i}`" cols="12" :sm="cpuCols">
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
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in processes" :key="`process-${i}`">
                  <td class="px-0">
                    <v-toolbar-items class="h-100">
                      <v-btn icon color="success-darken-2">
                        <v-icon>mdi-play</v-icon>
                      </v-btn>
                      <v-btn icon color="warning">
                        <v-icon>mdi-stop</v-icon>
                      </v-btn>
                      <v-btn icon color="warning">
                        <v-icon>mdi-restart</v-icon>
                      </v-btn>
                      <v-btn icon color="error">
                        <v-icon>mdi-cancel</v-icon>
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
  pid: number
  pm_id: number
  memory: number
  cpu: number
}

interface HtopResponse {
  cpu: CpuUsage[]
  memory: MemoryUsage
  processes: ProcessDescription[]
}

export default defineComponent({
  setup() {
    const api = inject<ApiService>('api')!
    const cron = inject<CronService>('cron')!
    const cpu = shallowRef<CpuUsage[]>([])
    const memory = ref<MemoryUsage>({ total: 0, used: 0 })
    const processes = ref<ProcessDescription[]>([])
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
        triggerRef(cpu)
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
    return {
      cpu: cpuProgressLinearBindings,
      memory,
      memoryProgressBindings,
      processes,
      updating,
      cpuCols,
      filesize,
    }
  },
})
</script>
