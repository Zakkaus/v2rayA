<script setup lang="ts">
// Placeholder for the Ports dialog until its rewrite lands; never shipped.
import { useI18n } from "vue-i18n";

defineOptions({ name: "PortsDialog" });
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
</script>

<template>
  <v-card>
    <v-card-text class="px-6 pt-6">
      <v-alert type="warning" variant="tonal" density="compact"
        >Ports: dialog pending</v-alert
      >
    </v-card-text>
    <v-card-actions class="px-6 pb-4">
      <v-spacer />
      <v-btn variant="text" @click="emit('close')">{{
        t("operations.confirm")
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>
