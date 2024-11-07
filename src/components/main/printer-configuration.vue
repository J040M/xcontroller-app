<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'printerConfigurationComponent',
    data: () => ({
        gcodeCommand: '',
    }),

    methods: {
        sendPrinterCommand(type: string, movement: string) {
            console.log('sendPrinterCOmmand ', type, movement)
        }
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
