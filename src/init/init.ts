import { initStorage } from "./storage";

/**
 * Initialize all required services
 * @async
 * @throws {Error} If any service fails to initialize
 * @returns {void}
 */
export async function init() {
    try {
        await initStorage();
    } catch (error: unknown) {
        throw new Error(`Failed to initialize services ${error}`);
    }
}