<script lang="ts">

// import Button from 'primevue/button';
// import InputText from 'primevue/inputtext';
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
    },
})
</script>

<template>



    <Button @click="">Save config</Button>
    
    <!--  -->
    <InputText type="text" placeholder="Gcode command" v-model="gcodeCommand" />
    <Button @click="sendPrinterCommand('GCommand', 'M115')">Get printer information (M115)</Button>

</template>

<style scoped></style>
