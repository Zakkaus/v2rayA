<script setup lang="ts">
// The full-page loading overlay behind useLoading. Mounted once inside
// v-app by the shell.
import { computed } from "vue";
import { loadingState } from "@/composables/useLoading";

const active = computed(() => loadingState.open.size > 0);
</script>

<template>
  <v-overlay
    :model-value="active"
    persistent
    class="align-center justify-center"
    scrim="surface"
  >
    <v-progress-circular indeterminate color="primary" size="48" />
  </v-overlay>
</template>
