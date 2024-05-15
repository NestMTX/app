<template>
    <v-container class="fill-height">
        <v-row justify="center">
            <v-col cols="12">
                <v-card color="transparent" class="glass-surface" min-height="100">
                    <v-card-text ref="swagger" />
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
// import SwaggerUI from 'swagger-ui/dist/swagger-ui'
export default defineComponent({
    name: 'DocsApiIndex',
    setup() {
        // @ts-expect-error - it does exist and is defined
        definePageMeta({
            layout: 'docs',
        })
        const swagger = ref<HTMLElement | null>(null)
        // const instance = ref<any | null>(null)
        onMounted(() => {
            // instance.value = SwaggerUI({
            //     domNode: swagger.value,
            //     url: '/api/swagger/',
            // })
        })
        return {
            swagger,
        }
    },
})
</script>