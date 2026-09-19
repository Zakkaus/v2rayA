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
const downGradient = [
  "rgb(var(--v-theme-primary))",
  "rgb(var(--v-theme-primary-container))",
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
        type="trend"
        smooth
        fill
        :min="0"
        :line-width="2"
        :padding="4"
        color="rgb(var(--v-theme-primary))"
        :gradient="downGradient"
        auto-draw="once"
        animation
        role="img"
        :aria-label="t('traffic.download')"
        class="traffic__down"
      />
      <v-sparkline
        :model-value="props.upSeries"
        type="trend"
        smooth
        :min="0"
        :line-width="2"
        :padding="4"
        color="rgb(var(--v-theme-tertiary))"
        auto-draw="once"
        animation
        role="img"
        :aria-label="t('traffic.upload')"
        class="traffic__up"
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
/* the two lines share one plot: download filled below, upload as a line above */
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
