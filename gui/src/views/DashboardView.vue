<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiChevronDown,
  mdiChevronUp,
  mdiPower,
  mdiRefresh,
  mdiSpeedometer,
  mdiServerNetwork,
  mdiPencilOutline,
  mdiPlus,
  mdiShieldOutline,
  mdiRoutes,
  mdiChartLine,
  mdiRss,
  mdiInformationOutline,
} from "@mdi/js";
import { backendAddress } from "@/api/client";
import { useDialog } from "@/composables";
import OutboundMenu from "@/components/OutboundMenu.vue";
import TrafficChart from "@/components/TrafficChart.vue";
import { useTraffic } from "@/composables/useTraffic";
import { formatBytes, formatRate } from "@/lib/format";
import { useDashboard } from "./dashboard/model";
import NodeSelection from "./dashboard/NodeSelection.vue";
import ProxySettings from "./settings/ProxySettings.vue";
import { transparentModes, pacModes } from "./settings/options";

defineOptions({ name: "DashboardView" });
const { t } = useI18n();
const { width } = useDisplay();
const wide = computed(() => width.value >= 600);
const { open } = useDialog();
const {
  store,
  loading,
  busy,
  error,
  members,
  nodeInUse,
  stateLabel,
  canToggle,
  quick,
  quickLoading,
  quickSaving,
  quickDisabled,
  showSettings,
  ports,
  editPorts,
  importNodes,
  subscriptions,
  selecting,
  testing,
  updating,
  updatingAll,
  subscriptionsBusy,
  toggleRunning,
  setQuick,
  toggleSettings,
  selectNode,
  testNode,
  testMembers,
  updateAll,
  updateSubscription,
} = useDashboard();
const traffic = useTraffic();
const transparentItems = computed(() => transparentModes(t));
const pacItems = computed(() => pacModes(t));
const ranked = computed(() =>
  [...members.value].sort(
    (a, b) =>
      Number(b.alive) - Number(a.alive) ||
      (a.delay ?? Infinity) - (b.delay ?? Infinity),
  ),
);
const slowest = computed(() =>
  Math.max(1, ...members.value.map((member) => member.delay ?? 0)),
);
const address = backendAddress() || location.origin;

function switchNode() {
  const outbound = store.outboundName;
  open(
    NodeSelection,
    {
      members: members.value,
      select: (which: Parameters<typeof selectNode>[0]) =>
        selectNode(which, outbound),
    },
    { width: 480 },
  );
}
</script>

