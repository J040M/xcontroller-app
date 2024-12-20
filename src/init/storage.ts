/*******************/
// STORAGE SCRIPTS //
/*******************/

export function initStorage() {
    // Create if not existant (default storage items)
    const storageItems = ['PrinterProfiles', 'Locale', 'Theme', 'PrinterPresets'];
    storageItems.forEach((item) => {
        if (!localStorage.getItem(item)) {
            localStorage.setItem(item, '[]');
        }
    });
}
