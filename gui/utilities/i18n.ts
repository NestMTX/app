import languages from '@/constants/languages'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import { inject } from 'vue'
import type { LocalStorageService } from '@jakguru/vueprint'
import type { WritableComputedRef, Ref } from 'vue'

export const asArray = Object.keys(languages).map((key) => languages[key])

export const setLocale = (locale: WritableComputedRef<string>, isRtl: Ref<boolean>, is: string): void => {
  const language = languages[is]
  if (!language) {
    return
  }
  const ls = inject<LocalStorageService>('ls')
  locale.value = language.iso
  isRtl.value = language.rtl
  if (ls) {
    ls.set('locale', language.iso)
  }
}

export const initializeLocale = (): void => {
  const { setLocale, locale } = useI18n({ useScope: 'global' })
  const { isRtl } = useLocale()
  const ls = inject<LocalStorageService>('ls')
  let iso = locale.value
  if (ls) {
    iso = ls.get('locale') || locale.value || 'en'
  }
  const language = languages[iso]
  if (!language) {
    return
  }
  // locale.value = language.iso
  setLocale(language.iso)
  isRtl.value = language.rtl
}
