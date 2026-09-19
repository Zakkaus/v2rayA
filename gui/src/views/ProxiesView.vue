<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiCogOutline,
  mdiMagnify,
  mdiPlus,
  mdiRss,
  mdiServerNetworkOutline,
  mdiSpeedometer,
  mdiTrayArrowDown,
  mdiViewGridOutline,
  mdiViewListOutline,
} from "@mdi/js";
import OutboundMenu from "@/components/OutboundMenu.vue";
import { rowKey } from "./nodes/model";
import { useProxies } from "./proxies/model";
import NodeCard from "./proxies/NodeCard.vue";
import NodeListItem from "./proxies/NodeListItem.vue";
import SubscriptionCard from "./proxies/SubscriptionCard.vue";

defineOptions({ name: "ProxiesView" });
const { t } = useI18n();
const { width } = useDisplay();
const expanded = computed(() => width.value >= 840);
const model = useProxies();
const {
  query,
  source,
  sources,
  membersOnly,
  view,
  loading,
  loadError,
  busy,
  testing,
  rows,
  subscriptions,
  members,
  mode,
  listed,
  selected,
  selectedKeys,
  allSelected,
  canDelete,
  preferred,
  sync,
} = model;
const disabled = computed(() => busy.value || loading.value);
defineExpose({ sync });
onMounted(sync);
</script>

