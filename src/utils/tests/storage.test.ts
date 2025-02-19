import { describe, it, expect, beforeEach } from 'vitest';
import PrinterStorage from '../storage';

describe('initStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should create default storage items if they do not exist', () => {
        const storage = new PrinterStorage();

        storage.storageItemsList.forEach((item: string) => {
            expect(localStorage.getItem(item)).toBe('[]');
        });
    });

    it('should not overwrite existing storage items', () => {
        const storage = new PrinterStorage();
        
        localStorage.setItem('PrinterProfiles', '[{"name":"Profile1"}]');
        
        storage.storageItemsList.forEach((item: string) => {
            if (item !== 'PrinterProfiles') {
                expect(localStorage.getItem(item)).toBe('[]');
            } else {
                expect(localStorage.getItem(item)).toBe('[{"name":"Profile1"}]');
            }
        });
    });
});