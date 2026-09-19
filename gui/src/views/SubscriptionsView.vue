<script setup lang="ts">
// The subscriptions page; its content lands with its own commit.
import { useI18n } from "vue-i18n";

defineOptions({ name: "SubscriptionsView" });
const { t } = useI18n();
</script>

<template>
  <v-sheet color="surface-container-low" rounded="xl" class="pa-6">
    <v-empty-state :title="t('common.subscriptions')" />
  </v-sheet>
</template>
