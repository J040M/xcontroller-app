<script lang="ts">
import { defineComponent, ref } from 'vue'
import Connector from './components/connector.vue';
import Status from './components/status.vue';
import Main from './components/main/main.vue';
import Files from './components/files.vue';
import FooterComponent from './components/footer.vue';

import { eventBus } from './utils/eventbus';
import { wsClient } from './init/client';
import { useListener } from './utils/listeners';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'Root',
  components: {
    Connector,
    Status,
    Main,
    Files,
    FooterComponent
  },
  setup() {
    const errorMessageDialog = ref(false)
    /**
     * The Connector panel auto-collapses on a successful connection (the
     * printer list isn't useful while connected) and auto-opens again when
     * the link drops, so the user can reconnect without hunting for it.
     */
    const connectorOpen = ref(true)

    useListener(eventBus, 'message', (message: string) => {
      if (message === 'openConnectionErrorDialog') {
        errorMessageDialog.value = true
      }
    })

    useListener(wsClient, 'connected', () => {
      connectorOpen.value = false
    })
    useListener(wsClient, 'disconnected', () => {
      connectorOpen.value = true
    })
    useListener(wsClient, 'error', () => {
      connectorOpen.value = true
    })

    const { t } = useI18n()
    return { t, errorMessageDialog, connectorOpen }
  }
})
</script>

<template>
  <Dialog
    :visible="errorMessageDialog"
    modal
    :header="$t('error_message.header')"
    :style="{ width: '25rem' }"
    :closable="false"
  >
    <p class="font-code-sm text-on-surface">{{ $t('error_message.connection_error') }}</p>
    <template #footer>
      <Button type="button" label="Cancel" severity="secondary" @click="errorMessageDialog = false" />
    </template>
  </Dialog>

  <div class="flex flex-col h-screen bg-surface text-on-surface">
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
