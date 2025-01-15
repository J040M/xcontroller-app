<script lang="ts">
import { defineComponent } from 'vue'
import { printer } from '../init/client'
import type { File } from '../types/printer'

export default defineComponent({
    name: 'filesComponent',
    setup() {
        return printer
    },
    data: () => ({
        files: undefined as File[] | undefined, 
    }) 
})
</script>

<template>
    <div class="upload-container">
        <Button label="Upload file" icon="pi pi-upload" />
    </div>

    <!-- TODO: Searchbar for file filtering -->
    <div class="file-search-container"></div>

    <div v-if="files" class="file-container" v-for="file of files">
        <label>{{ $t('files.filename') }} {{ file.file_name }}</label><br>
        <label>{{ $t('files.file_modified_date') }} {{ file.file_modified_date }}</label><br>
        <label>{{ $t('files.filesize') }} {{ file.file_size }}</label><br>
        <div class="button-action-group">
            <Button v-on:click="selectFile(file.file_size)" icon="pi pi-arrow-circle-up" />
            <Button v-on:click="deleteFile(file.file_name)" icon="pi pi-trash" />
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
