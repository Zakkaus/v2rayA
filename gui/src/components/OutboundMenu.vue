<script setup lang="ts">
// The outbound groups: a chip naming the current one, a menu to switch,
// add (a prompt) and delete (a confirmation). Membership is edited from
// the node list (add to group) and the group dialog.
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  mdiCheck,
  mdiDeleteOutline,
  mdiPlus,
  mdiSitemapOutline,
} from "@mdi/js";
import { deleteOutbound, getOutbounds, postOutbound } from "@/api";
import { errorText } from "@/api/errors";
import { watchConnected } from "@/api/connect";
import { useConfirm, useNotify, usePrompt } from "@/composables";
import { useAppStore } from "@/stores/app";

defineProps<{
  /** list item in the drawer instead of a chip */
  variant?: "chip" | "list";
}>();
const emit = defineEmits<{ changed: [] }>();
const { t } = useI18n();
const store = useAppStore();
const notify = useNotify();
const prompt = usePrompt();
const confirm = useConfirm();
const open = ref(false);

async function add() {
  const outbound = await prompt({
    message: t("outbound.addMessage"),
    input: { maxlength: 10 },
  });
  if (outbound === null) return;
  const control = new AbortController();
  try {
    const res = await watchConnected(
      postOutbound({ outbound }, { signal: control.signal }),
      () => control.abort(),
    );
    if (res) {
      notify.success(t("outbound.added"));
      store.setOutbounds((res as { outbounds: unknown }).outbounds);
    } else {
      store.setOutbounds((await getOutbounds()).outbounds);
    }
  } catch (err) {
    notify.warning(t("outbound.addFailed", { message: errorText(err) }));
  }
}

async function remove(outbound: string) {
  const ok = await confirm({
    message: t("outbound.deleteMessage", { outboundName: outbound }),
    confirmText: t("operations.delete"),
    destructive: true,
  });
  if (!ok) return;
  try {
    const res = (await deleteOutbound({ outbound })) as { outbounds: unknown };
    notify.success(t("outbound.deleted"));
    store.setOutbounds(res.outbounds);
    emit("changed");
  } catch (err) {
    notify.warning(
      t("outbound.deleteFailed", { group: outbound, message: errorText(err) }),
    );
  }
}
</script>

<template>
  <v-menu v-model="open" :close-on-content-click="false">
    <template #activator="{ props: menu }">
      <v-list-item
        v-if="variant === 'list'"
        v-bind="menu"
        :prepend-icon="mdiSitemapOutline"
        :title="t('common.proxyGroups')"
        :subtitle="store.outboundName.toUpperCase()"
        rounded="xl"
      />
      <v-chip
        v-else
        v-bind="menu"
        :prepend-icon="mdiSitemapOutline"
        color="tertiary"
        variant="tonal"
        size="large"
        class="md3-label-large"
      >
        {{ store.outboundName.toUpperCase() }}
      </v-chip>
    </template>
    <v-list density="compact" min-width="240" rounded="lg">
      <v-list-subheader>{{ t("common.proxyGroups") }}</v-list-subheader>
      <v-list-item
        v-for="outbound in store.outbounds"
        :key="outbound"
        :active="outbound === store.outboundName"
        :title="outbound.toUpperCase()"
        @click="
          store.outboundName = outbound;
          open = false;
        "
      >
        <template #prepend>
          <v-icon
            :icon="mdiCheck"
            :class="{ invisible: outbound !== store.outboundName }"
          />
        </template>
        <template v-if="outbound !== 'proxy'" #append>
          <v-btn
            :icon="mdiDeleteOutline"
            variant="text"
            size="small"
            :aria-label="t('operations.delete')"
            @click.stop="remove(outbound)"
          />
        </template>
      </v-list-item>
      <v-divider class="my-1" />
      <v-list-item
        :prepend-icon="mdiPlus"
        :title="t('operations.create')"
        @click="add"
      />
    </v-list>
  </v-menu>
</template>

<style scoped>
.invisible {
  visibility: hidden;
}
</style>