<template>
  <div class="proxies" :class="{ 'proxies--expanded': expanded }">
    <div class="proxies__toolbar">
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
        class="proxies__search"
        @click:clear="query = ''"
      />
      <v-spacer />
      <v-btn
        variant="text"
        :prepend-icon="mdiPlus"
        :disabled="disabled"
        @click="model.newGroup"
        >{{ t("proxies.newGroup") }}</v-btn
      >
      <v-btn
        variant="outlined"
        :prepend-icon="mdiPlus"
        :disabled="disabled"
        @click="model.newNode"
        >{{ t("proxies.newNode") }}</v-btn
      >
      <v-btn
        v-if="rows.length || loading || loadError"
        variant="flat"
        color="primary"
        :prepend-icon="mdiTrayArrowDown"
        :disabled="disabled"
        @click="model.importNodes"
        >{{ t("operations.import") }}</v-btn
      >
    </div>
    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append
        ><v-btn variant="text" @click="sync">{{
          t("operations.update")
        }}</v-btn></template
      >
    </v-alert>
    <v-skeleton-loader
      v-if="loading && !rows.length"
      type="card, card"
      class="bg-transparent"
    />
    <template v-else-if="!loadError || rows.length">
      <section class="mb-6">
        <div class="d-flex align-center ga-2 mb-4">
          <h2 class="md3-title-medium">{{ t("common.subscriptions") }}</h2>
          <v-spacer />
          <v-btn
            variant="text"
            :prepend-icon="mdiCogOutline"
            :disabled="disabled"
            @click="model.subscriptionSettings"
            >{{ t("proxies.autoUpdate") }}</v-btn
          >
        </div>
        <div v-if="subscriptions.length" class="proxies__subscriptions">
          <SubscriptionCard
            v-for="subscription in subscriptions"
            :key="subscription.address"
            :subscription="subscription"
            :disabled="disabled"
            @action="model.subscriptionAction(subscription, $event)"
          />
        </div>
        <v-card v-else variant="outlined" rounded="xl">
          <v-empty-state :icon="mdiRss" :text="t('import.subscriptionMessage')">
            <template #actions
              ><v-btn
                variant="tonal"
                :disabled="disabled"
                @click="model.importNodes"
                >{{ t("operations.import") }}</v-btn
              ></template
            >
          </v-empty-state>
        </v-card>
      </section>
      <section>
        <h2 class="md3-title-medium mb-4">
          {{ t("common.nodes") }} · {{ rows.length }}
        </h2>
        <div class="proxies__filters mb-4">
          <v-chip-group v-model="source" mandatory class="proxies__sources">
            <v-chip
              v-for="item in sources"
              :key="item.value"
              :value="item.value"
              variant="outlined"
              filter
              >{{ item.title }}</v-chip
            >
          </v-chip-group>
          <v-chip
            :model-value="true"
            :aria-pressed="membersOnly"
            :variant="membersOnly ? 'tonal' : 'outlined'"
            @click="membersOnly = !membersOnly"
            >{{ t("proxies.membersOnly") }}</v-chip
          >
          <v-spacer />
          <OutboundMenu variant="chip" @changed="sync" />
          <v-btn
            variant="tonal"
            :prepend-icon="mdiSpeedometer"
            :loading="testing"
            :disabled="disabled || !listed.length"
            @click="model.testListed()"
            >{{ t("proxies.testLatency") }}</v-btn
          >
          <v-btn-toggle
            v-model="view"
            mandatory
            divided
            variant="outlined"
            rounded="xl"
            selected-class="bg-secondary-container text-on-secondary-container"
            :aria-label="t('operations.view')"
          >
            <v-btn value="cards" :prepend-icon="mdiViewGridOutline">{{
              t("proxies.cards")
            }}</v-btn>
            <v-btn value="list" :prepend-icon="mdiViewListOutline">{{
              t("proxies.list")
            }}</v-btn>
          </v-btn-toggle>
        </div>
        <div
          v-if="members.length >= 2"
          class="d-flex flex-wrap align-center ga-2 mb-4"
        >
          <v-btn-toggle
            :model-value="mode"
            mandatory
            divided
            variant="outlined"
            rounded="xl"
            :disabled="disabled"
            selected-class="bg-secondary-container text-on-secondary-container"
            @update:model-value="model.setMode"
          >
            <v-btn value="auto">{{ t("proxies.mode.auto") }}</v-btn>
            <v-btn value="manual">{{ t("proxies.mode.manual") }}</v-btn>
          </v-btn-toggle>
          <span
            v-if="mode === 'manual' && !model.selectedMember.value"
            class="md3-body-small text-on-surface-variant"
            >{{ t("proxies.chooseManually") }} ·
            {{ t("proxies.useThis") }}</span
          >
          <span
            v-if="mode === 'auto' && preferred"
            class="md3-body-medium"
            dir="auto"
            >{{ preferred.name }}</span
          >
        </div>
        <v-empty-state
          v-if="!rows.length"
          :icon="mdiServerNetworkOutline"
          :title="t('common.empty')"
          :text="t('import.subscriptionMessage')"
        >
          <template #actions
            ><v-btn
              variant="flat"
              color="primary"
              :disabled="disabled"
              @click="model.importNodes"
              >{{ t("operations.import") }}</v-btn
            ></template
          >
        </v-empty-state>
        <v-empty-state
          v-else-if="!listed.length"
          :title="t('proxyGroup.noMatch')"
        />
        <div v-else-if="view === 'cards'" class="proxies__cards">
          <NodeCard
            v-for="row in listed"
            :key="rowKey(row)"
            :row="row"
            :source="model.sourceName(row)"
            :member="model.isMember(row)"
            :selected="model.isSelected(row)"
            :in-use="!!preferred && rowKey(preferred) === rowKey(row)"
            :disabled="disabled"
            :testing="testing"
            @toggle="model.toggleGroup(row)"
            @action="model.nodeAction(row, $event)"
          />
        </div>
        <template v-else>
          <div class="proxies__batch mb-2">
            <v-checkbox-btn
              :model-value="allSelected"
              :indeterminate="selected.length > 0 && !allSelected"
              :aria-label="t('proxies.selectAll')"
              :disabled="disabled"
              @update:model-value="model.selectAll(!!$event)"
            />
            <span class="md3-label-large">{{
              t("common.selectedCount", { n: selected.length })
            }}</span>
            <template v-if="selected.length">
              <v-btn
                variant="text"
                :disabled="disabled || testing"
                @click="model.testRows(selected)"
                >{{ t("proxies.testLatency") }}</v-btn
              >
              <v-btn
                variant="text"
                :disabled="disabled"
                @click="model.batchMembership(true)"
                >{{ t("proxies.addToGroup") }}</v-btn
              >
              <v-btn
                variant="text"
                :disabled="disabled"
                @click="model.batchMembership(false)"
                >{{ t("proxies.removeFromGroup") }}</v-btn
              >
              <v-tooltip
                :disabled="canDelete"
                :text="t('proxies.deleteSubscriptionNodes')"
              >
                <template #activator="{ props }"
                  ><span v-bind="props" :tabindex="canDelete ? undefined : 0"
                    ><v-btn
                      variant="text"
                      :disabled="disabled || !canDelete"
                      @click="model.removeRows(selected)"
                      >{{ t("operations.delete") }}</v-btn
                    ></span
                  ></template
                >
              </v-tooltip>
              <v-btn
                variant="text"
                :disabled="disabled"
                @click="model.exportSelected"
                >{{ t("operations.export") }}</v-btn
              >
            </template>
          </div>
          <v-list
            bg-color="surface-container-low"
            rounded="xl"
            class="proxies__list"
          >
            <NodeListItem
              v-for="row in listed"
              :key="rowKey(row)"
              :row="row"
              :source="model.sourceName(row)"
              :member="model.isMember(row)"
              :selected="model.isSelected(row)"
              :in-use="!!preferred && rowKey(preferred) === rowKey(row)"
              :checked="selectedKeys.includes(rowKey(row))"
              :disabled="disabled"
              :testing="testing"
              @toggle="model.toggleGroup(row)"
              @check="model.selectRow(row, $event)"
              @action="model.nodeAction(row, $event)"
            />
          </v-list>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.proxies {
  padding-bottom: 96px;
}
.proxies__toolbar,
.proxies__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.proxies__toolbar {
  margin-bottom: 24px;
}
.proxies__search {
  flex: 1 1 280px;
  max-width: 480px;
}
.proxies__sources {
  max-width: 100%;
}
.proxies__subscriptions,
.proxies__cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.proxies__subscriptions {
  gap: 16px;
}
.proxies__cards {
  gap: 12px;
}
.proxies--expanded .proxies__subscriptions {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
.proxies--expanded .proxies__cards {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.proxies__batch {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow-x: auto;
  min-height: 48px;
}
.proxies__batch > * {
  flex-shrink: 0;
}
.proxies__batch :deep(.v-selection-control) {
  flex: 0 0 48px;
}
.proxies :deep(.v-btn) {
  min-height: 48px;
}
.proxies :deep(.v-chip--link) {
  min-height: 48px;
}
.proxies :deep(.node-menu),
.proxies :deep(.subscription-card__menu) {
  min-height: 40px;
}
</style>
