<script lang="ts">
import { defineComponent } from 'vue';
import { changeLocale } from '../utils/i18n';

export default defineComponent({
    name: 'FooterComponent',
    setup() { return { changeLocale } }
});

</script>

<template>
    <Toolbar class="footer">
        <template #start>
            <span style="margin-right: 5px;">{{ $t('app.name') }}</span>
            <a href="https://github.com/J040M/xcontroller-app" target="_blank" class="pi pi-github" />
            <a href="https://github.com/J040M/xcontroller" target="_blank" class="pi pi-github" />
        </template>

        <template #end>
            <span v-on:click="changeLocale('pt')">PT</span> |
            <span v-on:click="changeLocale('fr')">FR</span> |
            <span v-on:click="changeLocale('en')">EN</span> |
            <span v-on:click="changeLocale('de')">DE</span>
        </template>
    </Toolbar>
</template>

<style scoped>
span {
    margin: 0 5px 0 5px;
    cursor: pointer;
}
</style>
