<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { printer } from '../init/client'
import { eventBus } from '../utils/eventbus'
import { useListener } from '../utils/listeners'
import { changeLocale } from '../utils/i18n'

// Reused desktop components — these were authored for the 300px sidebar, so
// they drop straight into the mobile drawer and tab content without edits.
import Connector from '../components/connector.vue'
import Status from '../components/status.vue'
import Files from '../components/files.vue'
import Temperature from '../components/main/temperature.vue'

// Mobile-only rebuilds of the views whose desktop layouts can't reflow narrow.
import ControlMobile from './views/ControlMobile.vue'
import TerminalMobile from './views/TerminalMobile.vue'
import GcodeViewerMobile from './views/GcodeViewerMobile.vue'

type MobileTab = 'control' | 'temperature' | 'files' | 'terminal' | 'gcode'

interface TabDef {
  key: MobileTab
  icon: string
  labelKey: string
}

export default defineComponent({
  name: 'MobileApp',
  components: {
    Connector,
    Status,
    Files,
    Temperature,
    ControlMobile,
    TerminalMobile,
    GcodeViewerMobile,
  },
  setup() {
    const activeTab = ref<MobileTab>('control')
    const drawerOpen = ref(false)

    const tabs: TabDef[] = [
      { key: 'control', icon: 'gamepad', labelKey: 'main.control' },
      { key: 'temperature', icon: 'thermostat', labelKey: 'main.temperature' },
      { key: 'files', icon: 'folder', labelKey: 'app.files' },
      { key: 'terminal', icon: 'terminal', labelKey: 'main.terminal' },
      { key: 'gcode', icon: 'deployed_code', labelKey: 'main.gcodeviewer' },
    ]

    // Tidy the drawer away once a link is established — the connector panel is
    // only useful while disconnected, mirroring the desktop sidebar's collapse.
    useListener(eventBus, 'connection:open', () => {
      drawerOpen.value = false
    })

    // ...and surface it again when the link drops or auth fails, so the user
    // has a reconnect affordance. The desktop re-opens its connector sidebar on
    // these events; on mobile the connector lives in the drawer, so we open it.
    const openDrawer = () => { drawerOpen.value = true }
    useListener(eventBus, 'connection:close', openDrawer)
    useListener(eventBus, 'connection:error', openDrawer)
    useListener(eventBus, 'connection:authfailed', openDrawer)

    const connected = computed(() => printer.printerInfo.status)
    const printState = computed(() => printer.printerInfo.printStatus.state)
    const showProgress = computed(
      () => printState.value === 'printing' || printState.value === 'paused',
    )

    function selectTab(key: MobileTab): void {
      activeTab.value = key
    }

    return {
      printer,
      activeTab,
      drawerOpen,
      tabs,
      connected,
      printState,
      showProgress,
      selectTab,
      changeLocale,
    }
  },
})
</script>

