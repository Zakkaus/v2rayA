<script setup lang="ts">
// One list of nodes — the servers, or a subscription's — as a data table
// with selection, sorting, paging and the row's actions: connect or the
// groups it belongs to, edit or view, share. Rows of the current outbound
// that are connected are tinted. Compact windows get the stacked rows.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiCheck,
  mdiEyeOutline,
  mdiLinkVariant,
  mdiLinkVariantOff,
  mdiPencilOutline,
  mdiShareVariantOutline,
  mdiSitemapOutline,
} from "@mdi/js";
import { useAppStore } from "@/stores/app";
import {
  compareConnection,
  compareLatency,
  rowKey,
  type Row,
  type Selectable,
} from "./model";

const props = defineProps<{
  rows: Row[];
  /** a subscription's nodes: viewed, not edited */
  readonly?: boolean;
  /** the row to flash after "locate" */
  highlight?: string;
  inGroup: (row: Row, group: string) => boolean;
}>();
const emit = defineEmits<{
  connect: [row: Row];
  disconnect: [row: Row];
  toggleGroup: [row: Row, group: string];
  edit: [row: Row];
  share: [row: Row];
}>();
const selected = defineModel<Selectable[]>("selected", { required: true });
const { t } = useI18n();
const { width } = useDisplay();
const store = useAppStore();
const compact = computed(() => width.value < 600);

const headers = computed(() => [
  { title: "ID", key: "id", align: "end" as const, width: 64 },
  { title: t("server.name"), key: "name", minWidth: 160 },
  { title: t("server.address"), key: "address", width: 200 },
  { title: t("server.protocol"), key: "net", width: 130 },
  {
    title: t("server.latency"),
    key: "pingLatency",
    width: 110,
    sortRaw: (a: Row, b: Row) => compareLatency(a, b),
  },
  {
    title: t("operations.name"),
    key: "actions",
    align: "end" as const,
    width: 140,
    sortRaw: (a: Row, b: Row) => compareConnection(a, b),
  },
]);

function rowProps({ item }: { item: Row }) {
  return {
    class: {
      "row--connected": item.connected,
      "row--flash": props.highlight === rowKey(item),
    },
    "data-row": rowKey(item),
  };
}
</script>

<template>
  <v-data-table
    v-model="selected"
    :headers="headers"
    :items="rows"
    :item-value="rowKey"
    return-object
    show-select
    :items-per-page="100"
    :sort-by="[{ key: 'id', order: 'asc' }]"
    :mobile="compact"
    :row-props="rowProps"
    hover
    class="bg-transparent node-table"
  >
    <template #item.address="{ value }">
      <span
        class="text-truncate d-inline-block address"
        dir="ltr"
        :title="value"
        >{{ value }}</span
      >
    </template>
    <template #item.pingLatency="{ value }">
      <span
        class="md3-label-large"
        :class="
          String(value).endsWith('ms')
            ? 'text-primary'
            : 'text-on-surface-variant'
        "
        >{{ value }}</span
      >
    </template>
    <template #item.actions="{ item }">
      <div class="d-flex justify-end ga-1">
        <v-menu v-if="store.loadBalanceValid">
          <template #activator="{ props: menu }">
            <v-tooltip :text="t('operations.addTo')">
              <template #activator="{ props: tip }">
                <v-btn
                  v-bind="{ ...menu, ...tip }"
                  :icon="mdiSitemapOutline"
                  variant="text"
                  size="small"
                  :color="item.connected ? 'primary' : undefined"
                  :aria-label="t('operations.addTo')"
                />
              </template>
            </v-tooltip>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item
              v-for="group in store.outbounds"
              :key="group"
              :title="group.toUpperCase()"
              @click="emit('toggleGroup', item, group)"
            >
              <template #prepend>
                <v-icon
                  :icon="mdiCheck"
                  :class="{ invisible: !inGroup(item, group) }"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-tooltip
          v-else
          :text="
            item.connected
              ? t('operations.disconnect')
              : t('operations.connect')
          "
        >
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="item.connected ? mdiLinkVariantOff : mdiLinkVariant"
              variant="text"
              size="small"
              :color="item.connected ? 'primary' : undefined"
              :aria-label="
                item.connected
                  ? t('operations.disconnect')
                  : t('operations.connect')
              "
              @click="
                item.connected
                  ? emit('disconnect', item)
                  : emit('connect', item)
              "
            />
          </template>
        </v-tooltip>
        <v-tooltip
          :text="readonly ? t('operations.view') : t('operations.modify')"
        >
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="readonly ? mdiEyeOutline : mdiPencilOutline"
              variant="text"
              size="small"
              :aria-label="
                readonly ? t('operations.view') : t('operations.modify')
              "
              @click="emit('edit', item)"
            />
          </template>
        </v-tooltip>
        <v-tooltip :text="t('operations.share')">
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="mdiShareVariantOutline"
              variant="text"
              size="small"
              :aria-label="t('operations.share')"
              @click="emit('share', item)"
            />
          </template>
        </v-tooltip>
      </div>
    </template>
  </v-data-table>
</template>

<style scoped>
.address {
  max-width: 180px;
  vertical-align: middle;
}
.invisible {
  visibility: hidden;
}
.node-table :deep(.row--connected) {
  background: rgba(var(--v-theme-primary), 0.08);
}
.node-table :deep(.row--flash) {
  animation: flash 1.2s cubic-bezier(0.2, 0, 0, 1);
}
@keyframes flash {
  0%,
  100% {
    background: transparent;
  }
  30%,
  70% {
    background: rgba(var(--v-theme-primary), 0.24);
  }
}
</style>
