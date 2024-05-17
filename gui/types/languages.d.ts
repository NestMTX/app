declare module '@/constants/languages' {
  export type Language = {
    iso: string
    english: string
    local: string
    rtl: boolean
  }

  export type LanguageRecord = Record<string, Language>

  const languages: LanguageRecord
  export default languages
}
