import { createI18n } from 'vue-i18n'
import { en } from '../locale/en.json'
import { fr } from '../locale/fr.json'

export const i18n = createI18n({
  fallbackLocale: 'en',
  allowComposition: true,
  messages: {
    en, fr
  }
})