<template>
  <div class="dashboard">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>
    <div class="dashboard-grid" :class="{ 'dashboard-grid--wide': wide }">
      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-status pa-4"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon :icon="mdiPower" size="20" color="on-surface-variant" />
          <h2 class="md3-title-small">{{ t("dashboard.status") }}</h2>
        </div>
        <p class="md3-title-large mb-2" role="status">{{ stateLabel }}</p>
        <p
          class="md3-body-small text-on-surface-variant dashboard-wrap mb-4"
          dir="ltr"
        >
          {{ address }} · {{ store.version?.version || "—" }}
        </p>
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
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-wide pa-4"
      >
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <v-icon :icon="mdiChartLine" size="20" color="on-surface-variant" />
          <h2 class="md3-title-small flex-grow-1">
            {{ t("dashboard.networkSpeed") }}
          </h2>
          <div
            class="d-flex flex-wrap ga-4 md3-label-large dashboard-figures"
            dir="ltr"
          >
            <span
              :aria-label="`${t('traffic.download')}: ${formatRate(traffic.down.value)}`"
              >↓ {{ formatRate(traffic.down.value) }}</span
            >
            <span
              :aria-label="`${t('traffic.upload')}: ${formatRate(traffic.up.value)}`"
              >↑ {{ formatRate(traffic.up.value) }}</span
            >
          </div>
        </div>
        <div class="dashboard-chart">
          <TrafficChart
            :down="traffic.downSeries.value"
            :up="traffic.upSeries.value"
          />
        </div>
        <p
          class="md3-body-small text-on-surface-variant dashboard-figures mt-2 mb-0"
          dir="ltr"
        >
          {{ t("dashboard.trafficUsage") }}: ↓
          {{ formatBytes(traffic.downTotal.value) }} · ↑
          {{ formatBytes(traffic.upTotal.value) }}
        </p>
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-connection pa-4"
      >
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <v-icon
            :icon="mdiServerNetwork"
            size="20"
            color="on-surface-variant"
          />
          <h2 class="md3-title-small flex-grow-1">
            {{ t("dashboard.inUse") }}
          </h2>
          <OutboundMenu variant="chip" />
        </div>
        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line"
          class="bg-transparent"
        />
        <template v-else-if="members.length">
          <p class="md3-title-medium mb-2 dashboard-wrap" dir="auto">
            {{
              nodeInUse
                ? nodeInUse.row.name || nodeInUse.row.address
                : t("dashboard.balanced", { n: members.length })
            }}
          </p>
          <div class="d-flex align-center flex-wrap ga-2 mb-4">
            <span
              v-if="nodeInUse"
              class="md3-body-medium text-on-surface-variant"
              dir="ltr"
              >{{ nodeInUse.row.net }} · {{ nodeInUse.latency }}</span
            >
            <span v-else class="md3-body-medium text-on-surface-variant">{{
              t(
                store.running === "running"
                  ? "common.checkRunning"
                  : "dashboard.inUseAfterStart",
              )
            }}</span>
            <v-chip
              v-if="nodeInUse?.which.selected"
              size="small"
              variant="tonal"
              >{{ t("dashboard.pinned") }}</v-chip
            >
            <v-chip
              v-else-if="nodeInUse && members.length >= 2"
              size="small"
              variant="tonal"
              >{{ t("dashboard.balanced", { n: members.length }) }}</v-chip
            >
          </div>
          <div class="d-flex align-center justify-end ga-2">
            <v-tooltip :text="t('dashboard.testLatency')">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="mdiSpeedometer"
                  size="40"
                  variant="text"
                  :aria-label="t('dashboard.testLatency')"
                  :loading="!!testing"
                  :disabled="!nodeInUse || !!testing"
                  @click="testNode"
                />
              </template>
            </v-tooltip>
            <v-btn variant="text" :disabled="selecting" @click="switchNode">{{
              t("dashboard.switchNode")
            }}</v-btn>
          </div>
        </template>
        <template v-else>
          <p class="md3-body-medium mb-4">{{ t("dashboard.emptyGroup") }}</p>
          <v-btn variant="text" @click="store.view = 'proxies'">{{
            t("dashboard.manageNodes")
          }}</v-btn>
        </template>
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-transparent pa-4"
        :loading="quickSaving"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon
            :icon="mdiShieldOutline"
            size="20"
            color="on-surface-variant"
          />
          <h2 class="md3-title-small">{{ t("setting.transparentProxy") }}</h2>
        </div>
        <v-skeleton-loader
          v-if="quickLoading"
          type="list-item"
          class="bg-transparent"
        />
        <template v-else>
          <v-select
            :model-value="quick.transparent"
            :aria-label="t('setting.transparentProxy')"
            :items="transparentItems"
            :disabled="quickDisabled"
            density="compact"
            hide-details
            @update:model-value="(value) => setQuick('transparent', value)"
          />
          <v-switch
            :model-value="quick.portSharing"
            :label="t('setting.portSharingOn')"
            :disabled="quickDisabled"
            hide-details
            class="mt-2"
            @update:model-value="(value) => setQuick('portSharing', !!value)"
          />
          <v-switch
            v-if="store.version?.os === 'linux' && !store.lite"
            :model-value="quick.ipforward"
            :label="t('setting.ipForwardOn')"
            :disabled="quickDisabled"
            hide-details
            @update:model-value="(value) => setQuick('ipforward', !!value)"
          />
          <v-btn
            variant="text"
            class="dashboard-text-button mt-2"
            :append-icon="showSettings ? mdiChevronUp : mdiChevronDown"
            :disabled="quickLoading || quickSaving"
            :aria-expanded="showSettings"
            aria-controls="dashboard-proxy-settings"
            @click="toggleSettings"
            >{{ t("dashboard.allProxySettings") }}</v-btn
          >
        </template>
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-splitting pa-4"
        :loading="quickSaving"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon :icon="mdiRoutes" size="20" color="on-surface-variant" />
          <h2 class="md3-title-small">{{ t("setting.pacMode") }}</h2>
        </div>
        <v-skeleton-loader
          v-if="quickLoading"
          type="list-item@3"
          class="bg-transparent"
        />
        <v-radio-group
          v-else
          :model-value="quick.pacMode"
          :aria-label="t('setting.pacMode')"
          :disabled="quickDisabled"
          hide-details
          @update:model-value="
            (value) => value !== null && setQuick('pacMode', value)
          "
        >
          <v-radio
            v-for="item in pacItems"
            :key="item.value"
            :value="item.value"
            :label="item.title"
          />
        </v-radio-group>
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-latency pa-4"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon :icon="mdiSpeedometer" size="20" color="on-surface-variant" />
          <h2 class="md3-title-small flex-grow-1">
            {{ t("dashboard.nodeLatency") }}
          </h2>
          <v-btn
            variant="tonal"
            size="small"
            :loading="testing === 'all'"
            :disabled="!members.length || !!testing"
            @click="testMembers"
            >{{ t("dashboard.testLatency") }}</v-btn
          >
        </div>
        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line@2"
          class="bg-transparent"
        />
        <v-list v-else-if="members.length" bg-color="transparent" class="pa-0">
          <v-list-item
            v-for="member in ranked.slice(0, 4)"
            :key="member.key"
            class="px-0 py-2"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <span
                v-if="member.key === nodeInUse?.key"
                class="dashboard-active-dot"
                :aria-label="t('dashboard.inUse')"
                role="img"
              />
              <span
                class="md3-body-medium flex-grow-1 dashboard-wrap"
                dir="auto"
                >{{ member.row.name || member.row.address }}</span
              >
              <span
                class="md3-label-medium flex-shrink-0 dashboard-figures"
                dir="ltr"
                >{{
                  member.delay !== undefined ? `${member.delay} ms` : "—"
                }}</span
              >
            </div>
            <v-progress-linear
              :model-value="
                member.delay === undefined ? 0 : (member.delay / slowest) * 100
              "
              :aria-label="member.row.name || member.row.address"
              height="4"
              rounded
              color="primary"
            />
          </v-list-item>
        </v-list>
        <p v-else class="md3-body-medium">{{ t("dashboard.emptyGroup") }}</p>
        <v-btn
          v-if="members.length > 4"
          variant="text"
          @click="store.view = 'proxies'"
          >{{ t("dashboard.moreMembers", { n: members.length - 4 }) }}</v-btn
        >
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-subscriptions dashboard-full pa-4"
      >
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <v-icon :icon="mdiRss" size="20" color="on-surface-variant" />
          <h2 class="md3-title-small flex-grow-1">
            {{ t("common.subscriptions") }}
            <span class="md3-label-medium text-on-surface-variant ms-1">{{
              loading ? "" : subscriptions.length
            }}</span>
          </h2>
          <v-tooltip :text="t('operations.import')">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :icon="mdiPlus"
                size="40"
                variant="text"
                :aria-label="t('operations.import')"
                :disabled="loading"
                @click="importNodes"
              />
            </template>
          </v-tooltip>
          <v-btn
            variant="tonal"
            class="dashboard-text-button"
            :loading="updatingAll"
            :disabled="loading || !subscriptions.length || subscriptionsBusy"
            @click="updateAll"
            >{{ t("dashboard.updateAll") }}</v-btn
          >
        </div>
        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line@2"
          class="bg-transparent"
        />
        <v-list
          v-else-if="subscriptions.length"
          bg-color="transparent"
          class="pa-0 dashboard-subscription-rows"
        >
          <v-list-item
            v-for="subscription in subscriptions.slice(0, 4)"
            :key="subscription.id"
            class="px-0 py-2"
          >
            <p class="md3-title-small mb-1 dashboard-wrap" dir="auto">
              {{ subscription.remarks || subscription.host }}
            </p>
            <p
              class="md3-body-small text-on-surface-variant mb-2 dashboard-wrap"
              dir="auto"
            >
              {{ subscription.summary }}
            </p>
            <v-progress-linear
              v-if="subscription.usage"
              :model-value="subscription.usage.percent"
              :aria-label="subscription.summary"
              height="4"
              rounded
              color="primary"
              class="mb-2"
            />
            <p class="md3-body-small text-on-surface-variant ma-0">
              {{ t("dashboard.updatedAt", { time: subscription.updatedAt }) }}
            </p>
            <template #append>
              <v-tooltip :text="t('operations.update')">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="mdiRefresh"
                    size="40"
                    variant="text"
                    :aria-label="`${t('operations.update')}: ${subscription.remarks || subscription.host}`"
                    :loading="updating === subscription.id"
                    :disabled="subscriptionsBusy"
                    @click="updateSubscription(subscription.id)"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </v-list>
        <div v-else>
          <p class="md3-body-medium my-4">
            {{ t("dashboard.noSubscriptions") }}
          </p>
          <v-btn variant="text" @click="store.view = 'proxies'">{{
            t("operations.import")
          }}</v-btn>
        </div>
        <v-btn
          v-if="subscriptions.length > 4"
          variant="text"
          @click="store.view = 'proxies'"
          >{{
            t("dashboard.moreSubscriptions", { n: subscriptions.length - 4 })
          }}</v-btn
        >
      </v-card>

      <v-card
        color="surface-container-low"
        rounded="xl"
        class="dashboard-instance pa-4"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon
            :icon="mdiInformationOutline"
            size="20"
            color="on-surface-variant"
          />
          <h2 class="md3-title-small">{{ t("dashboard.facts") }}</h2>
        </div>
        <dl class="dashboard-facts md3-body-medium">
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("dashboard.version") }}
            </dt>
            <dd class="d-flex align-center flex-wrap ga-2">
              <span dir="ltr">{{ store.version?.version || "—" }}</span>
              <v-chip
                v-if="store.version?.foundNew"
                variant="tonal"
                size="small"
                href="https://github.com/v2rayA/v2rayA/releases"
                target="_blank"
                rel="noopener noreferrer"
                >{{
                  t("dashboard.newVersion", {
                    version: store.version.remoteVersion.replace(/^v/, ""),
                  })
                }}</v-chip
              >
            </dd>
          </div>
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("dashboard.core") }}
            </dt>
            <dd class="d-flex align-center flex-wrap ga-2">
              <span dir="ltr">{{ store.version?.variant || "—" }}</span>
              <v-tooltip
                v-if="store.version && !store.version.coreVersionValid"
                :text="store.version.coreVersionErr"
                max-width="360"
                open-on-click
              >
                <template #activator="{ props }">
                  <v-chip
                    v-bind="props"
                    color="error"
                    variant="tonal"
                    size="small"
                    tabindex="0"
                    >{{ t("dashboard.coreError") }}</v-chip
                  >
                </template>
              </v-tooltip>
            </dd>
          </div>
          <div>
            <dt class="md3-label-medium text-on-surface-variant">
              {{ t("dashboard.ports") }}
            </dt>
            <dd dir="ltr" class="dashboard-figures">
              <div>SOCKS: {{ ports?.socks5 ?? "—" }}</div>
              <div>HTTP: {{ ports?.http ?? "—" }}</div>
              <div>
                {{ t("dashboard.httpWithRules") }}:
                {{ ports?.httpWithPac ?? "—" }}
              </div>
            </dd>
          </div>
        </dl>
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            variant="text"
            :prepend-icon="mdiPencilOutline"
            @click="editPorts"
            >{{ t("customAddressPort.title") }}</v-btn
          >
          <v-btn variant="text" @click="store.view = 'logs'">{{
            t("common.log")
          }}</v-btn>
        </div>
      </v-card>
    </div>
    <v-expand-transition>
      <div v-if="showSettings" id="dashboard-proxy-settings" class="mt-4">
        <ProxySettings />
      </div>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.dashboard {
  container-type: inline-size;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}
.dashboard-grid > * {
  min-width: 0;
}
.dashboard-grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.dashboard-grid--wide .dashboard-wide {
  grid-column: span 2;
}
/* the subscriptions run the whole row, their rows side by side */
.dashboard-grid--wide .dashboard-full {
  grid-column: 1 / -1;
}
@container (width < 536px) {
  .dashboard-grid--wide {
    grid-template-columns: minmax(0, 1fr);
  }
  .dashboard-grid--wide .dashboard-wide {
    grid-column: span 1;
  }
}
.dashboard-wrap {
  overflow-wrap: anywhere;
}
/* subscriptions side by side on a wide row */
.dashboard-grid--wide .dashboard-subscription-rows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0 24px;
}
.dashboard-chart {
  height: 120px;
}
.dashboard-facts {
  display: grid;
  gap: 16px;
}
.dashboard-figures {
  font-variant-numeric: tabular-nums;
}
.dashboard-text-button {
  height: auto;
  min-height: 40px;
  max-width: 100%;
}
.dashboard-text-button :deep(.v-btn__content) {
  white-space: normal;
}
.dashboard-active-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}
</style>
