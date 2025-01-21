<script lang="ts">
import { defineComponent } from 'vue'
import { printer } from '../init/client'

export default defineComponent({
    name: 'statusComponent',
    setup() {
        return { printer }
    },
})
</script>

<template>
    <div v-if="printer.printerInfo.printStatus">
        <label>{{ $t('status.state') }}</label>{{ printer.printerInfo.printStatus.state }} <br>
        <label>{{ $t('status.file') }}</label> {{ printer.printerInfo.printStatus.file.file_name }}<br>
        <label>{{ $t('status.elapsed_time') }}</label> {{ printer.printerInfo.printStatus.elapsed_time }}<br>
        <label>{{ $t('status.estimated_time') }}</label>{{ printer.printerInfo.printStatus.estimated_time }}<br>
    
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
