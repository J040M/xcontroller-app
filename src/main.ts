import { createApp } from "vue";
import App from "./App.vue";

import 'primeicons/primeicons.css'
import "./styles.css";

/**
 * PrimeVue theme configuration
 */
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

/**
 * Tactical preset: re-skins Aura to the Industrial Cyberpunk tokens so that
 * stock PrimeVue components (Button, Dialog, Select, DataTable, Knob, Chart,
 * Terminal) render with the new palette without per-component overrides.
 * Per-component PassThrough refinements land in later PRs.
 */
const TacticalAura = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#e9feff',
            100: '#d6fbfd',
            200: '#a8f5fa',
            300: '#63f7ff',
            400: '#00f5ff',
            500: '#00dce5',
            600: '#00b8c0',
            700: '#00696e',
            800: '#004f53',
            900: '#003739',
            950: '#002021',
        },
        colorScheme: {
            dark: {
                surface: {
                    0: '#dce4e4',
                    50: '#b9caca',
                    100: '#849495',
                    200: '#3a494a',
                    300: '#2e3637',
                    400: '#232b2c',
                    500: '#192121',
                    600: '#151d1d',
                    700: '#0d1515',
                    800: '#081010',
                    900: '#040808',
                    950: '#000000',
                },
            },
        },
    },
});

import Button from "primevue/button";
import InputNumber from 'primevue/inputnumber';
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import Terminal from 'primevue/terminal';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';

/**
 * Chart.js Components
 */
import Chart from "primevue/chart";

/**
 * Application Services
 */
import { i18n } from "./utils/i18n";

/**
 * Create and configure Vue application instance
 * Register all required components and plugins
 */
const app = createApp(App);

// Register core plugins
app.use(i18n)
app.use(PrimeVue, {
    theme: {
        preset: TacticalAura,
        options: {
            darkModeSelector: '.dark',
        },
    },
    ripple: false,
})

// Register PrimeVue components
    .component('Button', Button)
    .component('InputNumber', InputNumber)
    .component('InputGroup', InputGroup)
    .component('InputText', InputText)
    .component('Terminal', Terminal)

    .component('Tab', Tab)
    .component('Tabs', Tabs)
    .component('TabList', TabList)
    .component('TabPanel', TabPanel)
    .component('TabPanels', TabPanels)

    .component('Dialog', Dialog)
    .component('Select', Select)

    .component('Chart', Chart)

// Mount the application
    .mount("#app");
