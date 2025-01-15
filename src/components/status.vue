<script lang="ts">
import { defineComponent } from 'vue'
import type { PrintStatus } from '../types/printer'

export default defineComponent({
    name: 'statusComponent',
    data: () => ({
        status: undefined as PrintStatus | undefined,
    })
})
</script>

<template>
    <div v-if="status">
        <label>{{ $t('status.state') }}</label>{{ status.state }} <br>
        <label>{{ $t('status.file') }}</label> {{ status.file }}<br>
        <label>{{ $t('status.elapsed_time') }}</label> {{ status.elapsed_time }}<br>
        <label>{{ $t('status.estimated_time') }}</label>{{ status.estimated_time }}<br>
    
        <div class="button-action-group">
            <Button label="print" icon="pi pi-play" />
            <Button label="pause" icon="pi pi-pause" />
            <Button label="stop" icon="pi pi-stop" />
        </div>
    </div>
    <div v-else>
        <label>{{ $t('status.no_status') }}</label>
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
