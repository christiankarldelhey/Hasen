import { computed, ref } from 'vue'
import en from '@/locales/en'
import es from '@/locales/es'

type TranslationKey = string
type TranslationParams = Record<string, string | number>
type SupportedLocale = 'en' | 'es'

const LOCALE_STORAGE_KEY = 'hasen.locale'
const availableLocales: SupportedLocale[] = ['en', 'es']

function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en'

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored === 'en' || stored === 'es') {
    return stored
  }

  return 'en'
}

const localeState = ref<SupportedLocale>(getInitialLocale())

// Función helper para obtener valor anidado de un objeto usando dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Función para reemplazar placeholders en strings
function interpolate(template: string, params: TranslationParams): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() || `{${key}}`
  })
}

export function useI18n() {
  const locale = computed(() => localeState.value)

  const translations = computed(() => {
    switch (locale.value) {
      case 'es':
        return es
      case 'en':
      default:
        return en
    }
  })

  const setLocale = (nextLocale: SupportedLocale) => {
    if (!availableLocales.includes(nextLocale)) return

    localeState.value = nextLocale

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
    }
  }

  const t = (key: TranslationKey, params?: TranslationParams): string => {
    const value = getNestedValue(translations.value, key)
    
    if (!value) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
    
    if (params) {
      return interpolate(value, params)
    }
    
    return value
  }

  return {
    t,
    locale,
    setLocale,
    availableLocales,
  }
}
