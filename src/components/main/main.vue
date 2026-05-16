<script lang="ts">
import { defineComponent } from 'vue'
import Control from './control.vue';
import Temperature from './temperature.vue';
import Terminal from './terminal.vue';
import GcodeViewer from './gcodeViewer.vue';

export default defineComponent({
    name: 'mainContentComponent',
    components: {
        Control,
        Temperature,
        Terminal,
        GcodeViewer
    }
})
</script>

<template>
    <div class="flex flex-col h-full">
        <Tabs value="0" class="tactical-tabs flex flex-col h-full">
            <TabList>
                <Tab value="0">{{ $t('main.control') }}</Tab>
                <Tab value="1">{{ $t('main.temperature') }}</Tab>
                <Tab value="2">{{ $t('main.terminal') }}</Tab>
                <Tab value="3">{{ $t('main.gcodeviewer') }}</Tab>
            </TabList>
            <TabPanels class="flex-1 min-h-0 overflow-y-auto bg-surface">
                <TabPanel value="0">
                    <Control />
                </TabPanel>
                <TabPanel value="1">
                    <Temperature />
                </TabPanel>
                <TabPanel value="2">
                    <Terminal />
                </TabPanel>
                <TabPanel value="3">
                    <GcodeViewer />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
.tactical-tabs :deep(.p-tablist) {
    background: theme('colors.surface');
    border-bottom: 1px solid theme('colors.outline-variant');
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 10;
}

/* PrimeVue 4 wraps the tabs in p-tablist-tab-list — keep it transparent. */
.tactical-tabs :deep(.p-tablist-tab-list) {
    background: transparent;
    border: 0;
}

.tactical-tabs :deep(.p-tab) {
    padding: 16px 4px;
    margin-right: 24px;
    color: theme('colors.on-surface-variant');
    font-size: 14px;
    font-weight: 500;
    background: transparent;
    border: 0;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
}

.tactical-tabs :deep(.p-tab:hover) {
    color: theme('colors.on-surface');
}

.tactical-tabs :deep(.p-tab-active) {
    color: theme('colors.primary-fixed-dim');
    border-bottom-color: theme('colors.primary-fixed-dim');
    background: transparent;
}

/* Hide PrimeVue's sliding indicator — we're drawing our own border-bottom. */
.tactical-tabs :deep(.p-tablist-active-bar) {
    display: none;
}

.tactical-tabs :deep(.p-tabpanels) {
    background: theme('colors.surface');
    padding: 0;
}

.tactical-tabs :deep(.p-tabpanel) {
    padding: 0;
    height: 100%;
}
</style>
