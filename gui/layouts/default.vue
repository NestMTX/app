<template>
  <v-app v-if="complete">
    <v-locale-provider :locale="locale" :rtl="rtl">
      <v-app-bar
        v-if="complete && authenticated && !showSystemInfo"
        app
        color="transparent"
        class="glass-surface"
      >
        <v-toolbar-items v-if="smAndDown">
          <v-btn icon @click="() => (showNav = !showNav)">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </v-toolbar-items>
        <img src="~/assets/icon.png" alt="NestMTX" class="ms-4" height="32" width="32" />
        <v-toolbar-title class="font-raleway font-weight-bold">NestMTX</v-toolbar-title>
        <I18nPicker />
        <ThemeToggle />
        <v-toolbar-items v-if="authenticated">
          <v-btn icon @click="() => identity.logout()">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-app-bar>
      <v-navigation-drawer
        v-if="complete && authenticated && !showSystemInfo"
        v-model="showNav"
        app
        color="transparent"
        class="glass-surface"
      >
        <v-container>
          <template v-for="(nav, i) in navs" :key="`nav-${i}`">
            <v-list-item v-bind="nav" />
          </template>
        </v-container>
      </v-navigation-drawer>
      <v-main>
        <v-container v-if="!authenticated && !showSystemInfo" class="fill-height">
          <v-row justify="center">
            <v-col cols="12" sm="6" md="5" lg="4" xl="3">
              <LoginForm />
            </v-col>
          </v-row>
        </v-container>
        <v-container v-else-if="!showSystemInfo" fluid>
          <v-row justify="center">
            <v-col cols="12">
              <h1 :title="rawRouteName">{{ header }}</h1>
              <p class="text-subtitle mb-3">{{ subtitle }}</p>
            </v-col>
          </v-row>
          <v-divider />
          <slot />
        </v-container>
      </v-main>
      <v-footer app color="transparent" class="glass-surface text-center d-flex flex-column">
        <v-tabs :model-value="null" hide-slider>
          <v-tab hide-slider @click="doShowDebugInfo">
            {{ showVersion }}
          </v-tab>
          <v-tab hide-slider href="https://nestmtx.com" target="_blank">Docs</v-tab>
          <v-tab hide-slider href="https://discord.gg/hMAEuNa4Fd" target="_blank">Community</v-tab>
        </v-tabs>
      </v-footer>
      <SystemInfoDialog v-if="showSystemInfo" class="glass-surface" @close="showSystemInfo = false">
        <template #toolbar>
          <I18nPicker />
          <ThemeToggle />
        </template>
      </SystemInfoDialog>
      <v-dialog v-model="showDebugInfo" opacity="0" max-width="800">
        <v-card color="transparent" class="glass-surface">
          <v-toolbar color="transparent">
            <v-toolbar-title class="font-raleway font-weight-bold">{{
              $t('dialogs.debugInfo.title')
            }}</v-toolbar-title>
            <v-spacer />
            <slot name="toolbar" />
            <v-toolbar-items>
              <v-btn icon @click="doShowDebugInfo">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
              <v-btn icon @click="showDebugInfo = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <v-divider />
          <v-table style="background: transparent">
            <tbody>
              <tr>
                <th>Release</th>
                <td>
                  <code>{{ debugInfo.release }}</code>
                </td>
              </tr>
              <tr>
                <th>Commit</th>
                <td>
                  <code>{{ debugInfo.commit }}</code>
                </td>
              </tr>
              <tr>
                <th>CPU Arch</th>
                <td>
                  <code>{{ debugInfo.platform }}</code>
                </td>
              </tr>
              <tr>
                <th>Database</th>
                <td>
                  <code>{{ debugInfo.database }}</code>
                </td>
              </tr>
              <tr>
                <th>MediaMTX</th>
                <td>
                  <code>{{ debugInfo.mediamtx }}</code>
                </td>
              </tr>
              <tr>
                <th>GStreamer</th>
                <td>
                  <code>{{ debugInfo.gstreamer }}</code>
                </td>
              </tr>
              <tr>
                <th>FFMpeg</th>
                <td>
                  <code>{{ debugInfo.ffmpeg }}</code>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-dialog>
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
import { defineComponent, ref, watch, computed, inject } from 'vue'
import { useVueprint } from '@jakguru/vueprint/utilities'
import LoginForm from '@/components/forms/login.vue'
import SystemInfoDialog from '@/components/dialogs/systemInfo.vue'
import { useI18n } from 'vue-i18n'
import languages from '@/constants/languages'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import type { IdentityService, ApiService } from '@jakguru/vueprint'
export default defineComponent({
  name: 'DefaultLayout',
  components: { LoginForm, SystemInfoDialog },
  setup() {
    const version = computed(() => import.meta.env.VERSION || 'source')
    const showVersion = computed(() => version.value.substring(0, 7))
    const showDebugInfo = ref(false)
    const debugInfo = ref<Record<string, string>>({})
    const api = inject<ApiService>('api')!
    const doShowDebugInfo = async (e: MouseEvent) => {
      e.preventDefault()
      showDebugInfo.value = true
      const { status, data } = await api.get('/api/version')
      if (status === 200) {
        debugInfo.value = data
      }
    }
    const { smAndDown } = useDisplay()
    const showNav = ref(false)
    watch(
      () => smAndDown.value,
      (is) => {
        if (is) {
          showNav.value = false
        }
      }
    )
    const localeRoute = useLocaleRoute()
    const { locale, t } = useI18n()
    const { mounted, booted, ready } = useVueprint({}, true)
    const complete = computed(() => mounted.value && booted.value && ready.value)
    const identity = inject<IdentityService>('identity')!
    const authenticated = computed(() => identity.authenticated.value)
    const rtl = computed(() => {
      const lang = languages[locale.value]
      return lang ? lang.rtl : false
    })
    const showSystemInfo = ref(false)
    const route = useRoute()
    const rawRouteName = computed(() =>
      route.name ? route.name.toString().replace(`___${locale.value}`, '') : 'undefined'
    )
    const navs = computed(() =>
      [
        { icon: 'mdi-view-dashboard', value: 'index' },
        { icon: 'mdi-key-chain', value: 'credentials' },
        { icon: 'mdi-cctv', value: 'cameras' },
        { icon: 'mdi-clock', value: 'cronjobs' },
        { icon: 'mdi-account', value: 'users' },
      ].map((n) => ({
        'active': rawRouteName.value === n.value,
        'prepend-icon': n.icon,
        'nav': true,
        'title': t(`pages.${n.value}.nav`),
        'to': { name: localeRoute({ name: n.value })?.name || 'index___en' },
      }))
    )
    const header = computed(() => t(`pages.${rawRouteName.value}.header`))
    const subtitle = computed(() => t(`pages.${rawRouteName.value}.subtitle`))
    useSeoMeta({
      title: () => t(`pages.${rawRouteName.value}.title`),
      description: () => t(`pages.${rawRouteName.value}.description`),
    })
    return {
      complete,
      identity,
      authenticated,
      locale,
      rtl,
      showSystemInfo,
      route,
      rawRouteName,
      navs,
      header,
      subtitle,
      smAndDown,
      showNav,
      version,
      showVersion,
      showDebugInfo,
      doShowDebugInfo,
      debugInfo,
    }
  },
})
</script>
