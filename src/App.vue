<script lang="ts">
import { defineComponent, ref } from 'vue'
import Connector from './components/connector.vue';
import Status from './components/status.vue';
import Main from './components/main/main.vue';
import Files from './components/files.vue';
import FooterComponent from './components/footer.vue';
import MobileApp from './mobile/MobileApp.vue';

import { eventBus } from './utils/eventbus';
import { useListener } from './utils/listeners';
import { useIsMobile } from './composables/useMediaQuery';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'Root',
  components: {
    Connector,
    Status,
    Main,
    Files,
    FooterComponent,
    MobileApp
  },
  setup() {
    const errorMessageDialog = ref(false)
    /**
     * Which `error_message.*` string the dialog shows. A failed auth
     * handshake is a distinct failure mode from a dropped/refused link, so
     * the dialog body switches between the two instead of always blaming
     * the connection.
     */
    const errorMessageKey = ref<'connection_error' | 'auth_error'>('connection_error')
    /**
     * The Connector panel auto-collapses on a successful connection (the
     * printer list isn't useful while connected) and auto-opens again when
     * the link drops, so the user can reconnect without hunting for it.
     */
    const connectorOpen = ref(true)

    useListener(eventBus, 'message', (message: string) => {
      if (message === 'openConnectionErrorDialog') {
        errorMessageKey.value = 'connection_error'
        errorMessageDialog.value = true
      }
    })

    useListener(eventBus, 'connection:open', () => {
      connectorOpen.value = false
    })
    useListener(eventBus, 'connection:close', () => {
      connectorOpen.value = true
    })
    useListener(eventBus, 'connection:error', () => {
      connectorOpen.value = true
    })
    useListener(eventBus, 'connection:authfailed', () => {
      connectorOpen.value = true
      errorMessageKey.value = 'auth_error'
      errorMessageDialog.value = true
    })

    /**
     * Below the `lg` breakpoint the fixed-width sidebar layout is unusable, so
     * the whole desktop tree is swapped for the touch-first mobile shell. This
     * is a `v-if` switch (not CSS) so only one tree mounts at a time — the 3D
     * viewers, chart pollers and transport listeners never run in duplicate.
     * The desktop markup below is otherwise unchanged and only renders at
     * >=1024px.
     */
    const isMobile = useIsMobile()

    const { t } = useI18n()
    return { t, errorMessageDialog, errorMessageKey, connectorOpen, isMobile }
  }
})
</script>

<template>
  <Dialog
    :visible="errorMessageDialog"
    modal
    :header="$t('error_message.header')"
    :style="{ width: 'min(25rem, 95vw)' }"
    :closable="false"
  >
    <p class="font-code-sm text-on-surface">{{ $t('error_message.' + errorMessageKey) }}</p>
    <template #footer>
      <Button type="button" label="Cancel" severity="secondary" @click="errorMessageDialog = false" />
    </template>
  </Dialog>

  <!-- Mobile shell (below lg). Reuses the same singleton stores/transports. -->
  <MobileApp v-if="isMobile" />

  <!-- Desktop layout (>=lg). Unchanged — only gated so it doesn't render on phones. -->
  <div v-else class="flex flex-col h-screen bg-surface text-on-surface">
    <div class="flex flex-1 min-h-0">
      <aside class="w-[300px] shrink-0 border-r border-outline-variant bg-surface-container-lowest overflow-y-auto flex flex-col">
        <section class="border-b border-outline-variant">
          <button
            type="button"
            class="w-full flex items-center px-5 py-4 text-left transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:bg-surface-container-low"
            :aria-expanded="connectorOpen"
            @click="connectorOpen = !connectorOpen"
          >
            <span class="material-symbols-outlined text-primary-fixed-dim mr-2">cable</span>
            <h2 class="font-headline-md tracking-wide text-on-surface flex-1">{{ $t('app.connector') }}</h2>
            <span
              class="material-symbols-outlined text-on-surface-variant transition-transform"
              :class="{ 'rotate-180': connectorOpen }"
            >expand_more</span>
          </button>
          <Connector v-show="connectorOpen" />
        </section>

        <section class="border-b border-outline-variant">
          <header class="flex items-center px-5 py-4">
            <span class="material-symbols-outlined text-primary-fixed-dim mr-2">monitor_heart</span>
            <h2 class="font-headline-md tracking-wide text-on-surface">{{ $t('app.status') }}</h2>
          </header>
          <Status />
        </section>

        <section class="border-b border-outline-variant">
          <header class="flex items-center px-5 py-4">
            <span class="material-symbols-outlined text-primary-fixed-dim mr-2">folder</span>
            <h2 class="font-headline-md tracking-wide text-on-surface">{{ $t('app.files') }}</h2>
          </header>
          <Files />
        </section>
      </aside>

      <main class="flex-1 min-w-0 overflow-y-auto bg-surface">
        <Main />
      </main>
    </div>

    <FooterComponent />
  </div>
</template>
