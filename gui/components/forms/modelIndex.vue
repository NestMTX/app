<template>
  <div class="model-index">
    <v-data-table-server
      ref="table"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      :class="classes"
      :hover="totalItems > 0"
      :items-per-page-text="
        $t('components.modelIndex.itemsPerPage', { model: modelI18nPluralCapitalized })
      "
      :items-per-page-options="[
        { value: 10, title: '10' },
        { value: 25, title: '25' },
        { value: 50, title: '50' },
        { value: 100, title: '100' },
      ]"
      :loading-text="$t('components.modelIndex.loading', { model: modelI18nPlural })"
      :mobile="false"
      :multi-sort="true"
      :no-data-text="
        search
          ? $t('components.modelIndex.noResults', { model: modelI18nPlural })
          : $t('components.modelIndex.noData', { model: modelI18nPlural })
      "
      :show-current-page="true"
      @update:options="loadItems"
    >
      <template #top>
        <form class="pb-3" action="#" method="POST" @submit="onSearchSubmit">
          <input type="submit" style="display: none" />
          <v-row>
            <v-col cols="12" md="6" lg="4" xxl="3">
              <v-text-field
                v-model="searchField"
                :placeholder="$t('components.modelIndex.placeholder', { model: modelI18nPlural })"
                density="compact"
                clearable
                variant="solo"
                bg-color="transparent"
                class="glass-surface"
                :disabled="loading"
              >
                <template #append-inner>
                  <v-btn
                    type="submit"
                    icon
                    color="secondary"
                    size="30"
                    :disabled="loading"
                    @click="onSearchSubmit"
                  >
                    <v-icon size="16">mdi-magnify</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
            <v-spacer />
            <v-col cols="12" md="6" lg="4" xxl="3" class="d-flex justify-end">
              <slot name="action-buttons"></slot>
            </v-col>
          </v-row>
        </form>
        <v-divider />
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { capitalCase } from 'change-case'
import qs from 'qs'
import type { ApiService, SwalService } from '@jakguru/vueprint'
import type { VDataTableServer } from 'vuetify/components/VDataTable/'

export default defineComponent({
  name: 'ModelIndex',
  props: {
    modelI18nKey: {
      type: String,
      required: true,
    },
    searchEndPoint: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const table = ref<VDataTableServer | undefined>(undefined)
    const modelI18nKey = computed(() => props.modelI18nKey)
    const searchEndPoint = computed(() => props.searchEndPoint)
    const { t } = useI18n({ useScope: 'global' })
    const api = inject<ApiService>('api')!
    const swal = inject<SwalService>('swal')!
    const mounted = ref(false)
    const returned = ref<Array<any>>([])
    const itemsPerPage = ref(10)
    const headers = computed(() => [])
    const items = computed(() => [])
    const totalItems = ref(0)
    const loading = ref(false)
    const search = ref<string | undefined>(undefined)
    const searchField = ref<string | undefined>(undefined)
    const classes = computed(() => ['bg-transparent'])
    let loadItemsAbortController: AbortController | undefined
    const loadItems = async (options: any) => {
      if (!mounted.value) {
        return
      }
      if (loadItemsAbortController) {
        loadItemsAbortController.abort()
      }
      loadItemsAbortController = new AbortController()
      loading.value = true
      const payload = {
        search: options.search,
        page: options.page,
        itemsPerPage: options.itemsPerPage,
        sortBy: [...options.sortBy],
      }
      const url = `${searchEndPoint.value}?${qs.stringify(payload)}`
      const { status, data } = await api.get(url.toString(), {
        signal: loadItemsAbortController.signal,
      })
      if (status < 200 || status >= 300) {
        if (!loadItemsAbortController.signal.aborted) {
          const { message } = data.error
          swal.fire({
            title: t('components.modelIndex.errors.loadItems', { model: modelI18nPlural.value }),
            text: t(message),
            icon: 'error',
          })
        }
      } else {
        const { total, items } = data
        returned.value = items
        totalItems.value = total
      }
      loading.value = false
    }
    const manualLoadItems = async () => {
      if (!table.value) {
        return
      }
      const options = {
        page: table.value.page,
        itemsPerPage: table.value.itemsPerPage,
        sortBy: table.value.sortBy,
        search: search.value,
        groupBy: table.value.groupBy,
      }
      return await loadItems(options)
    }
    const onSearchSubmit = (e: Event) => {
      e.preventDefault()
      if (search.value === searchField.value) {
        manualLoadItems()
      }
      search.value = searchField.value
    }
    const modelI18nSingular = computed(() => t(`${modelI18nKey.value}.singular`))
    const modelI18nPlural = computed(() => t(`${modelI18nKey.value}.plural`))

    const modelI18nSingularCapitalized = computed(() => capitalCase(modelI18nSingular.value))
    const modelI18nPluralCapitalized = computed(() => capitalCase(modelI18nPlural.value))

    onMounted(() => {
      mounted.value = true
      manualLoadItems()
    })
    return {
      itemsPerPage,
      headers,
      items,
      totalItems,
      loading,
      search,
      searchField,
      onSearchSubmit,
      loadItems,
      classes,
      modelI18nSingular,
      modelI18nPlural,
      modelI18nSingularCapitalized,
      modelI18nPluralCapitalized,
      table,
    }
  },
})
</script>
