<script lang="ts">
import { defineComponent, ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { printer, getTransport } from '../init/client'
import { eventBus } from '../utils/eventbus';
import { useListener } from '../utils/listeners';
import UsbTransport from '../transport/UsbTransport';
import { uploadFile, uploadFileFromPath } from '../utils/upload';

export default defineComponent({
    name: 'filesComponent',
    setup() {
        const files = ref<string[] | undefined>(undefined)
        const loadingStatus = ref(false)

        // Binary upload state. `uploading` gates the UI; `uploadPercent`
        // tracks server-reported progress against the source file size.
        const fileInput = ref<HTMLInputElement | null>(null)
        const uploading = ref(false)
        const uploadPercent = ref(0)
        const uploadFilename = ref('')
        const uploadError = ref<string | null>(null)
        // USB uploads can't compute a percentage (the file's total size isn't
        // known to the webview), so they show an indeterminate bar instead.
        const uploadIndeterminate = ref(false)

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

        async function triggerFilePicker(): Promise<void> {
            uploadError.value = null
            const transport = getTransport()
            if (transport instanceof UsbTransport) {
                // Native app over USB: pick a real file path and hand it to
                // the Rust side, which owns the binary transfer. The browser
                // <input> never exposes a filesystem path, so it can't be used.
                const selected = await open({
                    multiple: false,
                    filters: [{ name: 'G-code', extensions: ['gco', 'gcode', 'g'] }],
                })
                if (typeof selected !== 'string') return
                const name = selected.split(/[\\/]/).pop() ?? selected
                await runUsbUpload(selected, name)
                return
            }
            // Web build / WebSocket link: the hidden <input> streams a File.
            fileInput.value?.click()
        }

        async function runUsbUpload(path: string, name: string): Promise<void> {
            uploadFilename.value = name
            uploadPercent.value = 0
            uploadIndeterminate.value = true
            uploading.value = true
            try {
                await uploadFileFromPath(path, name)
                uploadPercent.value = 100
                // Refresh the listing so the freshly uploaded file shows up.
                printer.listFiles()
            } catch (e) {
                uploadError.value = e instanceof Error ? e.message : String(e)
            } finally {
                uploading.value = false
                uploadIndeterminate.value = false
            }
        }

        async function readFile(event: Event): Promise<void> {
            const input = event.target as HTMLInputElement | null
            const file = input?.files?.[0]
            // Clear the input so picking the same file again still fires change.
            if (input) input.value = ''
            if (!file) return

            uploadError.value = null
            uploadFilename.value = file.name
            uploadPercent.value = 0
            uploading.value = true

            const total = file.size
            try {
                await uploadFile(file, {
                    onProgress: (progress) => {
                        uploadPercent.value = total > 0
                            ? Math.min(100, Math.round((progress.source_bytes / total) * 100))
                            : 0
                    },
                })
                uploadPercent.value = 100
                // Refresh the listing so the freshly uploaded file shows up.
                printer.listFiles()
            } catch (e) {
                uploadError.value = e instanceof Error ? e.message : String(e)
            } finally {
                uploading.value = false
            }
        }

        function deleteFile(name: string): void {
            printer.deleteFile(name)
            printer.listFiles()
        }

        return {
            printer, files, loadingStatus,
            fileInput, uploading, uploadPercent, uploadFilename, uploadError, uploadIndeterminate,
            listFiles, triggerFilePicker, readFile, deleteFile,
        }
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

        <!-- Upload to SD card -->
        <div class="flex flex-col gap-2">
            <input
                ref="fileInput"
                type="file"
                accept=".gco,.gcode,.g"
                class="hidden"
                @change="readFile"
            />
            <button
                @click="triggerFilePicker()"
                :disabled="uploading || !printer.printerInfo.status"
                class="flex items-center justify-center gap-2 h-8 rounded border border-primary-fixed-dim text-primary-fixed-dim text-[10px] font-label-caps uppercase tracking-wider transition-colors hover:bg-primary-fixed-dim/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': uploading }">
                    {{ uploading ? 'progress_activity' : 'upload' }}
                </span>
                <span>{{ $t('files.upload') }}</span>
            </button>

            <div v-if="uploading" class="flex flex-col gap-1">
                <div class="flex justify-between items-center text-[10px] font-label-caps text-on-surface-variant">
                    <span class="truncate pr-2" :title="uploadFilename">{{ uploadFilename }}</span>
                    <span v-if="!uploadIndeterminate" class="shrink-0">{{ uploadPercent }}%</span>
                </div>
                <div class="h-1.5 bg-surface-container rounded overflow-hidden">
                    <div
                        v-if="uploadIndeterminate"
                        class="h-full w-1/3 bg-primary-fixed-dim animate-pulse"
                    />
                    <div
                        v-else
                        class="h-full bg-primary-fixed-dim transition-all duration-150"
                        :style="{ width: uploadPercent + '%' }"
                    />
                </div>
            </div>

            <p v-if="uploadError" class="text-[10px] font-code-sm text-error">{{ uploadError }}</p>
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
