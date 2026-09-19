<script setup lang="ts">
// The node page, laid out list-detail: the tables (subscriptions, the
// servers, one tab per subscription) with a contextual toolbar while
// rows are selected, the connected nodes' status as the supporting pane
// (a horizontal card row below 840 dp), and the extended FAB for import.
import { computed, nextTick, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import dayjs from "dayjs";
import {
  mdiClose,
  mdiDeleteOutline,
  mdiExportVariant,
  mdiPlus,
  mdiSpeedometer,
  mdiTrayArrowDown,
  mdiWeb,
} from "@mdi/js";
import { getSharingAddress } from "@/api";
import { errorText } from "@/api/errors";
import type { TouchSubscription, Which } from "@/api/types";
import { useConfirm, useDialog, useNotify } from "@/composables";
import ImportDialog from "@/dialogs/Import.vue";
import ServerDialog from "@/dialogs/Server/index.vue";
import SharingDialog from "@/dialogs/Sharing.vue";
import SubscriptionDialog from "@/dialogs/Subscription.vue";
import { useAppStore } from "@/stores/app";
import NodeTable from "./nodes/NodeTable.vue";
import StatusCards from "./nodes/StatusCards.vue";
import SubscriptionTable from "./nodes/SubscriptionTable.vue";
import { rowKey, useNodes, whichOf, type Row, type Tab } from "./nodes/model";

defineOptions({ name: "NodesView" });
const { t } = useI18n();
const store = useAppStore();
const notify = useNotify();
const confirm = useConfirm();
const { open } = useDialog();
const { width } = useDisplay();
// two panes only from 1200 dp: the table needs the width below that
const expanded = computed(() => width.value >= 1200);
const nodes = useNodes();
const {
  touch,
  ready,
  selected,
  tab,
  isEmpty,
  connectedRows,
  connectedTabs,
  canTest,
  canDelete,
} = nodes;
const highlight = ref("");

defineExpose({ sync: nodes.sync });
onMounted(() => nodes.load());

const currentSubscription = computed<TouchSubscription | null>(() => {
  const m = /^sub-(\d+)$/.exec(tab.value);
  return m ? (touch.value.subscriptions[Number(m[1])] ?? null) : null;
});
const subscriptionTitle = (s: TouchSubscription) =>
  (s.remarks || s.host).toUpperCase();

function subscriptionName(which: Which): string | null {
  if (which._type !== "subscriptionServer") return null;
  return touch.value.subscriptions[which.sub ?? -1]?.host.toUpperCase() ?? null;
}

// ---- the rows' actions --------------------------------------------------------

async function run(action: () => Promise<void>, failKey: string, params = {}) {
  try {
    await action();
  } catch (err) {
    notify.warning(t(failKey, { ...params, message: errorText(err) }));
  }
}

const connect = (row: Row) =>
  run(() => nodes.connect(row), "connection.connectFailed");
const disconnect = (row: Row) =>
  run(() => nodes.disconnect(row), "connection.disconnectFailed");
const toggleGroup = (row: Row, group: string) =>
  run(() => nodes.toggleGroup(row, group), "proxyGroup.updateFailed", {
    group,
  });

async function edit(row: Row | null, readonly = false) {
  const saved = await open<boolean>(
    ServerDialog,
    { which: row ? whichOf(row) : null, readonly },
    { width: 560 },
  ).result;
  if (saved) await nodes.sync();
}

async function share(row: Row | TouchSubscription) {
  try {
    const { sharingAddress } = await getSharingAddress(whichOf(row));
    open(
      SharingDialog,
      {
        title: t(
          row._type === "subscription"
            ? "sharing.subscriptionTitle"
            : "sharing.serverTitle",
        ),
        link: sharingAddress,
        name: "name" in row ? row.name || row.address : row.remarks || row.host,
        type: row._type,
      },
      { width: 420 },
    );
  } catch (err) {
    notify.warning(t("sharing.failed", { message: errorText(err) }));
  }
}

async function updateSubscription(s: TouchSubscription) {
  await run(async () => {
    await nodes.updateSubscription(s);
    notify.success(t("subscription.updated"));
  }, "subscription.updateFailed");
}

async function editSubscription(s: TouchSubscription) {
  const saved = await open<boolean>(
    SubscriptionDialog,
    { subscription: s },
    { width: 480 },
  ).result;
  if (saved) await nodes.sync();
}

async function openImport() {
  const imported = await open<boolean>(ImportDialog, {}, { width: 480 }).result;
  if (imported) await nodes.sync();
}

// ---- the selection's actions ----------------------------------------------------

async function testLatency(http: boolean) {
  const reminder = setTimeout(() => notify.info(t("latency.message")), 12_000);
  await run(
    () => nodes.testLatency(http, t("latency.testing")),
    "latency.failed",
  );
  clearTimeout(reminder);
}

async function deleteSelected() {
  const ok = await confirm({
    title: t("delete.title"),
    message: t("delete.message", { n: selected.value.length }),
    confirmText: t("operations.delete"),
    destructive: true,
  });
  if (ok) await run(() => nodes.deleteSelected(), "delete.failed");
}

async function exportSelected(mode: "copy" | "download") {
  try {
    const links = await nodes.sharingLinks();
    if (!links.length) throw new Error(t("operations.exportEmpty"));
    const text = links.join("\n");
    if (mode === "copy") {
      await navigator.clipboard.writeText(text);
      notify.success(t("operations.copySelectedDone"));
    } else {
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/plain;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dayjs().format("YYYYMMDD-HHmmss-SSS")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      notify.success(t("operations.downloadTxtDone"));
    }
  } catch (err) {
    notify.warning(t("operations.exportFailed", { message: errorText(err) }));
  }
}

// ---- locate a connected node from its card --------------------------------------

async function locate(which: Which) {
  tab.value = which._type === "server" ? "servers" : `sub-${which.sub ?? 0}`;
  await nextTick();
  const row = connectedRows.value.find((c) => c.which === which)?.row;
  if (!row) return;
  highlight.value = rowKey(row);
  document
    .querySelector(`[data-row="${CSS.escape(highlight.value)}"]`)
    ?.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => (highlight.value = ""), 1300);
}

