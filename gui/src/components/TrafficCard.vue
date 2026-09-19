<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
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
// both lines share one scale so their heights compare
const max = computed(() => Math.max(1, ...props.upSeries, ...props.downSeries));
const downFill = [
  "rgba(var(--v-theme-primary), 0.35)",
  "rgba(var(--v-theme-primary), 0.02)",
];
const upFill = [
  "rgba(var(--v-theme-tertiary), 0.3)",
  "rgba(var(--v-theme-tertiary), 0.02)",
];
</script>

<template>
  <v-card color="surface-container-high" rounded="xl" class="pa-5 traffic">
    <div class="traffic__rates">
      <div>
        <p class="md3-label-medium text-on-surface-variant ma-0">
          {{ t("traffic.download") }}
        </p>
        <p class="md3-headline-small traffic__value ma-0" dir="ltr">
          {{ formatRate(props.down) }}
        </p>
        <p class="md3-body-small text-on-surface-variant ma-0" dir="ltr">
          {{ t("traffic.total", { value: formatBytes(props.downTotal) }) }}
        </p>
      </div>
      <div>
        <p class="md3-label-medium text-on-surface-variant ma-0">
          {{ t("traffic.upload") }}
        </p>
        <p class="md3-headline-small traffic__value ma-0" dir="ltr">
          {{ formatRate(props.up) }}
        </p>
        <p class="md3-body-small text-on-surface-variant ma-0" dir="ltr">
          {{ t("traffic.total", { value: formatBytes(props.upTotal) }) }}
        </p>
      </div>
    </div>
    <div class="traffic__chart mt-4">
      <v-sparkline
        :model-value="props.downSeries"
        :max="max"
        :min="0"
        type="trend"
        smooth
        fill
        :padding="2"
        :gradient="downFill"
        aria-hidden="true"
      />
      <v-sparkline
        :model-value="props.upSeries"
        :max="max"
        :min="0"
        type="trend"
        smooth
        fill
        :padding="2"
        :gradient="upFill"
        aria-hidden="true"
      />
      <v-sparkline
        :model-value="props.downSeries"
        :max="max"
        :min="0"
        type="trend"
        smooth
        :line-width="1.5"
        :padding="2"
        color="rgb(var(--v-theme-primary))"
        role="img"
        :aria-label="t('traffic.download')"
      />
      <v-sparkline
        :model-value="props.upSeries"
        :max="max"
        :min="0"
        type="trend"
        smooth
        :line-width="1.5"
        :padding="2"
        color="rgb(var(--v-theme-tertiary))"
        role="img"
        :aria-label="t('traffic.upload')"
      />
    </div>
  </v-card>
</template>

<style scoped>
.traffic__rates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.traffic__value {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* one plot of four layers: the two soft fills, then the two lines */
.traffic__chart {
  position: relative;
  height: 96px;
}
.traffic__chart :deep(svg) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
