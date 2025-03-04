<script lang="ts">
import { defineComponent } from 'vue'
import { printer, wsClient } from '../init/client'
import { eventBus } from '../utils/eventbus';
import { MessageResponse } from '../types/messages';

export default defineComponent({
    name: 'filesComponent',
    data: () => ({
        files: undefined as string[] | undefined,
        loadingStatus: false as boolean,
    }),
    mounted() {
        wsClient.on('message', (incomingMessage: MessageEvent) => {
            const message: MessageResponse = JSON.parse(incomingMessage.data)

            if (message.message_type === 'M20') {
                this.loadingStatus = false
                // TODO: This will change in the future. parser20() will return an obj instead of an array
                this.files = message.message.replace(/[\[\]"]/g, '').split(',')
                    .map((item: string) => item.trim());
            }
        })
        eventBus.on('message', (message: string) => {
            if (message === 'openConnectionErrorDialog') {
                this.loadingStatus = false
            }
        })
    },
    methods: {
        /**
         * List all files on the printer
         * loadingStatus is set to true to show a loading spinner
         * @return void
         */
        listFiles(): void {
            this.loadingStatus = true
            printer.listFiles()
        },
        /**
         * Read the content of the gcode file
         * Prefix the content with the filename for backend processing
         * @param {Event} event 
         * @return void
         */
        readFile(event: Event): void {
            const input = event.target as HTMLInputElement || null;
            if (!input || !input.files) return;

            const file = input.files[0];

            const reader = new FileReader()
            reader.onload = function (e) {
                let fileContent = e.target?.result as string
                fileContent = ';' + file.name + '\n' + fileContent

                printer.uploadFile(fileContent)
            }
            reader.readAsText(file)
        },
        /**
         * Delete a file from the printer
         * @param {string} file 
         * @return void
         */
        deleteFile(file: string): void {
            printer.deleteFile(file)
            printer.listFiles()
        },
    },
    setup() {
        return { printer }
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
