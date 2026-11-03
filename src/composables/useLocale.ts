import { useI18n } from 'vue-i18n'
import { applyLocale, type AppLocale } from '@/i18n'

export function useLocale() {
  const { locale } = useI18n()

  function setLocale(next: AppLocale) {
    locale.value = next
    applyLocale(next)
  }

  function toggle() {
    setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
  }

  return { locale, setLocale, toggle }
}
