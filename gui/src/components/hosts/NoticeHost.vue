<script setup lang="ts">
// Renders the notice queue: one snackbar, the next when it ends. Mounted
// once inside v-app by the shell.
import { computed } from "vue";
import {
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiCheckCircleOutline,
  mdiInformationOutline,
} from "@mdi/js";
import { dismissNotice, noticeState } from "@/composables/useNotify";

const current = computed(() => noticeState.current);
// Material's snackbar: inverse surface, the action in inverse primary; the
// kind shows in a leading icon, so every notice follows the theme
const icons = {
  info: mdiInformationOutline,
  success: mdiCheckCircleOutline,
  warning: mdiAlertOutline,
  error: mdiAlertCircleOutline,
};
const iconColors = {
  info: "inverse-primary",
  success: "inverse-primary",
  warning: "error",
  error: "error",
};
const shown = computed({
  get: () => current.value !== null,
  set: (v: boolean) => {
    if (!v && current.value) dismissNotice(current.value.id);
  },
});
</script>

<template>
  <v-snackbar
    v-if="current"
    :key="current.id"
    v-model="shown"
    :timeout="current.timeout || -1"
    color="inverse-surface"
    location="bottom"
    variant="flat"
    rounded="lg"
  >
    <div class="d-flex align-center ga-3">
      <v-icon
        :icon="icons[current.kind]"
        :color="iconColors[current.kind]"
        size="20"
      />
      <span class="md3-body-medium">{{ current.text }}</span>
    </div>
    <template v-if="current.action" #actions>
      <v-btn
        variant="text"
        color="inverse-primary"
        @click="
          current.action.onClick();
          dismissNotice(current.id);
        "
        >{{ current.action.label }}</v-btn
      >
    </template>
  </v-snackbar>
</template>
