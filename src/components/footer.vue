<script lang="ts">
import { defineComponent } from 'vue';
import { changeLocale } from '../utils/i18n';

export default defineComponent({
    name: 'FooterComponent',
    setup() { return { changeLocale } }
});
</script>

<template>
    <footer
        class="h-10 shrink-0 border-t border-outline-variant bg-surface-container flex items-center justify-between px-4"
    >
        <div class="flex items-center gap-3">
            <span class="font-headline-md text-base text-on-surface">{{ $t('app.name') }}</span>
            <a
                href="https://github.com/J040M/xcontroller-app"
                target="_blank"
                rel="noopener"
                class="pi pi-github text-primary-fixed-dim hover:text-primary-fixed transition-colors"
            />
            <a
                href="https://github.com/J040M/xcontroller"
                target="_blank"
                rel="noopener"
                class="pi pi-github text-secondary-container hover:text-secondary transition-colors"
            />
        </div>

        <div class="font-label-caps text-on-surface-variant tracking-widest flex items-center gap-2">
            <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('pt')">PT</button>
            <span class="text-outline-variant">|</span>
            <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('fr')">FR</button>
            <span class="text-outline-variant">|</span>
            <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('en')">EN</button>
            <span class="text-outline-variant">|</span>
            <button class="hover:text-primary-fixed-dim transition-colors" @click="changeLocale('de')">DE</button>
        </div>
    </footer>
</template>
