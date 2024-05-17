<template>
  <v-menu v-if="choices.length > 1">
    <template #activator="{ props }">
      <v-badge color="accent" :content="display" class="me-3">
        <v-btn v-bind="props" icon variant="outlined" size="28" color="accent">
          <v-icon size="16">mdi-translate</v-icon>
        </v-btn>
      </v-badge>
    </template>
    <v-list max-height="180" dense class="surface py-0" min-width="200">
      <template v-for="(c, i) in choices" :key="c.iso">
        <v-locale-provider :rtl="c!.rtl">
          <v-list-item :title="c!.local" :active="c!.current" @click="setLocale(c!.iso)">
            <template #append>
              <v-chip label>{{ c!.iso.toUpperCase() }}</v-chip>
            </template>
          </v-list-item>
          <v-divider v-if="i < choices.length - 1" />
        </v-locale-provider>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
// import { useLocale } from 'vuetify'
// import { setLocale } from '@/utilities/i18n'
import * as locales from '@/locales'
import languages from '@/constants/languages'
export default defineComponent({
  setup() {
    const { locale, setLocale } = useI18n()
    // const { isRtl } = useLocale()
    // const setTheLocale = useSwitchLocalePath()
    const available = Object.keys(locales)
    const choices = computed(() =>
      available
        .map((v) => {
          const lang = languages[v]
          if (!lang) {
            console.log(v, lang)
            return undefined
          }
          return {
            ...lang,
            current: v === locale.value,
          }
        })
        .filter((v) => 'object' === typeof v)
    )
    const display = computed(() =>
      'string' === typeof locale.value ? locale.value.toUpperCase() : ''
    )
    return {
      choices,
      display,
      setLocale,
    }
  },
})
</script>
