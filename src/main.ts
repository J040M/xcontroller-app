import { createApp } from "vue";

import App from "./App.vue";

import 'primeicons/primeicons.css'
import "./styles.css";

// Theme and styled components
// ONLY import necessary components
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import Button from "primevue/button";
import InputNumber from 'primevue/inputnumber';
import InputGroup from "primevue/inputgroup";
import InputText from "primevue/inputtext";
import Terminal from 'primevue/terminal';

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

import { LineController, LineElement, PointElement, CategoryScale, LinearScale } from "chart.js/auto";
import { i18n } from "./utils/i18n";

const app = createApp(App);
app.use(i18n)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})
// Primevue
.component('Button', Button)
.component('InputNumber', InputNumber)
.component('InputGroup', InputGroup)
.component('InputText', InputText)
.component('Terminal', Terminal)

.component('Accordion', Accordion)
.component('AccordionPanel', AccordionPanel)
.component('AccordionHeader', AccordionHeader)
.component('AccordionContent', AccordionContent)

.component('Tabs', Tabs)
.component('Tab', Tab)
.component('TabList', TabList)
.component('TabPanel', TabPanel)
.component('TabPanels', TabPanels)

.component('Divider', Divider)
.component('Panel', Panel)
// Chart.js
.component('LineController', LineController)
.component('LineElement', LineElement)
.component('PointElement', PointElement)
.component('CategoryScale', CategoryScale)
.component('LinearScale', LinearScale)
// mount App
.mount("#app");