const tabs = computed<{ value: Tab; title: string }[]>(() => [
  { value: "subscriptions", title: t("subscription.subscription") },
  { value: "servers", title: t("server.server") },
  ...touch.value.subscriptions.map((s, i) => ({
    value: `sub-${i}` as Tab,
    title: subscriptionTitle(s),
  })),
]);
</script>

<template>
  <div class="nodes">
    <v-alert
      v-if="ready && store.coreVersionValid === false"
      type="error"
      variant="tonal"
      rounded="lg"
      class="mb-4"
      :text="t('version.coreVersionMismatch', { err: store.coreVersionErr })"
    />

    <v-sheet
      v-if="!ready"
      color="surface-container-low"
      rounded="xl"
      class="pa-4"
    >
      <v-skeleton-loader
        type="table-heading, table-tbody"
        class="bg-transparent"
      />
    </v-sheet>

    <v-sheet
      v-else-if="isEmpty"
      color="surface-container-low"
      rounded="xl"
      class="pa-6"
    >
      <v-empty-state
        :icon="mdiWeb"
        :headline="t('welcome.title')"
        :title="t('welcome.messages.0')"
        :text="t('welcome.messages.1')"
      >
        <template #actions>
          <v-btn variant="tonal" :prepend-icon="mdiPlus" @click="edit(null)">
            {{ t("operations.create") }}
          </v-btn>
          <v-btn
            color="primary"
            :prepend-icon="mdiTrayArrowDown"
            @click="openImport"
          >
            {{ t("operations.import") }}
          </v-btn>
        </template>
      </v-empty-state>
    </v-sheet>

    <div
      v-else
      class="nodes__layout"
      :class="{ 'nodes__layout--wide': expanded }"
    >
      <div class="nodes__main">
        <StatusCards
          v-if="!expanded && connectedRows.length"
          :items="connectedRows"
          :status-of="nodes.statusOf"
          :subscription-name="subscriptionName"
          horizontal
          class="mb-4"
          @locate="locate"
        />

        <!-- selection mode: the contextual toolbar replaces the tabs -->
        <v-toolbar
          v-if="selected.length"
          color="surface-container-high"
          rounded="xl"
          density="comfortable"
          class="mb-3 px-1"
        >
          <v-btn
            :icon="mdiClose"
            variant="text"
            :aria-label="t('operations.cancel')"
            @click="selected = []"
          />
          <v-toolbar-title class="md3-title-medium">
            {{ t("common.selectedCount", { n: selected.length }) }}
          </v-toolbar-title>
          <v-btn
            v-if="canTest"
            variant="text"
            :prepend-icon="mdiSpeedometer"
            @click="testLatency(false)"
            >{{ t("operations.ping") }}</v-btn
          >
          <v-btn
            v-if="canTest"
            variant="text"
            :prepend-icon="mdiWeb"
            @click="testLatency(true)"
            >HTTP</v-btn
          >
          <v-menu>
            <template #activator="{ props: menu }">
              <v-btn
                v-bind="menu"
                variant="text"
                :prepend-icon="mdiExportVariant"
              >
                {{ t("operations.export") }}
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                :title="t('operations.copySelected')"
                @click="exportSelected('copy')"
              />
              <v-list-item
                :title="t('operations.downloadTxt')"
                @click="exportSelected('download')"
              />
            </v-list>
          </v-menu>
          <v-btn
            v-if="canDelete"
            variant="text"
            color="error"
            :prepend-icon="mdiDeleteOutline"
            @click="deleteSelected"
            >{{ t("operations.delete") }}</v-btn
          >
        </v-toolbar>
        <div v-else class="d-flex align-center mb-3 ga-2">
          <v-tabs v-model="tab" show-arrows color="primary" class="flex-grow-1">
            <v-tab
              v-for="item in tabs"
              :key="item.value"
              :value="item.value"
              class="text-none"
            >
              <v-badge
                v-if="connectedTabs.has(item.value)"
                dot
                color="primary"
                inline
                class="me-1"
              />
              {{ item.title }}
            </v-tab>
          </v-tabs>
          <v-btn
            variant="tonal"
            :prepend-icon="mdiPlus"
            class="flex-shrink-0"
            @click="edit(null)"
          >
            {{ t("operations.create") }}
          </v-btn>
        </div>

        <v-sheet
          color="surface-container-low"
          rounded="xl"
          class="pa-2 pa-sm-4"
        >
          <template v-if="tab === 'subscriptions'">
            <SubscriptionTable
              v-model:selected="selected"
              :rows="touch.subscriptions"
              @update="updateSubscription"
              @edit="editSubscription"
              @share="share"
            />
          </template>
          <template v-else-if="tab === 'servers'">
            <NodeTable
              v-model:selected="selected"
              :rows="touch.servers"
              :highlight="highlight"
              :in-group="nodes.inGroup"
              @connect="connect"
              @disconnect="disconnect"
              @toggle-group="toggleGroup"
              @edit="(row) => edit(row)"
              @share="share"
            />
          </template>
          <template v-else-if="currentSubscription">
            <div class="d-flex flex-wrap align-center ga-2 px-2 pb-2">
              <span class="md3-title-small" dir="ltr">
                {{ currentSubscription.host.toUpperCase() }} ({{
                  currentSubscription.servers.length
                }})
              </span>
              <span
                v-if="currentSubscription.info"
                class="md3-body-small text-on-surface-variant"
              >
                {{ currentSubscription.info }}
              </span>
            </div>
            <NodeTable
              v-model:selected="selected"
              :rows="currentSubscription.servers"
              :highlight="highlight"
              :in-group="nodes.inGroup"
              readonly
              @connect="connect"
              @disconnect="disconnect"
              @toggle-group="toggleGroup"
              @edit="(row) => edit(row, true)"
              @share="share"
            />
          </template>
        </v-sheet>
      </div>

      <aside v-if="expanded && connectedRows.length" class="nodes__side">
        <StatusCards
          :items="connectedRows"
          :status-of="nodes.statusOf"
          :subscription-name="subscriptionName"
          @locate="locate"
        />
      </aside>
    </div>

    <v-fab
      v-if="ready && !isEmpty"
      :icon="mdiTrayArrowDown"
      :text="t('operations.import')"
      extended
      app
      location="bottom end"
      color="primary-container"
      class="nodes__fab"
      @click="openImport"
    />
  </div>
</template>

<style scoped>
.nodes__layout--wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}
.nodes__side {
  position: sticky;
  top: 24px;
}
</style>
