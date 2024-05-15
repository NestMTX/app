<template>
    <v-app v-if="complete">
      <v-locale-provider :locale="locale" :rtl="rtl" :messages="messages">
        <v-main>
          <v-container v-if="!authenticated" class="fill-height">
            <v-row justify="center">
              <v-col cols="12" sm="6" md="5" lg="4" xl="3">
                <LoginForm />
              </v-col>
            </v-row>
          </v-container>
          <v-container v-else fluid>
            <slot/>
          </v-container>
        </v-main>
      </v-locale-provider>
    </v-app>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import { useVueprint } from '@jakguru/vueprint/utilities'
  import LoginForm from '@/components/forms/login.vue'
  import { useI18n } from 'vue-i18n'
  import languages from '@/constants/languages'
  import * as locales from '@/locales'
  import type { IdentityService } from '@jakguru/vueprint'
  export default defineComponent({
    name: 'DefaultLayout',
    components: { LoginForm },
    setup() {
      const { locale } = useI18n()
      const { mounted, booted, ready } = useVueprint({
        onReady: {
          onTrue: () => {
            console.log(identity)
          },
        },
      }, true)
      const complete = computed(() => mounted.value && booted.value && ready.value)
      const identity = inject<IdentityService>('identity')!
      const authenticated = computed(() => identity.authenticated.value)
      const rtl = computed(() => {
        const lang = languages[locale.value]
        return lang ? lang.rtl : false
      })
      // @ts-expect-error - this is a hack to get around the fact that the type of locales is not known
      const messages = computed(() => locales[locale.value] as any || {})
      return { complete, identity, authenticated, locale, rtl, messages }
    },
  })
  </script>
  