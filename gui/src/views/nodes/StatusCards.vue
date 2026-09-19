<script setup lang="ts">
// The connected nodes of the current outbound, one card each, with what
// the observatory last saw: alive, latency, last seen and last try. The
// lowest latency is marked. Clicking a card locates its row. Vertical as
// the supporting pane; horizontal in a slide group on narrower windows.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import { mdiCheckDecagramOutline, mdiCircleMedium } from "@mdi/js";
import type { OutboundStatus, Which } from "@/api/types";
import { useAppStore } from "@/stores/app";
import type { Row } from "./model";

const props = defineProps<{
  items: { which: Which; row: Row }[];
  statusOf: (which: Which) => OutboundStatus | undefined;
  subscriptionName: (which: Which) => string | null;
  horizontal?: boolean;
}>();
const emit = defineEmits<{ locate: [which: Which] }>();
const { t } = useI18n();
const store = useAppStore();

const cards = computed(() =>
  props.items
    .map((it) => ({ ...it, status: props.statusOf(it.which) }))
    .sort((a, b) => a.row.name.localeCompare(b.row.name)),
);
const best = computed(() => {
  let min = Infinity;
  let key = "";
  for (const c of cards.value) {
    if (c.status?.delay && c.status.delay < min) {
      min = c.status.delay;
      key = keyOf(c.which);
    }
  }
  return key;
});
const keyOf = (w: Which) =>
  `${w._type}-${w.sub ?? "na"}-${w.id}-${w.outbound ?? "proxy"}`;
const ago = (unix: number) => dayjs.unix(unix).fromNow();
const groupLabel = computed(() => {
  const n = props.items.length;
  const name = store.outboundName.toUpperCase();
  return n > 1 ? `${name} · ${t("common.loadBalance")} (${n})` : name;
});
function aliveColor(s?: OutboundStatus) {
  if (!s) return "outline";
  return s.alive ? "success" : "error";
}
</script>

<template>
  <div class="status">
    <v-slide-group v-if="horizontal" show-arrows>
      <v-slide-group-item v-for="c in cards" :key="keyOf(c.which)">
        <v-card
          color="surface-container-high"
          class="status__card me-3"
          min-width="220"
          @click="emit('locate', c.which)"
        >
          <v-card-item class="pb-1">
            <template #prepend>
              <v-icon :icon="mdiCircleMedium" :color="aliveColor(c.status)" />
            </template>
            <v-card-title class="md3-title-small">{{
              c.row.name || c.row.address
            }}</v-card-title>
            <v-card-subtitle class="md3-body-small">{{
              groupLabel
            }}</v-card-subtitle>
          </v-card-item>
          <v-card-text class="md3-body-small pt-0 d-flex ga-2 flex-wrap">
            <v-chip size="x-small" variant="tonal">{{ c.row.net }}</v-chip>
            <v-chip
              v-if="c.status?.delay && c.status.delay < 99999"
              size="x-small"
              variant="tonal"
              color="primary"
            >
              {{ c.status.delay }} ms
            </v-chip>
          </v-card-text>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>
    <template v-else>
      <p class="md3-title-small text-on-surface-variant mb-3">
        {{ groupLabel }}
      </p>
      <v-card
        v-for="c in cards"
        :key="keyOf(c.which)"
        color="surface-container-high"
        class="status__card mb-3"
        @click="emit('locate', c.which)"
      >
        <v-card-item class="pb-1">
          <template #prepend>
            <v-icon :icon="mdiCircleMedium" :color="aliveColor(c.status)" />
          </template>
          <template v-if="keyOf(c.which) === best" #append>
            <v-icon :icon="mdiCheckDecagramOutline" color="primary" size="20" />
          </template>
          <v-card-title class="md3-title-small">{{
            c.row.name || c.row.address
          }}</v-card-title>
          <v-card-subtitle
            v-if="subscriptionName(c.which)"
            class="md3-body-small"
          >
            {{ subscriptionName(c.which) }}
          </v-card-subtitle>
        </v-card-item>
        <v-card-text class="md3-body-small pt-0">
          <div class="d-flex ga-2 flex-wrap mb-1">
            <v-chip size="x-small" variant="tonal">{{ c.row.net }}</v-chip>
            <v-chip
              v-if="c.status?.delay && c.status.delay < 99999"
              size="x-small"
              variant="tonal"
              color="primary"
            >
              {{ c.status.delay }} ms
            </v-chip>
          </div>
          <p
            v-if="c.status && !c.status.alive && c.status.last_seen_time"
            class="text-on-surface-variant"
          >
            {{ t("server.lastSeenTime") }}: {{ ago(c.status.last_seen_time) }}
          </p>
          <p v-if="c.status?.last_try_time" class="text-on-surface-variant">
            {{ t("server.lastTryTime") }}: {{ ago(c.status.last_try_time) }}
          </p>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.status__card {
  cursor: pointer;
}
</style>