<template>
  <div class="flex flex-col h-[100dvh] bg-surface text-on-surface overflow-hidden">
    <!-- App bar -->
    <header
      class="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-outline-variant bg-surface-container-lowest pt-[env(safe-area-inset-top)]"
    >
      <button
        type="button"
        class="w-10 h-10 -ml-2 rounded flex items-center justify-center text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
        :aria-label="$t('app.connector')"
        @click="drawerOpen = true"
      >
        <span class="material-symbols-outlined text-2xl">menu</span>
      </button>

      <span class="font-headline-md text-base tracking-wide text-on-surface flex-1 truncate">
        {{ $t('app.name') }}
      </span>

      <!-- Live connection indicator -->
      <button
        type="button"
        class="flex items-center gap-2 px-2 h-9 rounded-full border transition-colors"
        :class="connected
          ? 'border-primary-fixed-dim/40 text-primary-fixed-dim'
          : 'border-outline-variant text-on-surface-variant'"
        @click="drawerOpen = true"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="connected
            ? 'bg-primary-fixed-dim shadow-[0_0_8px_rgba(0,220,229,0.8)] animate-pulse'
            : 'bg-outline'"
        />
        <span class="text-[10px] font-label-caps uppercase tracking-widest">
          {{ connected ? 'Online' : 'Offline' }}
        </span>
      </button>
    </header>

    <!-- Active-print progress strip -->
    <div
      v-if="showProgress"
      class="shrink-0 flex items-center gap-3 px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/60"
    >
      <span class="text-[10px] font-label-caps uppercase tracking-widest" :class="printState === 'paused' ? 'text-tertiary-container' : 'text-primary-fixed-dim'">
        {{ printState }}
      </span>
      <div class="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-fixed-dim shadow-[0_0_8px_rgba(0,220,229,0.6)] transition-all"
          :style="{ width: `${printer.printerInfo.printStatus.progress}%` }"
        />
      </div>
      <span class="font-code-sm text-primary-fixed-dim text-xs shrink-0">
        {{ printer.printerInfo.printStatus.progress }}%
      </span>
    </div>

    <!-- Active view. v-if (not v-show) so heavy 3D / terminal views fully
         unmount when navigating away and don't hold WebGL contexts open. -->
    <main class="flex-1 min-h-0">
      <div v-if="activeTab === 'control'" class="h-full overflow-y-auto">
        <ControlMobile />
      </div>
      <div v-else-if="activeTab === 'temperature'" class="h-full overflow-y-auto">
        <Temperature />
      </div>
      <div v-else-if="activeTab === 'files'" class="h-full overflow-y-auto">
        <Files />
      </div>
      <TerminalMobile v-else-if="activeTab === 'terminal'" class="h-full" />
      <GcodeViewerMobile v-else-if="activeTab === 'gcode'" class="h-full" />
    </main>

    <!-- Bottom navigation -->
    <nav
      class="shrink-0 grid grid-cols-5 border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)]"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
        :class="activeTab === tab.key ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-on-surface'"
        :aria-current="activeTab === tab.key ? 'page' : undefined"
        @click="selectTab(tab.key)"
      >
        <span
          class="material-symbols-outlined text-2xl"
          :class="activeTab === tab.key ? 'drop-shadow-[0_0_6px_rgba(0,220,229,0.6)]' : ''"
        >{{ tab.icon }}</span>
        <span class="text-[9px] font-label-caps uppercase tracking-wider truncate max-w-full px-1">
          {{ $t(tab.labelKey) }}
        </span>
      </button>
    </nav>

    <!-- Drawer: machine connection + live status -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        @click="drawerOpen = false"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="drawerOpen"
        class="fixed top-0 left-0 z-50 h-[100dvh] w-[85vw] max-w-[340px] flex flex-col bg-surface-container-lowest border-r border-outline-variant overflow-y-auto"
      >
        <header class="shrink-0 flex items-center gap-2 px-5 h-14 border-b border-outline-variant pt-[env(safe-area-inset-top)]">
          <span class="material-symbols-outlined text-primary-fixed-dim">precision_manufacturing</span>
          <h2 class="font-headline-md text-base tracking-wide flex-1">{{ $t('app.name') }}</h2>
          <button
            type="button"
            class="w-9 h-9 -mr-2 rounded flex items-center justify-center text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
            aria-label="Close"
            @click="drawerOpen = false"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <section class="border-b border-outline-variant">
          <header class="flex items-center px-5 py-3">
            <span class="material-symbols-outlined text-primary-fixed-dim mr-2">cable</span>
            <h3 class="font-headline-md text-sm tracking-wide">{{ $t('app.connector') }}</h3>
          </header>
          <Connector />
        </section>

        <section class="border-b border-outline-variant">
          <header class="flex items-center px-5 py-3">
            <span class="material-symbols-outlined text-primary-fixed-dim mr-2">monitor_heart</span>
            <h3 class="font-headline-md text-sm tracking-wide">{{ $t('app.status') }}</h3>
          </header>
          <Status />
        </section>

        <footer class="mt-auto flex items-center justify-center gap-2 px-5 py-4 font-label-caps text-on-surface-variant tracking-widest pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('pt')">PT</button>
          <span class="text-outline-variant">|</span>
          <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('fr')">FR</button>
          <span class="text-outline-variant">|</span>
          <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('en')">EN</button>
          <span class="text-outline-variant">|</span>
          <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('de')">DE</button>
        </footer>
      </aside>
    </Transition>
  </div>
</template>
