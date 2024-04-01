<script setup lang="ts">
import { ref } from 'vue';

let socket: WebSocket | null = null;
const websocketUrl = ref('');
const gcodeCommand = ref('');

function connectSocketServer() {
  // if (!websocketUrl.value) {
  //   console.error('Websocket URL is required');
  //   return;
  // }

  socket = new WebSocket(websocketUrl.value || 'ws://127.0.0.1:9002');

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket closed');
  };
}

function sendCommand(type: string, command: string) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    return;
  }

  const message = {
    message_type: type,
    message: command
  }

  socket.send(JSON.stringify(message));
}
</script>

<template>
  <div class="container">
    <h1>Websocket connection</h1>

    <input type="text" placeholder="ws://websocket-server-url:port" v-model="websocketUrl" />
    <button @click="connectSocketServer">Connect</button>
    <button @click="socket?.close()">Abort connection</button>

    <input type="text" placeholder="Gcode command" v-model="gcodeCommand" />
    <button @click="sendCommand('Information', gcodeCommand)">Send Command</button>
    <button @click="sendCommand('Information', 'M115')">Get information</button>

    <div id="remove-controller">
      <!-- <input type="radio" id="one-v" name="move-length" /><label for="one">1</label>
      <input type="radio" id="ten-v" name="move-length" /><label for="ten">10</label>
      <input type="radio" id="hundred-v" name="move-length" /><label for="hundred">100</label> -->

      <button @click="sendCommand('Movement', 'G1 X10')">Forward</button>
      <button @click="sendCommand('Movement', 'G1 X-10')">Left</button>
      <button @click="sendCommand('Movement', 'G1 Y10')">Right</button>
      <button @click="sendCommand('Movement', 'G1 Y-10')">Backwards</button>
      <button @click="sendCommand('Movement', 'G1 Z10')">Up</button>
      <button @click="sendCommand('Movement', 'G1 Z-10')">Down</button>
    </div>
  </div>
</template>

<style scoped>
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #249b73);
}
</style>
