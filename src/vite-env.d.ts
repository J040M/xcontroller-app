/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface Window {
  /** Injected by the Tauri runtime. Present only in the native app — used
   *  by `transport/index.ts`'s `isTauri()` to gate USB-only features. */
  __TAURI_INTERNALS__?: unknown;
}
