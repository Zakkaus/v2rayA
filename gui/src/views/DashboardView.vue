<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import { mdiChevronDown, mdiChevronUp, mdiPower } from "@mdi/js";
import OutboundMenu from "@/components/OutboundMenu.vue";
import TrafficCard from "@/components/TrafficCard.vue";
import { useTraffic } from "@/composables/useTraffic";
import { useDashboard } from "./dashboard/model";
import ProxySettings from "./settings/ProxySettings.vue";

defineOptions({ name: "DashboardView" });
const { t } = useI18n();
const { width } = useDisplay();
const expanded = computed(() => width.value >= 840);
const {
  store,
  loading,
  busy,
  error,
  nodeCount,
  subscriptionCount,
  connectedNodes,
  stateLabel,
  canToggle,
  toggleRunning,
} = useDashboard();

// A filled button keeps the requested action distinct from the confirmed core state.
const traffic = useTraffic();

// a long member list folds to its first rows until asked for the rest
const foldAt = 8;
const unfolded = ref(false);
const shownNodes = computed(() =>
  unfolded.value || connectedNodes.value.length <= foldAt
    ? connectedNodes.value
    : connectedNodes.value.slice(0, foldAt),
);
const hiddenCount = computed(
  () => connectedNodes.value.length - shownNodes.value.length,
);
</script>

<template>
  <div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <div
      class="dashboard-grid"
      :class="{ 'dashboard-grid--expanded': expanded }"
    >
      <!-- the core -->
      <v-card
        color="surface-container-high"
        rounded="xl"
        class="dashboard-status pa-5"
      >
        <div class="d-flex align-center ga-4">
          <v-avatar
            :color="
              store.running === 'running'
                ? 'primary'
                : 'surface-container-highest'
            "
            size="56"
          >
            <v-icon :icon="mdiPower" size="28" />
          </v-avatar>
          <div class="flex-grow-1 min-w-0">
            <p class="md3-headline-small ma-0" role="status">
              {{ stateLabel }}
            </p>
            <p class="md3-body-medium text-on-surface-variant ma-0">
              {{ t("dashboard.connected") }}: {{ connectedNodes.length }} ·
              {{ t("proxyGroup.group") }}:
              {{ store.outboundName.toUpperCase() }}
            </p>
          </div>
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            :prepend-icon="mdiPower"
            :loading="busy"
            :disabled="!canToggle"
            @click="toggleRunning"
          >
            {{ t(store.running === "running" ? "v2ray.stop" : "v2ray.start") }}
          </v-btn>
        </div>
        <v-divider class="my-4" />
        <div class="d-flex align-center flex-wrap ga-3">
          <OutboundMenu variant="chip" />
          <v-skeleton-loader
            v-if="loading"
            type="chip"
            class="bg-transparent"
          />
          <template v-else-if="connectedNodes.length">
            <v-chip
              v-for="{ key, row } in shownNodes"
              :key="key"
              variant="tonal"
              class="dashboard-node"
            >
              <span dir="auto">{{ row.name || row.address }}</span>
              <span
                v-if="row.pingLatency"
                class="ms-2 md3-label-medium"
                dir="ltr"
              >
                {{ row.pingLatency }}
              </span>
            </v-chip>
            <v-btn
              v-if="hiddenCount || unfolded"
              variant="text"
              size="small"
              :append-icon="unfolded ? mdiChevronUp : mdiChevronDown"
              class="dashboard-fold"
              @click="unfolded = !unfolded"
            >
              {{
                unfolded
                  ? t("dashboard.showLess")
                  : t("dashboard.showMore", { n: hiddenCount })
              }}
            </v-btn>
          </template>
          <span v-else class="md3-body-medium text-on-surface-variant">
            {{ t(nodeCount === 0 ? "common.empty" : "proxyGroup.emptyGroup") }}
          </span>
        </div>
      </v-card>

      <TrafficCard
        class="dashboard-traffic"
        :up="traffic.up.value"
        :down="traffic.down.value"
        :up-total="traffic.upTotal.value"
        :down-total="traffic.downTotal.value"
        :up-series="traffic.upSeries.value"
        :down-series="traffic.downSeries.value"
      />

      <ProxySettings class="dashboard-proxy" />

      <!-- the instance -->
      <v-card color="surface-container-high" rounded="xl" class="pa-5">
        <h2 class="md3-title-medium mb-4">{{ t("dashboard.facts") }}</h2>
        <div class="dashboard-facts">
          <div>
            <p class="md3-label-medium text-on-surface-variant ma-0">
              {{ t("dashboard.version") }}
            </p>
            <p class="md3-title-large ma-0" dir="ltr">
              {{ store.version?.version || "—" }}
            </p>
          </div>
          <div>
            <p class="md3-label-medium text-on-surface-variant ma-0">
              {{ t("dashboard.core") }}
            </p>
            <p class="md3-title-large ma-0" dir="ltr">
              {{ store.version?.variant || "—" }}
            </p>
          </div>
          <div>
            <p class="md3-label-medium text-on-surface-variant ma-0">
              {{ t("common.nodes") }}
            </p>
            <p class="md3-title-large ma-0">{{ nodeCount ?? "—" }}</p>
          </div>
          <div>
            <p class="md3-label-medium text-on-surface-variant ma-0">
              {{ t("common.subscriptions") }}
            </p>
            <p class="md3-title-large ma-0">{{ subscriptionCount ?? "—" }}</p>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}
.dashboard-grid > * {
  min-width: 0;
}
.dashboard-grid--expanded {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}
.dashboard-grid--expanded .dashboard-status {
  grid-column: span 8;
}
.dashboard-grid--expanded .dashboard-traffic {
  grid-column: span 4;
}
.dashboard-grid--expanded .dashboard-proxy {
  grid-column: span 7;
}
.dashboard-grid--expanded > :last-child {
  grid-column: span 5;
}
.dashboard-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}
.dashboard-node {
  height: auto;
  min-height: 32px;
  max-width: 100%;
  white-space: normal;
}
.min-w-0 {
  min-width: 0;
}
</style>
