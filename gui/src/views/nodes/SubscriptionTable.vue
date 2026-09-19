<script setup lang="ts">
// The subscriptions as a data table: host, remarks, when it was last
// updated, how many nodes; per row: update, edit, share.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import { mdiPencilOutline, mdiRefresh, mdiShareVariantOutline } from "@mdi/js";
import type { TouchSubscription } from "@/api/types";
import { rowKey, type Selectable } from "./model";

defineProps<{ rows: TouchSubscription[] }>();
const emit = defineEmits<{
  update: [row: TouchSubscription];
  edit: [row: TouchSubscription];
  share: [row: TouchSubscription];
}>();
const selected = defineModel<Selectable[]>("selected", { required: true });
const { t } = useI18n();
const { width } = useDisplay();
const compact = computed(() => width.value < 600);

const headers = computed(() => [
  { title: "ID", key: "id", align: "end" as const, width: 72 },
  { title: t("subscription.host"), key: "host" },
  { title: t("subscription.remarks"), key: "remarks" },
  { title: t("subscription.timeLastUpdate"), key: "status", width: 200 },
  {
    title: t("subscription.numberServers"),
    key: "servers",
    align: "end" as const,
    width: 120,
    sortRaw: (a: TouchSubscription, b: TouchSubscription) =>
      a.servers.length - b.servers.length,
  },
  {
    title: t("operations.name"),
    key: "actions",
    align: "end" as const,
    width: 140,
    sortable: false,
  },
]);
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
    hover
    class="bg-transparent"
  >
    <template #item.host="{ value }">
      <span dir="ltr">{{ value }}</span>
    </template>
    <template #item.servers="{ value }">
      {{ value.length }}
    </template>
    <template #item.actions="{ item }">
      <div class="d-flex justify-end ga-1">
        <v-tooltip :text="t('operations.update')">
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="mdiRefresh"
              variant="text"
              size="small"
              :aria-label="t('operations.update')"
              @click="emit('update', item)"
            />
          </template>
        </v-tooltip>
        <v-tooltip :text="t('operations.modify')">
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="mdiPencilOutline"
              variant="text"
              size="small"
              :aria-label="t('operations.modify')"
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
