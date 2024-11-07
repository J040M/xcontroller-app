<script lang="ts">

// import Button from 'primevue/button';
// import InputText from 'primevue/inputtext';
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'printerConfigurationComponent',
    data: () => ({
        gcodeCommand: '',
    }),

    methods: {
        sendPrinterCommand(type: string, movement: string) {
            console.log('sendPrinterCOmmand ', type, movement)

        }
    },
    setup() {
        const { t } = useI18n() // use as global scope
        return { t }
    }
})
</script>

<template>
    <!--  -->
    <InputText type="text" placeholder="Gcode command" v-model="gcodeCommand" />
    <Button @click="">{{ $t('printerconfig.btn_save') }}</Button>

    <Button @click="sendPrinterCommand('GCommand', 'M115')">{{ $t('printerconfig.btn_M115') }}</Button>

</template>

<style scoped></style>
