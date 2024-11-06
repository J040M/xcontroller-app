<script lang="ts">
import { defineComponent } from 'vue'
import Connector from './components/connector.vue';
import Status from './components/status.vue';
import Main from './components/main/main.vue';
import Files from './components/files.vue';

export default defineComponent({
  name: 'Root',
  components: {
    Connector,
    Status,
    Main,
    Files
  },
  data: () => ({

  }),
})
</script>

<template>
  <div class="main-container">
    <div class="left-container">
      <Accordion multiple>
        <AccordionPanel value="0">
          <AccordionHeader> Connector </AccordionHeader>
          <AccordionContent>
            <div class="left-container-1">
              <Connector />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="1">
          <AccordionHeader> Status </AccordionHeader>
          <AccordionContent>
            <div class="left-container-2">
              <Status />
            </div>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="2">
          <AccordionHeader> Files </AccordionHeader>
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
</template>

<style scoped>
.main-container {
  display: flex;
}

.left-container {
  flex: 1;
  /* Additional styles for left container */
}

.right-container {
  flex: 2;
  /* Adjust as necessary */
  /* Additional styles for right container */
}

.left-container-1,
.left-container-2,
.left-container-3 {
  /* margin-bottom: 16px; */
  /* Spacing between sections */
}
</style>
