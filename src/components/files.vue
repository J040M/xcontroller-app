<script lang="ts">
import { defineComponent } from 'vue'
import { File } from '../types/printer'

export default defineComponent({
    name: 'filesComponent',
    data: () => ({
        files: undefined as File[] | undefined, 
    }),
})
</script>

<template>
    <div class="upload-container">
        <Button label="Upload file" icon="pi pi-upload" />
    </div>

    <!-- Searchbar for file filtering -->
    <div class="file-search-container"></div>

    <div v-if="files" class="file-container" v-for="file of files">
        <label>{{ $t('files.filename') }} {{ file.file_name }}</label><br>
        <label>{{ $t('files.file_modified_date') }} {{ file.file_modified_date }}</label><br>
        <label>{{ $t('files.filesize') }} {{ file.file_size }}</label><br>
        <div class="button-action-group">
            <Button icon="pi pi-arrow-circle-up" />
            <Button icon="pi pi-file" />
            <Button icon="pi pi-trash" />
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
