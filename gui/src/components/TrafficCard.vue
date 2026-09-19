<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import { formatBytes, formatRate } from "@/lib/format";

const props = defineProps<{
  up: number;
  down: number;
  upTotal: number;
  downTotal: number;
  upSeries: number[];
  downSeries: number[];
}>();
const { t } = useI18n();
const { width } = useDisplay();
const expanded = computed(() => width.value >= 840);
const downGradient = [
  "rgb(var(--v-theme-primary))",
  "rgb(var(--v-theme-primary-container))",
];
const upGradient = [
  "rgb(var(--v-theme-tertiary))",
  "rgb(var(--v-theme-tertiary-container))",
];
</script>

<template>
  <v-card color="surface-container-high" rounded="xl" class="pa-4">
    <v-row dense>
      <v-col :cols="expanded ? 6 : 12">
        <v-card-subtitle class="md3-label-medium pa-0">
          {{ t("traffic.download") }}
        </v-card-subtitle>
        <v-card-text class="md3-display-small pa-0" dir="ltr">
          {{ formatRate(props.down) }}
        </v-card-text>
        <v-card-text class="md3-body-small text-on-surface-variant pa-0 mt-2">
          {{ t("traffic.total", { value: formatBytes(props.downTotal) }) }}
        </v-card-text>
        <v-sparkline
          :model-value="props.downSeries"
          type="trend"
          smooth
          fill
          :min="0"
          color="rgb(var(--v-theme-primary))"
          :gradient="downGradient"
          auto-draw="once"
          animation
          class="mt-4"
          role="img"
          :aria-label="t('traffic.download')"
        />
      </v-col>
      <v-col :cols="expanded ? 6 : 12">
        <v-card-subtitle class="md3-label-medium pa-0">
          {{ t("traffic.upload") }}
        </v-card-subtitle>
        <v-card-text class="md3-display-small pa-0" dir="ltr">
          {{ formatRate(props.up) }}
        </v-card-text>
        <v-card-text class="md3-body-small text-on-surface-variant pa-0 mt-2">
          {{ t("traffic.total", { value: formatBytes(props.upTotal) }) }}
        </v-card-text>
        <v-sparkline
          :model-value="props.upSeries"
          type="trend"
          smooth
          fill
          :min="0"
          color="rgb(var(--v-theme-tertiary))"
          :gradient="upGradient"
          auto-draw="once"
          animation
          class="mt-4"
          role="img"
          :aria-label="t('traffic.upload')"
        />
      </v-col>
    </v-row>
  </v-card>
</template>
