<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiChevronDown,
  mdiMagnify,
  mdiSpeedometer,
  mdiViewGridOutline,
  mdiViewListOutline,
} from "@mdi/js";
import { errorText } from "@/api/errors";
import { useNotify } from "@/composables";
import NodesView from "./NodesView.vue";
import NodeChips from "./proxies/NodeChips.vue";
import { useProxies } from "./proxies/model";
import type { Row } from "./nodes/model";

defineOptions({ name: "ProxiesView" });
const { t } = useI18n();
const notify = useNotify();
const { width } = useDisplay();
const compact = computed(() => width.value < 600);
const expanded = computed(() => width.value >= 840);
const proxies = useProxies();
const {
  store,
  nodes,
  query,
  view,
  groups,
  sources,
  manualRows,
  manualGroup,
  pending,
  tested,
  loading,
  loadError,
} = proxies;
const list = ref<InstanceType<typeof NodesView> | null>(null);

async function run(
  action: () => Promise<unknown>,
  failKey: string,
  params = {},
) {
  try {
    await action();
  } catch (err) {
    notify.warning(t(failKey, { ...params, message: errorText(err) }));
  }
}
const sync = () =>
  run(async () => {
    if (view.value === "list") await list.value?.sync();
    else await proxies.sync();
  }, "server.refreshFailed");
const toggle = (row: Row, group: string) =>
  run(() => proxies.toggleGroup(row, group), "proxyGroup.updateFailed", {
    group,
  });
const connect = (group: string) =>
  run(() => proxies.connectGroup(group), "connection.connectFailed");
