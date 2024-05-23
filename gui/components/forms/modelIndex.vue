<template>
    <div class="model-index">
        <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="items"
            :items-length="totalItems"
            :loading="loading"
            :search="search"
            :class="classes"
            @update:options="loadItems"
        >
        </v-data-table-server>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
export default defineComponent({
  name: 'ModelIndex',
  setup() {
    const itemsPerPage = ref(10)
    const headers = computed(() => ([]))
    const items = computed(() => ([]))
    const totalItems = ref(0)
    const loading = ref(false)
    const search = ref<string | undefined>(undefined)
    const classes = computed(() => (['bg-transparent']))
    const loadItems = async () => {
        loading.value = true
        // const { data } = await api.get('/api/model')
        // items.value = data.items
        // totalItems.value = data.totalItems
        loading.value = false
    }
    return {
        itemsPerPage,
        headers,
        items,
        totalItems,
        loading,
        search,
        loadItems,
        classes,
    }
  }
})
</script>