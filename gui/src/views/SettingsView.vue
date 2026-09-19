<script setup lang="ts">
// The settings page: the proxy (mode, implementation and what each
// needs), traffic splitting and the lists it updates, the core's
// options, and the dialogs for the rest — in panes, with one save.
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import {
  mdiCogOutline,
  mdiDnsOutline,
  mdiFileDocumentEditOutline,
  mdiHelpCircleOutline,
  mdiLanPending,
  mdiOpenInNew,
  mdiRefresh,
} from "@mdi/js";
import { errorText } from "@/api/errors";
import { useDialog, useNotify } from "@/composables";
import CustomInboundDialog from "@/dialogs/settings/CustomInbound.vue";
import DnsDialog from "@/dialogs/settings/Dns.vue";
import DomainsExcludedDialog from "@/dialogs/settings/DomainsExcluded.vue";
import GfwListDialog from "@/dialogs/settings/GfwList.vue";
import PortsDialog from "@/dialogs/settings/Ports.vue";
import RoutingADialog from "@/dialogs/settings/RoutingA.vue";
import TproxyWhiteIpsDialog from "@/dialogs/settings/TproxyWhiteIps.vue";
import TunProcessesDialog from "@/dialogs/settings/TunProcesses.vue";
import TunRouteScriptDialog, {
  type TunRouteScript,
} from "@/dialogs/settings/TunRouteScript.vue";
import { useAppStore } from "@/stores/app";
import { useSettings } from "./settings/model";

defineOptions({ name: "SettingsView" });
const { t } = useI18n();
const store = useAppStore();
const notify = useNotify();
const { open } = useDialog();
const settings = useSettings();
const { form, ready, localGFWListVersion, remoteGFWListVersion } = settings;
const saving = ref(false);
const formRef = ref<{ validate(): Promise<{ valid: boolean }> } | null>(null);

const os = computed(() => store.version?.os ?? "");
const isRoot = computed(() => store.version?.isRoot ?? false);
const tunSupported = computed(() => store.version?.tunSupported ?? false);

onMounted(() => {
  settings.load().catch((err) => notify.warning(errorText(err)));
  settings.loadRemoteVersion().catch(() => {});
});

// ---- the choices -------------------------------------------------------------

const on = (label: string) => `${t("setting.options.on")}: ${label}`;
const transparentModes = computed(() => [
  { value: "close", title: t("setting.options.off") },
  { value: "proxy", title: on(t("setting.options.global")) },
  { value: "whitelist", title: on(t("setting.options.whitelistCn")) },
  { value: "gfwlist", title: on(t("setting.options.gfwlist")) },
  { value: "pac", title: on(t("setting.options.sameAsPacMode")) },
]);
const transparentTypes = computed(() => {
  const items: {
    value: string;
    title: string;
    props?: { disabled: boolean };
  }[] = [];
  if (!store.lite && os.value === "linux") {
    items.push(
      { value: "redirect", title: "redirect" },
      { value: "tproxy", title: "tproxy" },
    );
  }
  if (!store.lite)
    items.push({
      value: "tun",
      title: tunSupported.value
        ? "tun"
        : `tun — ${t("setting.options.tunUnsupported")}`,
      props: { disabled: !tunSupported.value },
    });
  if (!(isRoot.value && (os.value === "linux" || os.value === "darwin")))
    items.push({
      value: "system_proxy",
      title: t("setting.options.systemProxy"),
    });
  return items;
});
const pacModes = computed(() => [
  { value: "whitelist", title: t("setting.options.whitelistCn") },
  { value: "gfwlist", title: t("setting.options.gfwlist") },
  { value: "routingA", title: "RoutingA" },
]);
const onOffDefault = computed(() => [
  { value: "default", title: t("setting.options.default") },
  { value: "yes", title: t("setting.options.on") },
  { value: "no", title: t("setting.options.off") },
]);
const logLevels = computed(() =>
  ["trace", "debug", "info", "warn", "error"].map((v) => ({
    value: v,
    title: t(`setting.options.${v}`),
  })),
);
const sniffing = computed(() => [
  { value: "disable", title: t("setting.options.off") },
  { value: "http,tls", title: "HTTP + TLS" },
  { value: "http,tls,quic", title: "HTTP + TLS + QUIC" },
]);
const gfwUpdateModes = computed(() => [
  { value: "none", title: t("setting.options.off") },
  { value: "auto_update", title: t("setting.options.updateGfwlistWhenStart") },
  {
    value: "auto_update_at_intervals",
    title: t("setting.options.updateGfwlistAtIntervals"),
  },
]);
const subUpdateModes = computed(() => [
  { value: "none", title: t("setting.options.off") },
  { value: "auto_update", title: t("setting.options.updateSubWhenStart") },
  {
    value: "auto_update_at_intervals",
    title: t("setting.options.updateSubAtIntervals"),
  },
]);
const updateProxyModes = computed(() => [
  {
    value: "direct",
    title:
      form.transparent === "close" || store.lite
        ? t("setting.options.direct")
        : t("setting.options.dependTransparentMode"),
  },
  { value: "proxy", title: t("setting.options.global") },
  { value: "pac", title: t("setting.options.pac") },
]);

