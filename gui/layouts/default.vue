<template>
  <v-app v-if="complete">
    <v-locale-provider :locale="locale" :rtl="rtl">
      <v-app-bar v-if="complete && authenticated" app color="transparent" class="glass-surface">
        <img src="~/assets/icon.png" alt="NestMTX" class="ms-4" height="32" width="32" />
        <v-toolbar-title class="font-raleway font-weight-bold">NestMTX</v-toolbar-title>
        <v-spacer />
        <I18nPicker />
        <ThemeToggle />
        <v-toolbar-items v-if="authenticated">
          <v-btn icon @click="() => identity.logout()">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-app-bar>
      <v-main>
        <v-container v-if="!authenticated && !showSystemInfo" class="fill-height">
          <v-row justify="center">
            <v-col cols="12" sm="6" md="5" lg="4" xl="3">
              <LoginForm />
            </v-col>
          </v-row>
        </v-container>
        <v-container v-else-if="!showSystemInfo" fluid>
          <slot />
        </v-container>
      </v-main>
      <SystemInfoDialog v-if="showSystemInfo" class="glass-surface" @close="showSystemInfo = false">
        <template #toolbar>
          <I18nPicker />
          <ThemeToggle />
        </template>
      </SystemInfoDialog>
    </v-locale-provider>
    <v-fab
      v-if="!showSystemInfo"
      app
      icon="mdi-server"
      fixed
      color="secondary"
      @click="showSystemInfo = true"
    ></v-fab>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import LoginForm from '@/components/forms/login.vue'
import SystemInfoDialog from '@/components/dialogs/systemInfo.vue'
import { useI18n } from 'vue-i18n'
import languages from '@/constants/languages'
import type { IdentityService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'DefaultLayout',
  components: { LoginForm, SystemInfoDialog },
  setup() {
    const { locale } = useI18n()
    const { mounted, booted, ready } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const identity = inject<IdentityService>('identity')!
    const authenticated = computed(() => identity.authenticated.value)
    const rtl = computed(() => {
      const lang = languages[locale.value]
      return lang ? lang.rtl : false
    })
    const showSystemInfo = ref(false)
    return { complete, identity, authenticated, locale, rtl, showSystemInfo }
  },
})
</script>
