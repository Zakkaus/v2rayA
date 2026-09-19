<script setup lang="ts">
// The dashboard page; its content lands with its own commit.
import { useI18n } from "vue-i18n";

defineOptions({ name: "DashboardView" });
const { t } = useI18n();
</script>

<template>
  <v-sheet color="surface-container-low" rounded="xl" class="pa-6">
    <v-empty-state :title="t('common.dashboard')" />
  </v-sheet>
</template>