const transparentOn = computed(() => form.transparent !== "close");
const usesTproxy = computed(
  () =>
    transparentOn.value &&
    ["tproxy", "redirect"].includes(form.transparentType),
);
const usesTun = computed(
  () =>
    transparentOn.value && form.transparentType === "tun" && tunSupported.value,
);
const gfwlistInUse = computed(
  () => form.pacMode === "gfwlist" || form.transparent === "gfwlist",
);
const localVersionStale = computed(
  () =>
    !!localGFWListVersion.value &&
    !!remoteGFWListVersion.value &&
    dayjs(localGFWListVersion.value).isAfter(dayjs(remoteGFWListVersion.value)),
);
const positive = (v: unknown) =>
  Number(v) >= 1 || t("configureServer.required");

// ---- the dialogs -----------------------------------------------------------------

async function openGfwList() {
  const changed = await open<boolean>(
    GfwListDialog,
    { localVersion: localGFWListVersion.value },
    { width: 520 },
  ).result;
  if (changed) settings.load().catch(() => {});
}
async function openTunProcesses() {
  const value = await open<string>(
    TunProcessesDialog,
    { value: form.tunExcludeProcesses },
    { width: 520 },
  ).result;
  if (value !== undefined) form.tunExcludeProcesses = value;
}
async function openTunScript() {
  const value = await open<TunRouteScript>(
    TunRouteScriptDialog,
    {
      os: os.value,
      value: {
        shellType: form.tunRouteShellType,
        shellPath: form.tunRouteShellPath,
        setupScript: form.tunSetupScript,
        teardownScript: form.tunTeardownScript,
      },
    },
    { width: 640 },
  ).result;
  if (!value) return;
  form.tunRouteShellType = value.shellType;
  form.tunRouteShellPath = value.shellPath;
  form.tunSetupScript = value.setupScript;
  form.tunTeardownScript = value.teardownScript;
}
const openWhiteIps = () => open(TproxyWhiteIpsDialog, {}, { width: 520 });
const openDomains = () => open(DomainsExcludedDialog, {}, { width: 520 });
const openRoutingA = () => open(RoutingADialog, {}, { width: 720 });
const openDns = () => open(DnsDialog, {}, { width: 640 });
const openPorts = () => open(PortsDialog, {}, { width: 520 });
const openInbounds = () => open(CustomInboundDialog, {}, { width: 640 });

