/**
 * Internationalization (i18n) configuration module
 * Handles multi-language support using vue-i18n
 */
import { createI18n } from 'vue-i18n'
import { en } from '../locale/en.json'
import { fr } from '../locale/fr.json'
import { de } from '../locale/de.json'
import { pt } from '../locale/pt.json'

/**
 * Initialize i18n instance with configuration
 * - Sets English as fallback language
 * - Enables composition API support
 * @returns {import('vue-i18n').I18n} Configured i18n instance
 */
export const i18n = createI18n({
  fallbackLocale: 'en',
  allowComposition: true,
  messages: {
    en, pt, fr, de
  }
})

// Supported language types
type SupportedLocale = 'en' | 'fr' | 'de' | 'pt'

/**
 * Retrieve user's preferred language from local storage
 * and set as active locale if available
 */
const preferredLanguage = localStorage.getItem('locale') as SupportedLocale
if(preferredLanguage) i18n.global.locale = preferredLanguage

/**
 * Changes the application's active locale and persists the selection
 * @param {SupportedLocale} locale - The locale code to switch to
 * @returns {void}
 */
export function changeLocale(locale: SupportedLocale) {
  i18n.global.locale = locale
  localStorage.setItem('locale', locale)
}
