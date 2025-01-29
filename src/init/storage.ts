/**
 * Initialize the storage by creating 
 * the default storage items if they don't exist
 * @returns {void}
 */
export function initStorage(): void {
    // Create if not existant (default storage items)
    const storageItems = ['PrinterProfiles', 'Locale', 'Theme', 'PrinterPresets'];
    storageItems.forEach((item) => {
        if (!localStorage.getItem(item)) {
            localStorage.setItem(item, '[]');
        }
    });
}