defineExpose({ sync });
onMounted(() => {
  if (view.value === "cards") void sync();
});
watch(view, (value) => {
  if (value === "cards") void sync();
});
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <v-btn-toggle
      v-model="view"
      mandatory
      divided
      variant="outlined"
      color="primary"
      rounded="pill"
      class="align-self-start"
      :aria-label="t('operations.view')"
    >
      <v-btn value="cards" :prepend-icon="mdiViewGridOutline">{{
        t("proxies.cards")
      }}</v-btn>
      <v-btn value="list" :prepend-icon="mdiViewListOutline">{{
        t("proxies.list")
      }}</v-btn>
    </v-btn-toggle>

    <NodesView v-if="view === 'list'" ref="list" />
    <template v-else>
      <v-text-field
        v-model="query"
        :label="t('proxyGroup.searchNodes')"
        :prepend-inner-icon="mdiMagnify"
        variant="solo-filled"
        bg-color="surface-container-high"
        rounded="pill"
        flat
        hide-details
        clearable
        @click:clear="query = ''"
      />
      <v-alert v-if="loadError" type="error" variant="tonal">
        {{ t("server.refreshFailed", { message: errorText(loadError) }) }}
        <template #append>
          <v-btn variant="text" @click="sync">{{
            t("operations.update")
          }}</v-btn>
        </template>
      </v-alert>
      <v-skeleton-loader v-else-if="loading" type="card, list-item-two-line" />
      <template v-else>
        <v-row>
          <v-col
            v-for="group in groups"
            :key="group.name"
            :cols="expanded ? 6 : 12"
          >
            <v-card
              color="surface-container-low"
              rounded="lg"
              class="h-100 pa-4"
              :data-group="group.name"
            >
              <div class="d-flex flex-wrap align-center ga-2 mb-4">
                <h2 class="md3-title-medium proxies__name">{{ group.name }}</h2>
                <span class="md3-body-small text-on-surface-variant">{{
                  t("proxies.members", { n: group.members.length })
                }}</span>
                <v-spacer />
                <v-btn
                  variant="tonal"
                  :prepend-icon="mdiSpeedometer"
                  :disabled="pending !== null || !group.members.length"
                  :loading="pending === group.name"
                  @click="
                    run(
                      () => proxies.testGroup(group.name, t('latency.testing')),
                      'latency.failed',
                    )
                  "
                  >{{ t("proxies.testLatency") }}</v-btn
                >
              </div>
              <v-btn-group
                v-if="tested.has(group.name)"
                color="primary"
                variant="tonal"
                rounded="pill"
                divided
                class="mb-4 proxies__split"
              >
                <v-btn
                  :disabled="pending !== null || !group.members.length"
                  @click="connect(group.name)"
                  >{{ t("proxies.connectFastest") }}</v-btn
                >
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :disabled="pending !== null"
                      :aria-label="t('common.menu')"
                      width="48"
                      min-width="48"
                    >
                      <v-icon :icon="mdiChevronDown" size="18" />
                      <v-tooltip activator="parent">{{
                        t("common.menu")
                      }}</v-tooltip>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      :title="t('proxies.connectFastest')"
                      @click="connect(group.name)"
                    />
                    <v-list-item
                      :title="t('proxies.chooseManually')"
                      @click="manualGroup = group.name"
                    />
                  </v-list>
                </v-menu>
              </v-btn-group>
              <NodeChips
                :rows="group.visible"
                :is-selected="(row) => nodes.inGroup(row, group.name)"
                :disabled="pending !== null"
                @toggle="toggle($event, group.name)"
              />
              <v-empty-state
                v-if="!group.visible.length"
                :title="
                  t(
                    group.members.length
                      ? 'proxyGroup.noMatch'
                      : 'proxyGroup.emptyGroup',
                  )
                "
                class="pa-4"
              />
            </v-card>
          </v-col>
        </v-row>

        <v-sheet
          color="surface-container-low"
          rounded="xl"
          :class="compact ? 'pa-4' : 'pa-6'"
        >
          <h2 class="md3-title-medium mb-4">{{ t("common.nodes") }}</h2>
          <v-select
            v-model="store.outboundName"
            :items="store.outbounds"
            :label="t('proxyGroup.group')"
            :disabled="pending !== null"
            class="mb-4"
            hide-details
          />
          <v-expansion-panels multiple variant="accordion">
            <v-expansion-panel
              v-for="source in sources"
              :key="source.key"
              :value="source.key"
              bg-color="surface-container-low"
            >
              <v-expansion-panel-title>
                <span class="proxies__name">{{
                  source.name || t("server.server")
                }}</span>
                <span class="ms-2 md3-body-small text-on-surface-variant">{{
                  source.rows.length
                }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <NodeChips
                  :rows="source.rows"
                  :is-selected="(row) => nodes.inGroup(row, store.outboundName)"
                  :disabled="pending !== null"
                  @toggle="toggle($event, store.outboundName)"
                />
                <v-empty-state
                  v-if="!source.rows.length"
                  :title="t(query ? 'proxyGroup.noMatch' : 'common.empty')"
                  class="pa-4"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-sheet>
      </template>
    </template>

    <v-dialog
      :model-value="manualGroup !== null"
      max-width="640"
      scrollable
      @update:model-value="!$event && (manualGroup = null)"
    >
      <v-card v-if="manualGroup !== null">
        <v-card-title class="md3-headline-small px-6 pt-6 pb-2 proxies__name">{{
          manualGroup
        }}</v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="query"
            :label="t('proxyGroup.searchNodes')"
            :prepend-inner-icon="mdiMagnify"
            rounded="pill"
            variant="solo-filled"
            bg-color="surface-container-high"
            flat
            hide-details
            class="mb-4"
          />
          <NodeChips
            :rows="manualRows"
            :is-selected="(row) => nodes.inGroup(row, manualGroup!)"
            :disabled="pending !== null"
            @toggle="toggle($event, manualGroup!)"
          />
          <v-empty-state
            v-if="!manualRows.length"
            :title="t('proxyGroup.noMatch')"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="manualGroup = null">{{
            t("operations.close")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.proxies__name {
  overflow-wrap: anywhere;
  white-space: normal;
}
.proxies__split {
  max-width: 100%;
  height: auto;
}
.proxies__split :deep(.v-btn__content) {
  white-space: normal;
}
</style>
