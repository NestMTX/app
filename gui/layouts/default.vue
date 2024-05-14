<template>
    <v-app v-if="complete">
      <v-main>
        <v-container v-if="!authenticated" class="fill-height">
          <v-row justify="center">
            <v-col cols="12" sm="6" md="5" lg="4">
              <v-card color="transparent" class="glass-surface" min-height="100">
                <v-toolbar color="transparent">
                    <img src="~/assets/icon.png" alt="NestMTX" class="ms-4" height="32" width="32" />
                    <v-toolbar-title class="font-raleway font-weight-bold">NestMTX</v-toolbar-title>
                    <v-spacer />
                    <ThemeToggle />
                </v-toolbar>
                <v-divider />
              </v-card>
            </v-col>
          </v-row>
        </v-container>
        <v-container fluid v-else>
          <slot></slot>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import { useVueprint } from '@jakguru/vueprint/utilities'
  import ThemeToggle from '@/components/theme/toggle.vue'
  import type { IdentityService } from '@jakguru/vueprint'
  export default defineComponent({
    name: 'DefaultLayout',
    components: { ThemeToggle },
    setup() {
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
      return { complete, identity, authenticated }
    },
  })
  </script>
  