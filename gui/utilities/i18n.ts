import languages from '@/constants/languages'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import { inject } from 'vue'
import type { LocalStorageService } from '@jakguru/vueprint'

export const asArray = Object.keys(languages).map((key) => languages[key])

export const setLocale = (is: string): void => {
  const language = languages[is]
  if (!language) {
    return
  }
  const { locale } = useI18n({ useScope: 'global' })
  const { isRtl } = useLocale()
  const ls = inject<LocalStorageService>('ls')
  locale.value = language.iso
  isRtl.value = language.rtl
  if (ls) {
    ls.set('locale', language.iso)
  }
}

export const initializeLocale = (): void => {
  const { locale } = useI18n({ useScope: 'global' })
  const { isRtl } = useLocale()
  const ls = inject<LocalStorageService>('ls')
  let iso = 'en'
  if (ls) {
    iso = ls.get('locale') || 'en'
  }
  const language = languages[iso]
  if (!language) {
    return
  }
  locale.value = language.iso
  isRtl.value = language.rtl
}
