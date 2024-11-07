<script lang="ts">
import { defineComponent } from 'vue'
import { wsClient } from '../init/client';

export default defineComponent({
    name: 'connectorComponent',
    data: () => ({
        gcodeCommand: '',
        websocketURL: null as string | null,
        connectionStatus: false as boolean
    }),
    mounted() {
        this.websocketURL = localStorage.getItem('wsURL')
        this.connectionStatus = wsClient.connectionStatus
    },
    methods: {
        connectSocketServer() {
            wsClient.openConnection()
        },
        disconnectSocketServer() {
            wsClient.closeConnection()
        },
        updatewsURL() {
            if (!this.websocketURL) return
            wsClient.wsURL = this.websocketURL
        }
    }
})

</script>

<template>
    <label>{{ $t('connector.status')}} {{ connectionStatus }}</label><br>
    <InputText type="text" placeholder="ws://websocket-server-url:port" 
        @focusout="updatewsURL"
        v-model="websocketURL" 
        style="width: 100%;"/><br>
    <Button @click="connectSocketServer">{{ $t('connector.connect')}}</Button>
    <Button @click="disconnectSocketServer">{{ $t('connector.disconnect')}}</Button>
</template>

<style scoped></style>
