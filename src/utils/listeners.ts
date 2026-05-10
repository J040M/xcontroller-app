import { onMounted, onBeforeUnmount } from 'vue'

type AnyHandler = (...args: any[]) => void

interface Emitter {
    on(event: string, handler: AnyHandler): void
    off(event: string, handler: AnyHandler): void
}

/**
 * Register a listener on an emitter for the lifetime of the calling
 * component. The listener is attached on `mounted` and detached on
 * `beforeUnmount`. Must be called from inside a Vue `setup()` context.
 */
export function useListener(emitter: Emitter, event: string, handler: AnyHandler): void {
    onMounted(() => emitter.on(event, handler))
    onBeforeUnmount(() => emitter.off(event, handler))
}
