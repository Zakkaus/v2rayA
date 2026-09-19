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
          color="surface-container-low"
          variant="flat"
          rounded="lg"
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
          <v-card-text class="px-4 pb-4 pt-0 md3-body-medium">
            <p v-if="subscription.info" class="mb-4 text-pre-wrap">
              {{ subscription.info }}
            </p>
            <p class="text-on-surface-variant">
              {{ t("subscription.timeLastUpdate") }}:
              <span dir="ltr">
                {{ dayjs(subscription.status).format("YYYY-MM-DD HH:mm:ss") }}
              </span>
            </p>
            <p class="mt-2 text-on-surface-variant">
              {{ t("subscription.numberServers") }}:
              {{ subscription.servers.length }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-fab
      v-if="subscriptions.length"
      :prepend-icon="mdiTrayArrowDown"
      :text="t('operations.import')"
      extended
      app
      location="bottom end"
      color="primary-container"
      :disabled="disabled"
      @click="openImport"
    />
  </div>
</template>

<style scoped>
.subscriptions {
  padding-bottom: 96px;
  overflow-wrap: anywhere;
}
</style>
