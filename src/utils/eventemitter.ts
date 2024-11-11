export class EventEmitter {

    //Store events and listeners, callback functions
    private events: { [key: string]: Function[] } = {};

    // Register listener to event
    on(event: string, listener: Function): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    // Unregister listener from event
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