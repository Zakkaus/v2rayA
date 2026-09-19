<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { mdiCheck } from "@mdi/js";
import type { Row } from "../nodes/model";
import type { NodeAction } from "./model";
import NodeLatency from "./NodeLatency.vue";
import NodeMenu from "./NodeMenu.vue";
defineOptions({ name: "NodeCard" });
defineProps<{
  row: Row;
  source: string;
  member: boolean;
  selected: boolean;
  inUse: boolean;
  disabled: boolean;
  testing: boolean;
}>();
const emit = defineEmits<{ toggle: []; action: [action: NodeAction] }>();
const { t } = useI18n();
</script>
<template>
  <v-card
    rounded="lg"
    :color="member ? 'secondary-container' : 'surface-container-low'"
    class="node-card pa-4"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-pressed="member"
    :aria-disabled="disabled"
    @click="!disabled && emit('toggle')"
    @keydown.enter.self.prevent="!disabled && emit('toggle')"
    @keydown.space.self.prevent="!disabled && emit('toggle')"
  >
    <div class="d-flex align-start ga-2">
      <v-icon v-if="member" :icon="mdiCheck" size="20" />
      <h3 class="node-card__name md3-title-small" dir="auto">{{ row.name }}</h3>
      <v-chip v-if="inUse" size="small" variant="tonal" class="flex-shrink-0">{{
        t("proxies.inUse")
      }}</v-chip>
    </div>
    <p class="md3-body-small text-on-surface-variant mt-2 node-card__source">
      {{ row.net }} · {{ source }}
    </p>
    <div class="d-flex align-center ga-2 mt-2">
      <NodeLatency :latency="row.pingLatency" />
      <v-spacer />
      <NodeMenu
        :member="member"
        :selected="selected"
        :local="row._type === 'server'"
        :disabled="disabled"
        :testing="testing"
        @action="emit('action', $event)"
      />
    </div>
  </v-card>
</template>
<style scoped>
.node-card {
  cursor: pointer;
}
.node-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.node-card__name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  min-width: 0;
  flex: 1;
}
.node-card__source {
  overflow-wrap: anywhere;
}
</style>
