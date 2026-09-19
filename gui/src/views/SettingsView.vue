<script setup lang="ts">
// The settings page. Its content lands with its own commit; until then the
// page is an empty state, not the old dialog.
import { useI18n } from "vue-i18n";
import { mdiCogOutline } from "@mdi/js";

defineOptions({ name: "SettingsView" });
const { t } = useI18n();
</script>

<template>
  <v-sheet color="surface-container-low" rounded="xl" class="pa-6">
    <v-empty-state :icon="mdiCogOutline" :title="t('common.setting')" />
  </v-sheet>
</template>
