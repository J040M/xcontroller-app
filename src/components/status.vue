<script lang="ts">
import {  defineComponent } from 'vue'

export default defineComponent({
    name: 'statusComponent',
    data: () => ({
        gcodeCommand: '',
    }),
    methods: {
    },
})
</script>

<template>
    <label>State:</label><br> 
    <label>File:</label><br>
    <label>Elapsed time:</label><br>
    <label>Estimated time:</label><br>

    <div class="button-action-group">
        <Button label="print" icon="pi pi-play"/>
        <Button label="pause" icon="pi pi-pause"/>
        <Button label="stop" icon="pi pi-stop"/>
    </div>
</template>

<style scoped>
</style>
