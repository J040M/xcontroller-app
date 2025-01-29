import { describe, it, expect, beforeEach, vi } from 'vitest'
import { i18n, changeLocale } from '../i18n'

describe('i18n configuration', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('should initialize with english as fallback locale', () => {
        expect(i18n.global.fallbackLocale).toBe('en')
    })

    it('should contain all supported languages', () => {
        const messages = i18n.global.messages
        expect(messages).toHaveProperty('en')
        expect(messages).toHaveProperty('fr')
        expect(messages).toHaveProperty('de')
        expect(messages).toHaveProperty('pt')
    })

    describe('changeLocale', () => {
        it('should change the active locale', () => {
            changeLocale('fr')
            expect(i18n.global.locale).toBe('fr')
        })

        it('should persist locale selection to localStorage', () => {
            changeLocale('de')
            expect(localStorage.getItem('locale')).toBe('de')
        })
    })
})