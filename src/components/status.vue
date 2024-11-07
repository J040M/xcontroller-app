<script lang="ts">
import {  defineComponent } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
    name: 'statusComponent',
    data: () => ({
        gcodeCommand: '',
    }),
    methods: {
    },
    setup() {
        const { t } = useI18n() // use as global scope
        return { t }
    }
})
</script>

<template>
    <label>{{ $t('status.state') }}</label><br> 
    <label>{{ $t('status.file') }}</label><br> 
    <label>{{ $t('status.elapsed_time') }}</label><br> 
    <label>{{ $t('status.estimated_time') }}</label><br>

    <div class="button-action-group">
        <Button label="print" icon="pi pi-play"/>
        <Button label="pause" icon="pi pi-pause"/>
        <Button label="stop" icon="pi pi-stop"/>
    </div>
</template>

<style scoped>
</style>
