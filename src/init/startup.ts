/*******************/
// STARTUP SCRIPTS //
/*******************/

// Create if not existant (default storage items)
const storageItems = [ 'PrinterProfiles', 'locale', 'Theme' ];
storageItems.forEach((item) => {
    if (!localStorage.getItem(item)) {
        localStorage.setItem(item, '');
    }
});