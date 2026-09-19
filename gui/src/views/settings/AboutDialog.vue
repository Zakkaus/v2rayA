<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AboutView from "../AboutView.vue";

defineOptions({ name: "AboutDialog" });
const emit = defineEmits<{ close: [result?: boolean] }>();
const { t } = useI18n();
</script>

<template>
  <v-card>
    <v-card-item class="px-6 pt-6 pb-2">
      <v-card-title class="md3-headline-small pa-0">
        {{ t("common.about") }}
      </v-card-title>
    </v-card-item>
    <v-card-text class="px-6">
      <AboutView />
    </v-card-text>
    <v-card-actions class="px-6 pb-4">
      <v-spacer />
      <v-btn variant="text" @click="emit('close')">
        {{ t("operations.close") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
