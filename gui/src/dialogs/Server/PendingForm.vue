<script setup lang="ts">
// Stands in for a protocol form that is not written yet. Never shipped:
// the redo merges once every form below is real.
defineProps<{ protocol: string }>();
</script>

<template>
  <v-alert type="warning" variant="tonal" density="compact" class="my-2">
    {{ protocol }}: form pending
  </v-alert>
</template>
