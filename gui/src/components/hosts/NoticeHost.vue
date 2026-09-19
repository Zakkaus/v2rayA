<script setup lang="ts">
// Renders the notice queue: one snackbar, the next when it ends. Mounted
// once inside v-app by the shell.
import { computed } from "vue";
import { dismissNotice, noticeState } from "@/composables/useNotify";

const current = computed(() => noticeState.current);
const color = computed(
  () =>
    ({
      info: "surface-variant",
      success: "secondary-container",
      warning: "tertiary-container",
      error: "error-container",
    })[current.value?.kind ?? "info"],
);
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
    :color="color"
    location="top"
    variant="flat"
    rounded="lg"
  >
    <span class="md3-body-medium">{{ current.text }}</span>
    <template v-if="current.action" #actions>
      <v-btn
        variant="text"
        @click="
          current.action.onClick();
          dismissNotice(current.id);
        "
        >{{ current.action.label }}</v-btn
      >
    </template>
  </v-snackbar>
</template>
