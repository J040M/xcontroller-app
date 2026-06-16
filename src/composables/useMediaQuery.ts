import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

/**
 * Reactive `window.matchMedia` wrapper.
 *
 * Returns a ref that tracks whether `query` currently matches and stays in
 * sync as the viewport changes (orientation flips, window resizes, devtools
 * device toolbar). Used to decide between the desktop and mobile UI trees in
 * `App.vue` so only one of them is ever mounted.
 *
 * SSR/headless safe: when `window.matchMedia` is unavailable the ref is simply
 * `false` and never updates.
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches
  }

  const mql = window.matchMedia(query)
  matches.value = mql.matches

  const onChange = (e: MediaQueryListEvent) => {
    matches.value = e.matches
  }

  mql.addEventListener('change', onChange)
  onBeforeUnmount(() => mql.removeEventListener('change', onChange))

  return matches
}

/**
 * Breakpoint at which the app swaps the desktop sidebar layout for the mobile
 * shell. This is Tailwind's `lg` — below it the 300px sidebar + multi-column
 * control deck no longer fit, so phones and tablets get the touch-first UI.
 */
export const DESKTOP_MIN_WIDTH = 1024

/**
 * True while the viewport is in the mobile range.
 *
 * Anchored to the *same* `(min-width: 1024px)` query Tailwind uses for `lg:`
 * and inverted, so the desktop tree mounts at exactly the width where `lg:`
 * utilities activate. Using a separate `max-width: 1023px` query would leave a
 * fractional dead-zone (e.g. 1023.5px under zoom) where the desktop tree
 * renders but every `lg:` class is still off, collapsing the desktop layout.
 */
export function useIsMobile(): Ref<boolean> {
  const isDesktop = useMediaQuery(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
  return computed(() => !isDesktop.value)
}
