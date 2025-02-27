<script lang="ts">
import { defineComponent } from 'vue'
import Connector from './components/connector.vue';
import Status from './components/status.vue';
import Main from './components/main/main.vue';
import Files from './components/files.vue';
import FooterComponent from './components/footer.vue';

import { eventBus } from './utils/eventbus';
import { useI18n } from 'vue-i18n';
import { changeLocale } from './utils/i18n';

export default defineComponent({
  name: 'Root',
  components: {
    Connector,
    Status,
    Main,
    Files,
    FooterComponent
  },
  data: () => ({
    openedAccordion: '' as string,
    errorMessageDialog: false as boolean
  }),
  mounted() {
    eventBus.on('message', (message: string) => {
      if (message === 'openConnectionErrorDialog') {
        this.errorMessageDialog = true
      }
    })
  },
  setup() {
    const { t } = useI18n() // use as global scope
    return { t, changeLocale }
  }
})
</script>

<template>
  <Dialog :visible="errorMessageDialog" modal :header="$t('error_message.header')" :style="{ width: '25rem' }" :closable="false"
    optionLabel="name" optionValue="url">
    <p class="mb-0">{{ $t('error_message.connection_error') }}</p>
    <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="errorMessageDialog = false"></Button>
        </div>
  </Dialog>
  <div class="main-container">
    <div class="content-wrapper">
      <div class="left-container">
        <Accordion :value="openedAccordion" multiple>
          <AccordionPanel value="0">
            <AccordionHeader> {{ $t('app.connector') }} </AccordionHeader>
            <AccordionContent>
              <div class="left-container-1">
                <Connector />
              </div>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="1">
            <AccordionHeader> {{ $t('app.status') }} </AccordionHeader>
            <AccordionContent>
              <div class="left-container-2">
                <Status />
              </div>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="2">
            <AccordionHeader> {{ $t('app.files') }} </AccordionHeader>
            <AccordionContent>
              <div class="left-container-3">
                <Files />
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>

      <Divider layout="vertical" />
      <div class="right-container">
        <Main />
      </div>
    </div>

    <FooterComponent />
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.content-wrapper {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
}

.left-container {
  flex: 0 0 300px;
  overflow-y: auto;
}

.right-container {
  flex: 1;
  overflow-y: auto;
}

.footer {
  flex: 0 0 auto;
}
</style>
