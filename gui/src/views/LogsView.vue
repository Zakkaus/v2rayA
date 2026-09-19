<script setup lang="ts">
// The log page. Its content lands with its own commit; until then the
// page is an empty state, not the old dialog.
import { useI18n } from "vue-i18n";
import { mdiScriptTextOutline } from "@mdi/js";

defineOptions({ name: "LogsView" });
const { t } = useI18n();
</script>

<template>
  <v-sheet color="surface-container-low" rounded="xl" class="pa-6">
    <v-empty-state :icon="mdiScriptTextOutline" :title="t('common.log')" />
  </v-sheet>
</template>