async function save() {
  const check = await formRef.value?.validate();
  if (check && !check.valid) return;
  saving.value = true;
  try {
    await settings.save();
    notify.success(t("setting.saved"));
  } catch (err) {
    notify.warning(t("setting.saveFailed", { message: errorText(err) }));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <v-form ref="formRef" class="settings" @submit.prevent="save">
    <v-skeleton-loader
      v-if="!ready"
      type="article, article"
      class="bg-transparent"
    />
    <template v-else>
      <!-- the proxy -->
      <v-sheet
        color="surface-container-low"
        rounded="xl"
        class="pa-5 pa-sm-6 mb-4"
      >
        <div class="d-flex align-center ga-2 mb-4">
          <h2 class="md3-title-medium">{{ t("setting.transparentProxy") }}</h2>
          <v-tooltip
            :text="t('setting.messages.transparentProxy')"
            max-width="360"
          >
            <template #activator="{ props: tip }">
              <v-icon
                v-bind="tip"
                :icon="mdiHelpCircleOutline"
                size="18"
                class="text-on-surface-variant"
              />
            </template>
          </v-tooltip>
        </div>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.transparent"
              :items="transparentModes"
              :label="t('setting.transparentProxy')"
            />
          </v-col>
          <v-col v-if="transparentOn" cols="12" md="6">
            <v-select
              v-model="form.transparentType"
              :items="transparentTypes"
              item-props
              :label="t('setting.transparentType')"
              :hint="t('setting.messages.transparentType')"
            />
          </v-col>
          <v-col v-if="!store.lite" cols="12" sm="6">
            <v-switch
              v-model="form.ipforward"
              :label="t('setting.ipForwardOn')"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-switch
              v-model="form.portSharing"
              :label="t('setting.portSharingOn')"
              hide-details
            />
          </v-col>
          <v-col v-if="usesTproxy" cols="12" md="6">
            <v-text-field
              v-model="form.tproxyExcludedInterfaces"
              :label="t('setting.tproxyExcludedInterfaces')"
              :placeholder="t('setting.tproxyExcludedInterfacesPlaceholder')"
              :hint="t('setting.messages.tproxyExcludedInterfaces')"
              dir="ltr"
            />
          </v-col>
          <v-col
            v-if="transparentOn && form.transparentType === 'tproxy'"
            cols="12"
            md="6"
            class="d-flex align-center"
          >
            <v-btn
              variant="tonal"
              :prepend-icon="mdiLanPending"
              @click="openWhiteIps"
            >
              {{ t("operations.tproxyWhiteIpGroups") }}
            </v-btn>
          </v-col>
          <template v-if="usesTun">
            <v-col cols="12" sm="6">
              <v-switch
                v-model="form.tunAutoRoute"
                :label="t('setting.tunAutoRoute')"
                :hint="t('setting.messages.tunAutoRoute')"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6" class="d-flex flex-wrap align-center ga-2">
              <v-btn
                v-if="!form.tunAutoRoute"
                variant="tonal"
                :prepend-icon="mdiFileDocumentEditOutline"
                @click="openTunScript"
              >
                {{ t("operations.configureTunRouteScript") }}
              </v-btn>
              <v-btn
                variant="tonal"
                :prepend-icon="mdiCogOutline"
                @click="openTunProcesses"
              >
                {{ t("setting.tunExcludeProcesses") }}
                <v-badge
                  v-if="form.tunExcludeProcesses"
                  :content="
                    form.tunExcludeProcesses.split(',').filter((p) => p).length
                  "
                  inline
                  color="primary"
                  class="ms-2"
                />
              </v-btn>
            </v-col>
          </template>
        </v-row>
      </v-sheet>

      <!-- traffic splitting -->
      <v-sheet
        color="surface-container-low"
        rounded="xl"
        class="pa-5 pa-sm-6 mb-4"
      >
        <div class="d-flex align-center ga-2 mb-4">
          <h2 class="md3-title-medium">{{ t("setting.pacMode") }}</h2>
          <v-tooltip :text="t('setting.messages.pacMode')" max-width="360">
            <template #activator="{ props: tip }">
              <v-icon
                v-bind="tip"
                :icon="mdiHelpCircleOutline"
                size="18"
                class="text-on-surface-variant"
              />
            </template>
          </v-tooltip>
        </div>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.pacMode"
              :items="pacModes"
              :label="t('setting.pacMode')"
            />
          </v-col>
          <v-col
            v-if="form.pacMode === 'routingA'"
            cols="12"
            md="6"
            class="d-flex align-center"
          >
            <v-btn
              variant="tonal"
              :prepend-icon="mdiFileDocumentEditOutline"
              @click="openRoutingA"
            >
              RoutingA · {{ t("operations.configure") }}
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-list-item class="px-0" :title="'GFWList'" lines="two">
              <template #subtitle>
                <span>{{ t("common.latest") }}:</span>
                <a
                  href="https://github.com/v2rayA/dist-v2ray-rules-dat/releases"
                  target="_blank"
                  rel="noreferrer"
                  class="ms-1"
                  >{{ remoteGFWListVersion || t("common.checkRunning") }}</a
                >
                <span class="ms-3">{{ t("common.local") }}:</span>
                <span class="ms-1" :class="{ 'text-error': localVersionStale }">
                  {{ localGFWListVersion || t("common.none") }}
                </span>
                <v-tooltip
                  v-if="localVersionStale"
                  :text="t('setting.messages.gfwlist')"
                  max-width="320"
                >
                  <template #activator="{ props: tip }">
                    <v-icon
                      v-bind="tip"
                      :icon="mdiHelpCircleOutline"
                      size="16"
                      class="ms-1"
                    />
                  </template>
                </v-tooltip>
              </template>
              <template #append>
                <v-btn
                  variant="tonal"
                  :prepend-icon="mdiRefresh"
                  @click="openGfwList"
                >
                  {{ t("operations.update") }}
                </v-btn>
              </template>
            </v-list-item>
          </v-col>
          <template v-if="gfwlistInUse">
            <v-col cols="12" md="6">
              <v-select
                v-model="form.pacAutoUpdateMode"
                :items="gfwUpdateModes"
                :label="t('setting.autoUpdateGfwlist')"
              />
            </v-col>
            <v-col
              v-if="form.pacAutoUpdateMode === 'auto_update_at_intervals'"
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.pacAutoUpdateIntervalHour"
                type="number"
                min="1"
                :rules="[positive]"
                :label="t('setting.options.updateGfwlistAtIntervals')"
              />
            </v-col>
          </template>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.subscriptionAutoUpdateMode"
              :items="subUpdateModes"
              :label="t('setting.autoUpdateSub')"
            />
          </v-col>
          <v-col
            v-if="
              form.subscriptionAutoUpdateMode === 'auto_update_at_intervals'
            "
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="form.subscriptionAutoUpdateIntervalHour"
              type="number"
              min="1"
              :rules="[positive]"
              :label="t('setting.options.updateSubAtIntervals')"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.proxyModeWhenSubscribe"
              :items="updateProxyModes"
              :label="t('setting.preferModeWhenUpdate')"
            />
          </v-col>
        </v-row>
      </v-sheet>

      <!-- the core -->
      <v-sheet
        color="surface-container-low"
        rounded="xl"
        class="pa-5 pa-sm-6 mb-4"
      >
        <h2 class="md3-title-medium mb-4">{{ t("setting.nodeBackend") }}</h2>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.logLevel"
              :items="logLevels"
              :label="t('setting.logLevel')"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.tcpFastOpen"
              :items="onOffDefault"
              :label="t('setting.tcpFastOpen')"
              :hint="t('setting.messages.tcpFastOpen')"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.inboundSniffing"
              :items="sniffing"
              :label="t('setting.inboundSniffing')"
              :hint="t('setting.messages.inboundSniffing')"
            />
          </v-col>
          <v-col
            v-if="form.inboundSniffing !== 'disable'"
            cols="12"
            md="6"
            class="d-flex flex-wrap align-center ga-4"
          >
            <v-switch v-model="form.routeOnly" label="RouteOnly" hide-details />
            <v-btn variant="tonal" @click="openDomains">{{
              t("operations.domainsExcluded")
            }}</v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              :model-value="form.muxOn === 'yes'"
              :label="t('setting.mux')"
              :hint="t('setting.messages.mux')"
              persistent-hint
              @update:model-value="(v) => (form.muxOn = v ? 'yes' : 'no')"
            />
          </v-col>
          <v-col v-if="form.muxOn === 'yes'" cols="12" md="6">
            <v-text-field
              v-model="form.mux"
              type="number"
              min="1"
              max="1024"
              :rules="[positive]"
              :label="t('setting.concurrency')"
            />
          </v-col>
        </v-row>
      </v-sheet>

      <!-- the rest, in dialogs -->
      <v-sheet color="surface-container-low" rounded="xl" class="pa-2 mb-4">
        <v-list bg-color="transparent" lines="one">
          <v-list-item
            :title="t('customAddressPort.title')"
            :prepend-icon="mdiLanPending"
            :append-icon="mdiOpenInNew"
            rounded="lg"
            @click="openPorts"
          />
          <v-list-item
            :title="t('customInbound.title')"
            :prepend-icon="mdiLanPending"
            :append-icon="mdiOpenInNew"
            rounded="lg"
            @click="openInbounds"
          />
          <v-list-item
            :title="t('dns.title')"
            :prepend-icon="mdiDnsOutline"
            :append-icon="mdiOpenInNew"
            rounded="lg"
            @click="openDns"
          />
        </v-list>
      </v-sheet>

      <div class="d-flex justify-end">
        <v-btn color="primary" size="large" :loading="saving" type="submit">
          {{ t("operations.saveApply") }}
        </v-btn>
      </div>
    </template>
  </v-form>
</template>
