import { computed } from 'vue'
import en from '@/locales/en'

type TranslationKey = string
type TranslationParams = Record<string, string | number>

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
  const locale = computed(() => 'en') // Por ahora solo inglés, se puede extender
  
  const translations = computed(() => {
    switch (locale.value) {
      case 'en':
      default:
        return en
    }
  })

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
  }
}
