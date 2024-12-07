import { createI18n } from 'vue-i18n'
import { en } from '../locale/en.json'
import { fr } from '../locale/fr.json'
import { de } from '../locale/de.json'
import { pt } from '../locale/pt.json'

export const i18n = createI18n({
  fallbackLocale: 'en',
  allowComposition: true,
  messages: {
    en, pt, fr, de
  }
})

// Check if the user has a preferred language
const preferredLanguage = localStorage.getItem('locale') as 'en' | 'fr' | 'de' | 'pt'

if(preferredLanguage) {
  i18n.global.locale = preferredLanguage
}

export function changeLocale(locale: 'en' | 'fr' | 'de' | 'pt') {
  i18n.global.locale = locale
  localStorage.setItem('locale', locale)
}