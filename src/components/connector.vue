<script lang="ts">
import { defineComponent } from 'vue'
import { wsClient } from '../init/client';

export default defineComponent({
    name: 'connectorComponent',
    data: () => ({
        websocketURL: null as string | null,
        connectionStatus: false as boolean,
    }),
    mounted() {
        this.websocketURL = localStorage.getItem('wsURL')
    },
    methods: {
        async connectToPrinter() {
            await wsClient.openConnection()
            this.connectionStatus = wsClient.connectionStatus
        },
        async disconnectFromPrinter() {
            await wsClient.closeConnection()
        },
        updatewsURL() {
            if (!this.websocketURL) return
            wsClient.wsURL = this.websocketURL
        }
    }
})

</script>

<template>
    <label><b>{{ $t('connector.status') }}</b> {{ connectionStatus }}</label><br><br>
    <InputText type="text" placeholder="ws://websocket-server-url:port" @focusout="updatewsURL" v-model="websocketURL"
        style="width: 100%;" /><br>
    <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" @click="connectToPrinter"></Button>
    <Button v-else icon="pi pi-power-off" style="color: green" @click="disconnectFromPrinter"></Button>
    <!-- <Button icon="pi-power-off" @click="connectToPrinter">{{ $t('connector.connect') }}</Button> -->
    <!-- <Button @click="disconnectFromPrinter">{{ $t('connector.disconnect') }}</Button> -->
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
