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
            // TODO: This will change in the future. parser20() will return an
            // object instead of an array.
            files.value = raw.replace(/[\[\]"]/g, '').split(',').map((s) => s.trim())
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
    <div class="upload-container">
        <Button @click="listFiles()" :loading="loadingStatus" icon="pi pi-refresh" size="small" />
        <!-- <input type="file" @change="readFile" /> -->
    </div>

    <!-- TODO: Searchbar for file filtering -->
    <div class="file-search-container"></div>

    <div v-if="files" class="file-container" v-for="file of files">
        <label> {{ file }}</label><br>
        <!-- <label>{{ $t('files.filename') }} {{ file.file_name }}</label><br>
        <label>{{ $t('files.file_modified_date') }} {{ file.file_modified_date }}</label><br>
        <label>{{ $t('files.filesize') }} {{ file.file_size }}</label><br> -->
        <div class="button-action-group">
            <Button v-on:click="printer.selectFile(file)" icon="pi pi-arrow-circle-up" />
            <Button v-on:click="deleteFile(file)" icon="pi pi-trash" />
            <!-- <Button icon="pi pi-file" /> -->
        </div>
    </div>
    <div v-else>
        <label>{{ $t('files.no_files') }}</label>
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}

.file-container {
    margin: 0px 0px 10px 0px;
}

.upload-container {
    margin: 0px 0px 10px 0px;
}
</style>
