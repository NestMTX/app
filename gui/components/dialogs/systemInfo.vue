<template>
  <v-dialog v-bind="dialogBind" class="glass-surface">
    <v-card color="transparent" class="glass-surface">
      <v-toolbar color="transparent">
        <v-toolbar-title class="font-raleway font-weight-bold">{{
          $t('dialogs.systemInfo.title')
        }}</v-toolbar-title>
        <v-spacer />
        <slot name="toolbar" />
        <v-toolbar-items>
          <v-btn icon @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-divider />
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="3" lg="4">
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.uptime') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.cpu') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.memory') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.network') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-card color="transparent" class="glass-surface">
                  <v-card-title>{{ $t('dialogs.systemInfo.cards.info') }}</v-card-title>
                  <v-divider />
                  <v-sheet min-height="100" color="primary" />
                </v-card>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="9" lg="8">
            <v-card color="transparent" class="glass-surface h-100">
                <v-card-title>{{ $t('dialogs.systemInfo.cards.logs') }}</v-card-title>
                <v-divider />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
export default defineComponent({
  name: 'SystemInfoDialog',
  emits: ['close'],
  setup(_props, { emit }) {
    const close = () => emit('close')
    const dialogBind = computed(() => ({
      modelValue: true,
      // fullscreen: true,
      opacity: 0,
      persistent: true,
    }))
    return {
      dialogBind,
      close,
    }
  },
})
</script>
