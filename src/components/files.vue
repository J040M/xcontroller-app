<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'filesComponent',
    methods: {
    },
    setup() {
        const { t } = useI18n() // use as global scope
        return { t }
    }
})
</script>

<template>
    <div class="file-search-container"></div>
    <Button label="Upload" icon="pi pi-upload" />

    <!-- Forloop here -->
    <div class="file-container">
        <!-- <div class="file-container" v-for=""> -->
        <label>{{ $t('files.filename') }} {{ file_name }}</label><br>
        <label>{{ $t('files.file_modified_date') }} {{ file_modified_date }}</label><br>
        <label>{{ $t('files.filesize') }} {{ file_size }}</label><br>
        <div class="button-action-group">
            <Button icon="pi pi-arrow-circle-up" />
            <Button icon="pi pi-file" />
            <Button icon="pi pi-download" />
            <Button icon="pi pi-trash" />
        </div>
        <p>---------------------------</p>
    </div>
</template>

<style scoped></style>
