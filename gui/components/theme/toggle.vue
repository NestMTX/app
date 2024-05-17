<template>
  <div class="d-flex justify-center align-center px-3">
    <v-switch v-model="themeIsDark" hide-details loading>
      <template #loader>
        <v-avatar color="secondary" size="20">
          <v-icon size="14" :color="themeIsDark ? 'on-secondary' : 'on-primary'">{{
            themeIcon
          }}</v-icon>
        </v-avatar>
      </template>
    </v-switch>
  </div>
</template>

<script lang="ts">
import { computed, inject } from 'vue'
import { useTheme } from 'vuetify'
import type { LocalStorageService, BusService } from '@jakguru/vueprint'
export default {
  name: 'ThemeToggle',
  setup() {
    const ls = inject<LocalStorageService>('ls')
    const theme = useTheme()
    const bus = inject<BusService>('bus')
    const themeIcon = computed(() =>
      theme.global.name.value === 'nestmtx-day' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'
    )
    const themeIsDark = computed({
      get: () => theme.global.name.value === 'nestmtx-night',
      set: (val) => {
        theme.global.name.value = val ? 'nestmtx-night' : 'nestmtx-day'
        if (ls) {
          ls.set('theme', theme.global.name.value)
        }
        if (bus) {
          bus.emit('theme:changed', { crossTab: true }, theme.global.name.value)
        }
      },
    })
    return {
      themeIcon,
      themeIsDark,
    }
  },
}
</script>
