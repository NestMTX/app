<template>
    <v-app>
      <v-main>
        <v-container fluid>
          <slot></slot>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  export default defineComponent({
    name: 'DefaultLayout',
  })
  </script>
  