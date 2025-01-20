import { createApp } from "vue";
import App from "./App.vue";

import 'primeicons/primeicons.css'
import "./styles.css";

/**
 * PrimeVue theme configuration
 */
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import Button from "primevue/button";
import InputNumber from 'primevue/inputnumber';
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import Terminal from 'primevue/terminal';
import AutoComplete from 'primevue/autocomplete';

import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import Knob from 'primevue/knob';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';

/**
 * Chart.js Components
 */
// import { LineController, LineElement, PointElement, CategoryScale, LinearScale } from "chart.js/auto";
import Chart from "primevue/chart";

/**
 * Application Services
 */
import { i18n } from "./utils/i18n";
import { init } from "./init/init";

// Initialize application defaults
init();

/**
 * Create and configure Vue application instance
 * Register all required components and plugins
 */
const app = createApp(App);

// Register core plugins
app.use(i18n)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})

// Register PrimeVue components
    .component('Button', Button)
    .component('InputNumber', InputNumber)
    .component('InputGroup', InputGroup)
    .component('InputText', InputText)
    .component('Terminal', Terminal)
    .component('AutoComplete', AutoComplete)

    .component('Accordion', Accordion)
    .component('AccordionPanel', AccordionPanel)
    .component('AccordionHeader', AccordionHeader)
    .component('AccordionContent', AccordionContent)

    .component('Tab', Tab)
    .component('Tabs', Tabs)
    .component('TabList', TabList)
    .component('TabPanel', TabPanel)
    .component('TabPanels', TabPanels)

    .component('Divider', Divider)
    .component('Panel', Panel)
    .component('Knob', Knob)
    .component('Dialog', Dialog)
    .component('Select', Select)
    .component('Toolbar', Toolbar)

    .component('Chart', Chart)

// Mount the application
    .mount("#app");
