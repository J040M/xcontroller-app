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
    <div class="px-margin py-margin">
        <div class="border border-outline-variant rounded bg-black overflow-hidden tactical-border">
            <div class="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant">
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse" />
                    <span class="text-[10px] font-label-caps text-primary-fixed-dim uppercase tracking-[0.2em]">Console // GCode</span>
                </div>
                <span class="text-[10px] font-code-sm text-outline">{{ commandHistory.length }} CMDS</span>
            </div>
            <Terminal
                class="terminal-tactical"
                prompt="xcontroller >"
            />
        </div>
    </div>
</template>

<style scoped>
.terminal-tactical {
    height: 700px;
    width: 100%;
    background-color: #000 !important;
    color: #dce4e4;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    padding: 16px;
}

.terminal-tactical :deep(.p-terminal-prompt) {
    color: #00dce5;
    font-weight: 700;
}

.terminal-tactical :deep(.p-terminal-input) {
    color: #dce4e4;
    background: transparent;
    font-family: 'JetBrains Mono', monospace;
}

.terminal-tactical :deep(.p-terminal-command) {
    color: #00f5ff;
}

.terminal-tactical :deep(.p-terminal-response) {
    color: #b9caca;
}
</style>
