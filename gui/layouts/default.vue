<template>
    <v-app v-if="complete">
      <v-main>
        <v-container v-if="!authenticated" class="fill-height">
          <v-row justify="center">
            <v-col cols="12" sm="6" md="5" lg="4" xl="3">
              <LoginForm />
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
  import LoginForm from '@/components/forms/login.vue'

  import type { IdentityService } from '@jakguru/vueprint'
  export default defineComponent({
    name: 'DefaultLayout',
    components: { LoginForm },
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
  