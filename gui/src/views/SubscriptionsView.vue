<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import dayjs from "dayjs";
import {
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiPencilOutline,
  mdiRefresh,
  mdiShareVariantOutline,
  mdiTrayArrowDown,
  mdiRss,
} from "@mdi/js";
import { errorText } from "@/api/errors";
import type { TouchSubscription } from "@/api/types";
import { useConfirm, useDialog, useNotify } from "@/composables";
import ImportDialog from "@/dialogs/Import.vue";
import SharingDialog from "@/dialogs/Sharing.vue";
import SubscriptionDialog from "@/dialogs/Subscription.vue";
import { useSubscriptions } from "./subscriptions/model";

defineOptions({ name: "SubscriptionsView" });

// The backend writes the subscription's quota as "Used X / Y · Expires D"
// (server/service/subscription.go); read it back for the bar.
function usage(s: { info?: string }) {
  const m = /Used ([\d.]+ \w+) \/ ([\d.]+ \w+)(?: · Expires (\S+))?/.exec(
    s.info ?? "",
  );
  if (!m) return null;
  const percent = (parseFloat(m[1]) / parseFloat(m[2])) * 100;
  return {
    used: m[1],
    total: m[2],
    expires: m[3] ?? "",
    percent: Math.min(100, percent),
  };
}
const { t } = useI18n();
const { width } = useDisplay();
const expanded = computed(() => width.value >= 840);
const { open } = useDialog();
const confirm = useConfirm();
const notify = useNotify();
const model = useSubscriptions();
const { subscriptions, loading, loadError } = model;
const busy = ref(false);
const disabled = computed(() => busy.value || loading.value);

async function run(action: () => Promise<void>, failKey?: string) {
  if (busy.value) return;
  busy.value = true;
  try {
    await action();
  } catch (err) {
    const message = errorText(err);
    notify.warning(failKey ? t(failKey, { message }) : message);
  } finally {
    busy.value = false;
  }
}

async function update(subscription: TouchSubscription) {
  await run(async () => {
    await model.update(subscription);
    notify.success(t("subscription.updated"));
  }, "subscription.updateFailed");
}

async function remove(subscription: TouchSubscription) {
  await run(async () => {
    const ok = await confirm({
      title: t("delete.title"),
      message: t("delete.message", { n: 1 }),
      confirmText: t("operations.delete"),
      destructive: true,
    });
    if (ok) await model.remove(subscription);
  }, "delete.failed");
}

async function share(subscription: TouchSubscription) {
  await run(async () => {
    const link = await model.sharingLink(subscription);
    open(
      SharingDialog,
      {
        title: t("sharing.subscriptionTitle"),
        link,
        name: subscription.remarks || subscription.host,
        type: subscription._type,
      },
      { width: 420 },
    );
  }, "sharing.failed");
}

async function edit(subscription: TouchSubscription) {
  await run(async () => {
    const saved = await open<boolean>(
      SubscriptionDialog,
      { subscription },
      { width: 480 },
    ).result;
    if (saved) await model.sync();
  });
}

async function openImport() {
  await run(async () => {
    const imported = await open<boolean>(ImportDialog, {}, { width: 480 })
      .result;
    if (imported) await model.sync();
  });
}

onMounted(() => run(model.sync));
</script>

<template>
  <div class="subscriptions">
    <div v-if="subscriptions.length" class="d-flex justify-end mb-4">
      <v-btn
        color="primary"
        variant="flat"
        :prepend-icon="mdiTrayArrowDown"
        :disabled="disabled"
        @click="openImport"
      >
        {{ t("operations.import") }}
      </v-btn>
    </div>
    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" :disabled="disabled" @click="run(model.sync)">
          {{ t("operations.update") }}
        </v-btn>
      </template>
    </v-alert>

    <v-sheet
      v-if="loading && !subscriptions.length"
      color="surface-container-low"
      rounded="xl"
      class="pa-4"
    >
      <v-skeleton-loader type="article, article" />
    </v-sheet>

    <v-sheet
      v-else-if="!subscriptions.length && !loadError"
      color="surface-container-low"
      rounded="xl"
      :class="width < 600 ? 'pa-4' : 'pa-6'"
    >
      <v-empty-state
        :icon="mdiRss"
        :title="t('common.subscriptions')"
        :text="t('import.subscriptionMessage')"
      >
        <template #actions>
          <v-btn
            color="primary"
            :prepend-icon="mdiTrayArrowDown"
            :disabled="disabled"
            @click="openImport"
          >
            {{ t("operations.import") }}
          </v-btn>
        </template>
      </v-empty-state>
    </v-sheet>

    <v-row v-else-if="subscriptions.length" class="ma-n2">
      <v-col
        v-for="subscription in subscriptions"
        :key="subscription.id"
        :cols="expanded ? 6 : 12"
        class="pa-2"
      >
        <v-card
          color="surface-container-high"
          variant="flat"
          rounded="xl"
          class="h-100"
          :loading="disabled"
        >
          <v-card-item class="pa-4">
            <v-card-title class="md3-title-medium text-wrap">
              {{ subscription.remarks || subscription.host }}
            </v-card-title>
            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="mdiDotsVertical"
                    variant="text"
                    size="48"
                    :aria-label="t('operations.name')"
                    :disabled="disabled"
                  >
                    <v-icon :icon="mdiDotsVertical" size="18" />
                    <v-tooltip activator="parent" location="top">
                      {{ t("operations.name") }}
                    </v-tooltip>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item
                    :prepend-icon="mdiRefresh"
                    :title="t('operations.update')"
                    :disabled="disabled"
                    @click="update(subscription)"
                  />
                  <v-list-item
                    :prepend-icon="mdiPencilOutline"
                    :title="t('operations.modify')"
                    :disabled="disabled"
                    @click="edit(subscription)"
                  />
                  <v-list-item
                    :prepend-icon="mdiShareVariantOutline"
                    :title="t('operations.share')"
                    :disabled="disabled"
                    @click="share(subscription)"
                  />
                  <v-list-item
                    :prepend-icon="mdiDeleteOutline"
                    :title="t('operations.delete')"
                    :disabled="disabled"
                    @click="remove(subscription)"
                  />
                </v-list>
              </v-menu>
            </template>
          </v-card-item>
          <v-card-text class="px-4 pb-4 pt-0">
            <template v-if="usage(subscription)">
              <div class="d-flex justify-space-between md3-body-medium mb-1">
                <span dir="ltr"
                  >{{ usage(subscription)!.used }} /
                  {{ usage(subscription)!.total }}</span
                >
                <span class="text-on-surface-variant" dir="ltr">
                  {{ usage(subscription)!.expires }}
                </span>
              </div>
              <v-progress-linear
                :model-value="usage(subscription)!.percent"
                color="primary"
                bg-color="surface-container-highest"
                rounded
                height="6"
                class="mb-4"
              />
            </template>
            <p v-else-if="subscription.info" class="md3-body-medium mb-4">
              {{ subscription.info }}
            </p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip size="small" variant="tonal">
                {{ t("subscription.numberServers") }}:
                {{ subscription.servers.length }}
              </v-chip>
              <v-chip size="small" variant="outlined">
                <span dir="ltr">{{
                  dayjs(subscription.status).format("YYYY-MM-DD HH:mm")
                }}</span>
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.subscriptions {
  padding-bottom: 96px;
  overflow-wrap: anywhere;
}
</style>
