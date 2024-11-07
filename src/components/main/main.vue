<script lang="ts">
import { defineComponent } from 'vue'
import Control from './control.vue';
import Temperature from './temperature.vue';
import Terminal from './terminal.vue';
import PrinterConfiguration from './printer-configuration.vue';
import GcodeViewer from './gcodeViewer.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'mainContentComponent',
    components: {
        Control,
        Temperature,
        Terminal,
        PrinterConfiguration,
        GcodeViewer
    },
    data: () => ({
        gcodeCommand: '',
    }),
    methods: {
    },
    setup() {
        const { t } = useI18n() // use as global scope
        return { t }
    }
})
</script>

<template>
    <div class="content-container">
        <Tabs value="0">
            <div class="tab-list">
                <TabList>
                    <Tab value="0">{{ $t('main.control')}}</Tab>
                    <Tab value="1">{{ $t('main.temperature')}}</Tab>
                    <Tab value="2">{{ $t('main.terminal')}}</Tab>
                    <Tab value="3">{{ $t('main.printerconfig')}}</Tab>
                    <Tab value="4">{{ $t('main.gcodeviewer')}}</Tab>
                </TabList>
            </div>
            <TabPanels>
                <TabPanel value="0">
                    <div class="control-container">
                        <Control />
                    </div>
                </TabPanel>
                <TabPanel value="1">
                    <div class="temperature-container">
                        <Temperature />
                    </div>
                </TabPanel>
                <TabPanel value="2">
                    <div class="terminal-container">
                        <Terminal />
                    </div>
                </TabPanel>
                <TabPanel value="3">
                    <div class="printer-configs-container">
                        <PrinterConfiguration />
                    </div>
                </TabPanel>
                <TabPanel value="4">
                    <div class="printer-configs-container">
                        <GcodeViewer />
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style scoped>
</style>
