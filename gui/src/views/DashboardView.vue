<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import { mdiChevronRight, mdiPower } from "@mdi/js";
import OutboundMenu from "@/components/OutboundMenu.vue";
import TrafficCard from "@/components/TrafficCard.vue";
import { useTraffic } from "@/composables/useTraffic";
import { useDashboard } from "./dashboard/model";

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
  transparentMode,
  rulePortMode,
  toggleRunning,
} = useDashboard();

// A filled button keeps the requested action distinct from the confirmed core state.
const traffic = useTraffic();
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
      <v-card
        color="surface-container-high"
        rounded="xl"
        class="dashboard-status pa-4"
      >
        <h2 class="md3-title-medium mb-4">{{ t("dashboard.status") }}</h2>
        <div
          class="d-flex align-center justify-space-between flex-wrap ga-4 mb-6"
        >
          <p class="md3-display-small" role="status">{{ stateLabel }}</p>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="mdiPower"
            :loading="busy"
            :disabled="!canToggle"
            @click="toggleRunning"
          >
            {{ t(store.running === "running" ? "v2ray.stop" : "v2ray.start") }}
          </v-btn>
        </div>
        <div class="d-flex align-center flex-wrap ga-4 mb-4">
          <h3 class="md3-title-medium">{{ t("proxyGroup.group") }}</h3>
          <OutboundMenu variant="chip" />
        </div>
        <v-skeleton-loader
          v-if="loading"
          type="text"
          color="surface-container-high"
        />
        <div v-else-if="connectedNodes.length" class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="{ key, row } in connectedNodes"
            :key="key"
            variant="outlined"
            class="dashboard-node"
          >
            <span dir="auto">{{ row.name || row.address }}</span>
            <span class="ms-2" dir="ltr">{{ row.pingLatency || "—" }}</span>
          </v-chip>
        </div>
        <v-empty-state
          v-else-if="nodeCount !== undefined"
          :title="t(nodeCount === 0 ? 'common.empty' : 'proxyGroup.emptyGroup')"
          class="pa-4"
        />
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

      <v-card color="surface-container-high" rounded="xl" class="pa-4">
        <h2 class="md3-title-medium mb-4">{{ t("common.setting") }}</h2>
        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line@2"
          color="surface-container-high"
        />
        <v-list v-else bg-color="surface-container-high" class="pa-0">
          <v-list-item
            :append-icon="mdiChevronRight"
            rounded="lg"
            class="px-0"
            @click="store.view = 'settings'"
          >
            <v-list-item-title class="md3-body-medium text-wrap">
              {{ t("setting.transparentProxy") }}
            </v-list-item-title>
            <p class="md3-body-medium text-on-surface-variant mt-2">
              {{ transparentMode }}
            </p>
          </v-list-item>
          <v-list-item
            :append-icon="mdiChevronRight"
            rounded="lg"
            class="px-0 mt-2"
            @click="store.view = 'settings'"
          >
            <v-list-item-title class="md3-body-medium text-wrap">
              {{ t("setting.pacMode") }}
            </v-list-item-title>
            <p class="md3-body-medium text-on-surface-variant mt-2">
              {{ rulePortMode }}
            </p>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card color="surface-container-high" rounded="xl" class="pa-4">
        <h2 class="md3-title-medium mb-4">{{ t("dashboard.facts") }}</h2>
        <dl class="d-flex flex-wrap ga-6 mb-4">
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("dashboard.version") }}
            </dt>
            <dd class="md3-title-medium" dir="ltr">
              {{ store.version?.version || "—" }}
            </dd>
          </div>
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("dashboard.core") }}
            </dt>
            <dd class="md3-title-medium" dir="ltr">
              {{ store.version?.variant || "—" }}
            </dd>
          </div>
        </dl>
        <v-skeleton-loader
          v-if="loading"
          type="text"
          color="surface-container-high"
        />
        <dl v-else class="d-flex flex-wrap ga-6">
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("common.nodes") }}
            </dt>
            <dd class="md3-display-small">{{ nodeCount ?? "—" }}</dd>
          </div>
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("common.subscriptions") }}
            </dt>
            <dd class="md3-display-small">{{ subscriptionCount ?? "—" }}</dd>
          </div>
        </dl>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.dashboard-grid > * {
  min-width: 0;
}
.dashboard-grid--expanded {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.dashboard-grid--expanded .dashboard-status {
  grid-column: span 2;
}
.dashboard-traffic {
  min-height: 280px;
}
.dashboard-node {
  height: auto;
  min-height: 32px;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
