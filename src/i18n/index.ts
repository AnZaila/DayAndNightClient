import { createI18n } from 'vue-i18n'
import enUS from './en-US'
import zhCN from './zh-CN'

export const LOCALE_KEY = 'dayandnight-locale'
export type AppLocale = 'zh-CN' | 'en-US'

export function readLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'en-US' || saved === 'zh-CN') return saved
  } catch {
    /* private mode */
  }
  return 'zh-CN'
}

export function applyLocale(locale: AppLocale) {
  document.documentElement.lang = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    /* private mode */
  }
  const messages = locale === 'en-US' ? enUS.meta : zhCN.meta
  document.title = messages.title
  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', messages.description)
}

export const i18n = createI18n({
  legacy: false,
  locale: readLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

applyLocale(readLocale())

export function tApi(message: string) {
  const joiner = message.includes('；') ? '；' : message.includes('; ') ? '; ' : ''
  if (joiner) {
    return message
      .split(joiner)
      .map((part) => tApi(part.trim()))
      .join(i18n.global.locale.value === 'zh-CN' ? '；' : '; ')
  }
  const key = `api.${message}`
  return i18n.global.te(key) ? String(i18n.global.t(key)) : message
}

export function namedLabel(kind: 'mood' | 'weather', value: string | null | undefined) {
  if (!value || value === 'none') return ''
  const key = `${kind}.${value}`
  return i18n.global.te(key) ? String(i18n.global.t(key)) : value
}
