import type { StorageTypes } from '../types/storage'
/**
 * File used to manage the storage of the application
 * directly related to the printer
 * @class printerStorage
 */
export default class PrinterStorage {

    private storageItemsList: StorageTypes[] = ['PrinterProfiles', 'HeatingProfiles', 'Locale', 'Theme']

    constructor() {
        this.initStorage()
    }
    /**
     * Save profiles to local storage
     * @param {string} key 
     * @param {T} profile 
     */
    saveProfile<T>(key: StorageTypes, profile: T): void {
        let profiles = localStorage.getItem(key)
        if (profiles || profiles === '[]') {
            const nProfiles = JSON.parse(profiles) as T[] || []
            nProfiles.push(profile)
            localStorage.setItem(key, JSON.stringify(nProfiles))
        } else {
            let nProfiles: T[] = []
            nProfiles.push(profile)
            localStorage.setItem(key, JSON.stringify(nProfiles))
        }
    }

    /**
    * Initialize the storage by creating 
    * the default storage items if they don't exist
    * @returns {void}
    */
    private initStorage(): void {
        // Create if not existant (default storage items)
        this.storageItemsList.forEach((item) => {
            if (!localStorage.getItem(item)) {
                localStorage.setItem(item, '[]');
            }
        });
    }
}