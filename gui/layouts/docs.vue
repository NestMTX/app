<template>
  <v-app v-if="complete">
    <v-locale-provider :locale="locale" :rtl="rtl">
      <v-app-bar v-if="complete" app color="transparent" class="glass-surface">
        <img src="~/assets/icon.png" alt="NestMTX" class="ms-4" height="32" width="32" />
        <v-toolbar-title class="font-raleway font-weight-bold">NestMTX</v-toolbar-title>
        <v-spacer />
        <I18nPicker />
        <ThemeToggle />
      </v-app-bar>
      <v-navigation-drawer app color="transparent" class="glass-surface">
        lala
      </v-navigation-drawer>
      <v-main>
        <v-container fluid>
          <slot />
        </v-container>
      </v-main>
    </v-locale-provider>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed, inject } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import { useI18n } from 'vue-i18n'
import languages from '@/constants/languages'
import type { IdentityService, ApiService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'DocsLayout',
  setup() {
    const { locale } = useI18n()
    const { mounted, booted, ready } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const identity = inject<IdentityService>('identity')!
    const api = inject<ApiService>('api')!
    const authenticated = computed(() => identity.authenticated.value)
    const rtl = computed(() => {
      const lang = languages[locale.value]
      return lang ? lang.rtl : false
    })
    return { complete, identity, authenticated, locale, rtl }
  },
})
</script>
