<script setup lang="ts">
import { mdiCheck } from "@mdi/js";
import { rowKey, type Row } from "../nodes/model";

defineProps<{
  rows: Row[];
  isSelected: (row: Row) => boolean;
  disabled: boolean;
}>();
defineEmits<{ toggle: [row: Row] }>();
</script>

<template>
  <div class="d-flex flex-wrap ga-2">
    <v-chip
      v-for="row in rows"
      :key="rowKey(row)"
      class="node-chip"
      :color="isSelected(row) ? 'primary' : undefined"
      :variant="isSelected(row) ? 'tonal' : 'outlined'"
      :prepend-icon="isSelected(row) ? mdiCheck : undefined"
      :aria-pressed="isSelected(row)"
      :disabled="disabled"
      @click="$emit('toggle', row)"
    >
      <span class="node-chip__name">{{ row.name || row.address }}</span>
      <span v-if="row.pingLatency" dir="ltr" class="ms-2 md3-label-medium">
        {{ row.pingLatency }}
      </span>
    </v-chip>
  </div>
</template>

<style scoped>
.node-chip {
  max-width: 100%;
  min-height: 40px;
  height: auto;
  padding-block: 8px;
}
.node-chip__name {
  overflow-wrap: anywhere;
  white-space: normal;
}
.node-chip :deep(.v-chip__content) {
  min-width: 0;
}
</style>
