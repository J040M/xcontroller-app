/**
 * @file Event Emitter Implementation
 * @description A simple event emitter implementation providing pub/sub functionality
 * for managing application-wide events and listeners.
 */

export class EventEmitter {
    /**
     * Storage for event listeners
     * @private
     * @type {Object.<string, Function[]>}
     */
    private events: { [key: string]: Function[] } = {};

    /**
     * Register an event listener
     * @param {string} event - The event name to listen for
     * @param {Function} listener - Callback function to execute when event is emitted
     * @throws {TypeError} If listener is not a function
     */
    on(event: string, listener: Function): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    /**
     * Remove an event listener
     * @param {string} event - The event name to remove listener from
     * @param {Function} listener - The listener function to remove
     */
    off(event: string, listener: Function): void {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter((li) => li !== listener);
    }

    // Emit event to all registered listeners
    emit(event: string, ...args: Event[] | MessageEvent<string>[] | string[]): void {
        if (this.events[event]) {
            this.events[event].forEach((listener) => listener(...args));
        }
    }
}
