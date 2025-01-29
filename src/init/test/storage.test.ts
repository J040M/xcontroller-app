import { describe, it, expect, beforeEach } from 'vitest';
import { initStorage } from '../storage';

describe('initStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should create default storage items if they do not exist', () => {
        initStorage();

        expect(localStorage.getItem('PrinterProfiles')).toBe('[]');
        expect(localStorage.getItem('Locale')).toBe('[]');
        expect(localStorage.getItem('Theme')).toBe('[]');
        expect(localStorage.getItem('PrinterPresets')).toBe('[]');
    });

    it('should not overwrite existing storage items', () => {
        localStorage.setItem('PrinterProfiles', '[{"name":"Profile1"}]');
        initStorage();

        expect(localStorage.getItem('PrinterProfiles')).toBe('[{"name":"Profile1"}]');
        expect(localStorage.getItem('Locale')).toBe('[]');
        expect(localStorage.getItem('Theme')).toBe('[]');
        expect(localStorage.getItem('PrinterPresets')).toBe('[]');
    });
});