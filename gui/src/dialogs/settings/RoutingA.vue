<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mdiOpenInNew } from "@mdi/js";
import { getRoutingA, putRoutingA } from "@/api";
import { errorText } from "@/api/errors";
import { useConfirm, useNotify } from "@/composables";

defineOptions({ name: "RoutingADialog" });
const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const confirm = useConfirm();
const notify = useNotify();
const routingA = ref("");
const hasInboundDef = ref(false);
const loading = ref(true);
const saving = ref(false);

watch(routingA, (value) => {
  hasInboundDef.value = value.split("\n").some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("inbound(") || trimmed.startsWith("inbound (");
  });
});

onMounted(async () => {
  try {
    const res = await getRoutingA();
    routingA.value = res.routingA;
  } catch (err) {
    notify.warning(errorText(err));
    emit("close");
  } finally {
    loading.value = false;
  }
});

async function save() {
  if (loading.value || saving.value) return;
  saving.value = true;
  try {
    if (
      hasInboundDef.value &&
      !(await confirm({
        message: t("routingA.inboundDeprecatedConfirm"),
        confirmText: t("operations.save"),
        cancelText: t("operations.cancel"),
      }))
    )
      return;
    const res = await putRoutingA({ routingA: routingA.value });
    if (res && typeof res === "object" && "warning" in res && res.warning) {
      notify.warning(t("routingA.savedWithWarning", { warning: res.warning }), {
        timeout: 8000,
      });
    }
    emit("close");
  } catch (err) {
    notify.warning(t("routingA.saveFailed", { message: errorText(err) }));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <v-card>
    <v-card-item class="px-6 pt-6 pb-2">
      <v-card-title class="md3-headline-small pa-0">RoutingA</v-card-title>
    </v-card-item>
    <v-card-text class="px-6">
      <v-alert
        v-model="hasInboundDef"
        type="warning"
        variant="tonal"
        density="compact"
        closable
        class="md3-body-small mb-4"
      >
        {{ t("routingA.inboundDeprecated") }}
      </v-alert>
      <v-textarea
        v-model="routingA"
        :placeholder="t('routingA.messages.0')"
        aria-label="RoutingA"
        rows="16"
        auto-grow
        dir="ltr"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        :loading="loading"
        :disabled="loading"
        :readonly="saving"
        class="code"
      />
    </v-card-text>
    <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
      <v-btn
        variant="text"
        :append-icon="mdiOpenInNew"
        href="https://github.com/v2rayA/v2rayA/wiki/RoutingA"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t("operations.helpManual") }}
      </v-btn>
      <v-spacer />
      <v-btn variant="text" @click="emit('close')">{{
        t("operations.cancel")
      }}</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        :disabled="loading"
        @click="save"
      >
        {{ t("operations.save") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.code :deep(textarea) {
  font-family: ui-monospace, "Cascadia Mono", "Fira Mono", Menlo, monospace;
}
</style>
