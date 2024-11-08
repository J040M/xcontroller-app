<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'statusComponent',
    data: () => ({

    })
})
</script>

<template>
    <label>{{ $t('status.state') }}</label><br>
    <label>{{ $t('status.file') }}</label><br>
    <label>{{ $t('status.elapsed_time') }}</label><br>
    <label>{{ $t('status.estimated_time') }}</label><br>

    <div class="button-action-group">
        <Button label="print" icon="pi pi-play" />
        <Button label="pause" icon="pi pi-pause" />
        <Button label="stop" icon="pi pi-stop" />
    </div>
</template>

<style scoped>
button {
    margin: 5px 5px 5px 0px;
}
</style>
