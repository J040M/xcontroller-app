<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import TerminalService from 'primevue/terminalservice'
import { printer } from '../../init/client';
import { eventBus } from '../../utils/eventbus';
import { useListener } from '../../utils/listeners';
import { gcommands_list } from '../../assets/terminal_commands';

export default defineComponent({
    name: 'terminalComponent',
    setup() {
        const commandHistory = ref<string[]>([])

        function commandHandler(command: string): void {
            commandHistory.value.push(command)

            switch (command) {
                case 'help':
                    TerminalService.emit('response', "Available commands: <help> \n <gcommands> (list of commands)")
                    return
                case 'gcommands':
                    TerminalService.emit('response', gcommands_list)
                    return
            }

            printer.terminalCommand(command)
        }

        onMounted(() => TerminalService.on('command', commandHandler))
        onBeforeUnmount(() => TerminalService.off('command', commandHandler))

        useListener(eventBus, 'terminal:line', (line: string) => {
            TerminalService.emit('response', line)
        })

        return { commandHistory }
    },
})
</script>

<template>
    <Terminal class="terminal" prompt="xcontroller $ " />
</template>

<style scoped>
.terminal {
    height: 750px;
    width: 100%;
}
</style>
