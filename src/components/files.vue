<script lang="ts">
import { defineComponent, ref } from 'vue'
import { printer } from '../init/client'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';

export default defineComponent({
    name: 'filesComponent',
    setup() {
        const files = ref<string[] | undefined>(undefined)
        const loadingStatus = ref(false)

        useListener(eventBus, 'printer:m20', (raw: string) => {
            loadingStatus.value = false
            files.value = raw.replace(/[\[\]"]/g, '').split(',').map((s) => s.trim()).filter(Boolean)
        })

        useListener(eventBus, 'message', (message: string) => {
            if (message === 'openConnectionErrorDialog') {
                loadingStatus.value = false
            }
        })

        function listFiles(): void {
            loadingStatus.value = true
            printer.listFiles()
        }

        function readFile(event: Event): void {
            const input = event.target as HTMLInputElement | null
            if (!input || !input.files) return
            const file = input.files[0]

            const reader = new FileReader()
            reader.onload = (e) => {
                const fileContent = ';' + file.name + '\n' + (e.target?.result as string)
                printer.uploadFile(fileContent)
            }
            reader.readAsText(file)
        }

        function deleteFile(name: string): void {
            printer.deleteFile(name)
            printer.listFiles()
        }

        return { printer, files, loadingStatus, listFiles, readFile, deleteFile }
    },
})
</script>

<template>
    <div class="flex flex-col gap-3 px-4 py-3">
        <div class="flex items-center justify-between">
            <button
                @click="listFiles()"
                :disabled="loadingStatus"
                class="w-8 h-8 rounded bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center hover:brightness-110 disabled:opacity-50 shadow-[0_0_10px_rgba(0,220,229,0.3)] transition-all"
            >
                <span class="material-symbols-outlined" :class="{ 'animate-spin': loadingStatus }">refresh</span>
            </button>
            <span class="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Local Storage</span>
        </div>

        <div v-if="files && files.length" class="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            <div
                v-for="file in files"
                :key="file"
                class="group bg-surface-container-low border border-outline-variant/40 p-3 rounded-sm hover:border-primary-fixed-dim/50 transition-all"
            >
                <div class="flex justify-between items-start gap-2 mb-2">
                    <span
                        class="font-code-sm text-on-surface truncate"
                        :title="file"
                    >{{ file }}</span>
                    <div class="flex items-center gap-1 shrink-0">
                        <button
                            @click="printer.selectFile(file)"
                            class="text-primary-fixed-dim hover:text-primary-fixed transition-colors"
                            :title="$t('files.no_files')"
                        >
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                        <button
                            @click="deleteFile(file)"
                            class="text-on-surface-variant hover:text-error transition-colors"
                        >
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-label-caps text-on-surface-variant">—</span>
                    <span class="text-[10px] font-label-caps text-on-surface-variant/50">—</span>
                </div>
            </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2 py-4 text-on-surface-variant">
            <span class="material-symbols-outlined text-2xl">folder_off</span>
            <span class="font-label-caps uppercase tracking-widest text-[10px]">{{ $t('files.no_files') }}</span>
        </div>
    </div>
</template>
