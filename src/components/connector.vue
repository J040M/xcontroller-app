<script lang="ts">
import { defineComponent } from 'vue'
import { wsClient } from '../init/client';

export default defineComponent({
    name: 'connectorComponent',
    data: () => ({
        websocketURL: null as string | null,
        connectionStatus: false as boolean,
    }),
    setup() {
        return { wsClient }
    },
    mounted() {
        // Get wsURL from local storage
        this.websocketURL = localStorage.getItem('wsURL')
        
        // Set connection status on events
        wsClient.on('connected', () => this.connectionStatus = true)
        wsClient.on('disconnected', () => this.connectionStatus = false)
    },
    methods: {
        setWSURL(): void {
            if (!this.websocketURL) return
            // Update storage and set wsClient URL
            localStorage.setItem('wsURL', this.websocketURL)
            wsClient.wsURL = this.websocketURL
        }
    }
})
</script>

<template>
    <div class="horizontal-container">
        <InputText type="text" placeholder="ws://websocket-server-url:port" @focusout="setWSURL" v-model="websocketURL"
            style="flex: 1; margin-right: 10px;" />
        <Button v-if="!connectionStatus" icon="pi pi-power-off" style="color: red" @click="wsClient.connect()" />
        <Button v-else icon="pi pi-power-off" style="color: green" @click="wsClient.disconnect()" />
    </div>
</template>

<style scoped>
.horizontal-container {
    display: flex;
    align-items: center;
}

button {
    margin: 5px 5px 5px 0px;
}
</style>
