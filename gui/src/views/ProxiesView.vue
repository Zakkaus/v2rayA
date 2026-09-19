<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiChevronDown,
  mdiMagnify,
  mdiPlus,
  mdiSpeedometer,
  mdiTrayArrowDown,
  mdiViewGridOutline,
  mdiViewListOutline,
} from "@mdi/js";
import { errorText } from "@/api/errors";
import { useDialog, useNotify, useOutboundGroups } from "@/composables";
import ImportDialog from "@/dialogs/Import.vue";
import ServerDialog from "@/dialogs/Server/index.vue";
import NodesView from "./NodesView.vue";
import NodeChips from "./proxies/NodeChips.vue";
import { useProxies } from "./proxies/model";
import type { Row } from "./nodes/model";

defineOptions({ name: "ProxiesView" });
const { t } = useI18n();
const notify = useNotify();
const { width } = useDisplay();
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
const { open } = useDialog();
const outboundGroups = useOutboundGroups();

async function newGroup() {
  if (await outboundGroups.add()) await sync();
}
async function newNode() {
  const saved = await open<boolean>(
    ServerDialog,
    { which: null },
    { width: 560 },
  ).result;
  if (saved) await sync();
}
async function importNodes() {
  const imported = await open<boolean>(ImportDialog, {}, { width: 480 }).result;
  if (imported) await sync();
}

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
  <div class="proxies">
    <div class="proxies__bar">
      <v-btn-toggle
        v-model="view"
        mandatory
        divided
        variant="outlined"
        rounded="xl"
        density="comfortable"
        selected-class="bg-secondary-container text-on-secondary-container"
        :aria-label="t('operations.view')"
      >
        <v-btn
          value="cards"
          :prepend-icon="mdiViewGridOutline"
          class="text-none"
        >
          {{ t("proxies.cards") }}
        </v-btn>
        <v-btn
          value="list"
          :prepend-icon="mdiViewListOutline"
          class="text-none"
        >
          {{ t("proxies.list") }}
        </v-btn>
      </v-btn-toggle>
      <v-spacer />
      <v-btn variant="text" :prepend-icon="mdiPlus" @click="newGroup">
        {{ t("proxies.newGroup") }}
      </v-btn>
      <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="newNode">
        {{ t("proxies.newNode") }}
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :prepend-icon="mdiTrayArrowDown"
        @click="importNodes"
      >
        {{ t("operations.import") }}
      </v-btn>
    </div>
    <v-text-field
      v-if="view === 'cards'"
      v-model="query"
      :placeholder="t('proxyGroup.searchNodes')"
      :prepend-inner-icon="mdiMagnify"
      variant="solo-filled"
      bg-color="surface-container-high"
      rounded="pill"
      density="comfortable"
      flat
      hide-details
      clearable
      class="proxies__search mb-5"
      @click:clear="query = ''"
    />

    <NodesView v-if="view === 'list'" ref="list" />
    <template v-else>
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
        {{ t("server.refreshFailed", { message: errorText(loadError) }) }}
        <template #append>
          <v-btn variant="text" @click="sync">{{
            t("operations.update")
          }}</v-btn>
        </template>
      </v-alert>
      <v-skeleton-loader
        v-else-if="loading"
        type="card, card"
        class="bg-transparent"
      />
      <template v-else>
        <div
          class="proxies__groups"
          :class="{ 'proxies__groups--wide': expanded }"
        >
          <v-card
            v-for="group in groups"
            :key="group.name"
            color="surface-container-high"
            rounded="xl"
            class="pa-5"
            :data-group="group.name"
          >
            <div class="d-flex align-center ga-3 mb-4">
              <h2 class="md3-title-large proxies__name">
                {{ group.name.toUpperCase() }}
              </h2>
              <v-chip size="small" variant="tonal">
                {{ t("proxies.members", { n: group.members.length }) }}
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="!tested.has(group.name)"
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
              >
                {{ t("proxies.testLatency") }}
              </v-btn>
              <v-btn-group
                v-else
                color="primary"
                variant="flat"
                rounded="xl"
                divided
              >
                <v-btn
                  :disabled="pending !== null"
                  @click="connect(group.name)"
                >
                  {{ t("proxies.connectFastest") }}
                </v-btn>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :disabled="pending !== null"
                      :icon="mdiChevronDown"
                      :aria-label="t('common.menu')"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      :title="t('proxies.testLatency')"
                      @click="
                        run(
                          () =>
                            proxies.testGroup(group.name, t('latency.testing')),
                          'latency.failed',
                        )
                      "
                    />
                    <v-list-item
                      :title="t('proxies.chooseManually')"
                      @click="manualGroup = group.name"
                    />
                  </v-list>
                </v-menu>
              </v-btn-group>
            </div>
            <NodeChips
              :rows="group.visible"
              :is-selected="(row) => nodes.inGroup(row, group.name)"
              :disabled="pending !== null"
              @toggle="toggle($event, group.name)"
            />
            <p
              v-if="!group.visible.length"
              class="md3-body-medium text-on-surface-variant ma-0"
            >
              {{
                t(
                  group.members.length
                    ? "proxyGroup.noMatch"
                    : "proxyGroup.emptyGroup",
                )
              }}
            </p>
          </v-card>
        </div>

        <section class="mt-8">
          <div class="d-flex flex-wrap align-center ga-3 mb-3">
            <h2 class="md3-title-medium">{{ t("common.nodes") }}</h2>
            <span class="md3-body-medium text-on-surface-variant">
              {{ t("operations.addTo") }}
            </span>
            <v-chip-group
              :model-value="store.outboundName"
              mandatory
              :disabled="pending !== null"
              @update:model-value="(v: string) => (store.outboundName = v)"
            >
              <v-chip
                v-for="g in store.outbounds"
                :key="g"
                :value="g"
                variant="outlined"
                filter
              >
                {{ g.toUpperCase() }}
              </v-chip>
            </v-chip-group>
          </div>
          <v-expansion-panels multiple variant="accordion" rounded="lg">
            <v-expansion-panel
              v-for="source in sources"
              :key="source.key"
              :value="source.key"
              bg-color="surface-container-low"
            >
              <v-expansion-panel-title class="md3-title-small">
                <span class="proxies__name">{{
                  source.name || t("server.server")
                }}</span>
                <v-chip size="x-small" variant="tonal" class="ms-3">{{
                  source.rows.length
                }}</v-chip>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <NodeChips
                  :rows="source.rows"
                  :is-selected="(row) => nodes.inGroup(row, store.outboundName)"
                  :disabled="pending !== null"
                  @toggle="toggle($event, store.outboundName)"
                />
                <p
                  v-if="!source.rows.length"
                  class="md3-body-medium text-on-surface-variant ma-0"
                >
                  {{ t(query ? "proxyGroup.noMatch" : "common.empty") }}
                </p>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </section>
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
.proxies__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.proxies__search {
  max-width: 480px;
}
.proxies__groups {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.proxies__groups--wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.proxies__name {
  overflow-wrap: anywhere;
  white-space: normal;
}
</style>
