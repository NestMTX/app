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
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template #item.__actions="{ value }">
        <v-toolbar-items class="h-100 px-0">
          <v-btn v-for="(a, i) in value" :key="`item-${value.id}-action-${i}`" v-bind="a" />
        </v-toolbar-items>
      </template>
      <template v-for="r in renderers" :key="`renderer-for-${r.key}`" #[r.key]="{ value, item }">
        <component :is="r.renderer" :value="value" :item="item"></component>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { capitalCase } from 'change-case'
import { renderAsDefault } from '../../utilities/renderers'
import qs from 'qs'
import type { PropType } from 'vue'
import type { ApiService, SwalService } from '@jakguru/vueprint'
import type { VDataTableServer } from 'vuetify/components/VDataTable/'
import type { ModelIndexField, ModelIndexAction } from '../../types/forms.js'

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
    columns: {
      type: Array as PropType<ModelIndexField[]>,
      default: () => [] as ModelIndexField[],
    },
    actions: {
      type: Array as PropType<ModelIndexAction[]>,
      default: () => [] as ModelIndexAction[],
    },
  },
  setup(props) {
    const table = ref<VDataTableServer | undefined>(undefined)
    const modelI18nKey = computed(() => props.modelI18nKey)
    const searchEndPoint = computed(() => props.searchEndPoint)
    const columns = computed(() => props.columns)
    const actions = computed(() => props.actions)
    const hasActions = computed(() => actions.value.length > 0)
    const processingActions = ref<Array<string>>([])
    const { t } = useI18n({ useScope: 'global' })
    const api = inject<ApiService>('api')!
    const swal = inject<SwalService>('swal')!
    const mounted = ref(false)
    const returned = ref<Array<any>>([])
    const itemsPerPage = ref(10)
    const headers = computed(() =>
      [
        hasActions.value
          ? {
              label: '',
              key: '__actions',
              sortable: false,
              width: '100px',
              cellProps: { class: 'px-0' },
              align: undefined,
              maxWidth: undefined,
              minWidth: undefined,
            }
          : undefined,
        ...columns.value,
      ]
        .filter((c) => 'object' === typeof c && c !== null)
        .map((c) => ({
          value: c.key,
          title: c.label,
          nowrap: true,
          align: c.align,
          width: c.width,
          minWidth: c.minWidth,
          maxWidth: c.maxWidth,
          sortable: c.sortable,
          cellProps: c.cellProps,
        }))
    )
    const renderers = computed(() =>
      [...columns.value].map((c) => ({
        key: `item.${c.key}` as `item.${string}`,
        renderer: c.renderer || renderAsDefault,
      }))
    )
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
        validateStatus: () => true,
        signal: loadItemsAbortController.signal,
      })
      if (status < 200 || status >= 300) {
        if (!loadItemsAbortController.signal.aborted) {
          if (data.error) {
            const { message } = data.error
            swal.fire({
              title: t('components.modelIndex.errors.loadItems', { model: modelI18nPlural.value }),
              text: t(message),
              icon: 'error',
            })
          } else {
            swal.fire({
              title: t('components.modelIndex.errors.loadItems', { model: modelI18nPlural.value }),
              text: t('errors.unknown'),
              icon: 'error',
            })
          }
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
    const processAction = async (action: ModelIndexAction, row: Record<string, unknown>) => {
      const actionKey = [row.id, action.label].join(':')
      if (processingActions.value.includes(actionKey)) {
        return
      }
      processingActions.value.push(actionKey)
      try {
        await action.callback(row)
      } catch (e) {
        console.error(e)
        // Do nothing
      }
      processingActions.value = processingActions.value.filter((a) => a !== actionKey)
      manualLoadItems()
    }
    const items = computed(() =>
      [...returned.value].map((item) => {
        for (const key in item) {
          const column = columns.value.find((c) => c.key === key)
          if (column) {
            item[key] = column.formatter(item[key], item)
          }
        }
        if (hasActions.value) {
          item.__actions = actions.value
            .filter((action) => (action.condition ? action.condition(item) : true))
            .map((a) => ({
              icon: a.icon,
              color: a.color,
              title: a.label,
              onClick: () => processAction(a, item),
              loading: processingActions.value.includes([item.id, a.label].join(':')),
            }))
        }
        return item
      })
    )
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
      hasActions,
      renderers,
      manualLoadItems,
    }
  },
})
</script>
