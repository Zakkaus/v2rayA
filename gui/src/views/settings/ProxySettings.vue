<script setup lang="ts">
// The transparent proxy's implementation and what each needs (excluded
// interfaces, the direct whitelist, the TUN route scripts and excluded
// processes), as a list under the dashboard's tiles, which hold the mode,
// LAN sharing and IP forwarding themselves. Every change saves at once
// (PUT /setting with the whole form).
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { errorText } from "@/api/errors";
import { useDialog, useNotify } from "@/composables";
import TproxyWhiteIpsDialog from "@/dialogs/settings/TproxyWhiteIps.vue";
import TunProcessesDialog from "@/dialogs/settings/TunProcesses.vue";
import TunRouteScriptDialog, {
  type TunRouteScript,
} from "@/dialogs/settings/TunRouteScript.vue";
import { useAppStore } from "@/stores/app";
import { useSettings } from "./model";
import SettingChoice from "./SettingChoice.vue";
import SettingRow from "./SettingRow.vue";

const { t } = useI18n();
const store = useAppStore();
const notify = useNotify();
const { open } = useDialog();
const settings = useSettings();
const { form, ready } = settings;
const saving = ref(false);

const os = computed(() => store.version?.os ?? "");
const isRoot = computed(() => store.version?.isRoot ?? false);
const tunSupported = computed(() => store.version?.tunSupported ?? false);

onMounted(() => settings.load().catch((err) => notify.warning(errorText(err))));

const transparentTypes = computed(() => {
  const items: {
    value: string;
    title: string;
    props?: { disabled: boolean };
  }[] = [];
  if (!store.lite && os.value === "linux")
    items.push(
      { value: "redirect", title: "redirect" },
      { value: "tproxy", title: "tproxy" },
    );
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

/** commit saves the form after a change; on failure the form is reloaded so it shows what holds. */
async function commit() {
  saving.value = true;
  try {
    await settings.save();
    notify.success(t("setting.saved"));
  } catch (err) {
    notify.warning(t("setting.saveFailed", { message: errorText(err) }));
    await settings.load().catch(() => {});
  } finally {
    saving.value = false;
  }
}
function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
  form[key] = value;
  void commit();
}

async function openTunProcesses() {
  const value = await open<string>(
    TunProcessesDialog,
    { value: form.tunExcludeProcesses },
    { width: 520 },
  ).result;
  if (value !== undefined) set("tunExcludeProcesses", value);
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
  void commit();
}
const openWhiteIps = () => open(TproxyWhiteIpsDialog, {}, { width: 520 });
</script>

<template>
  <v-card
    color="surface-container-high"
    rounded="xl"
    class="pa-2"
    :loading="saving"
  >
    <v-list bg-color="transparent" :disabled="!ready || saving">
      <p
        v-if="!transparentOn"
        class="md3-body-medium text-on-surface-variant px-4 py-2 ma-0"
      >
        {{ t("setting.transparentOffHint") }}
      </p>
      <v-expand-transition>
        <SettingChoice
          v-if="transparentOn"
          :model-value="form.transparentType"
          :title="t('setting.transparentType')"
          :hint="t('setting.messages.transparentType')"
          :items="transparentTypes"
          @update:model-value="(v) => set('transparentType', v)"
        />
      </v-expand-transition>
      <v-expand-transition>
        <SettingRow
          v-if="usesTproxy"
          :title="t('setting.tproxyExcludedInterfaces')"
          :hint="t('setting.messages.tproxyExcludedInterfaces')"
        >
          <v-text-field
            :model-value="form.tproxyExcludedInterfaces"
            class="proxy-settings__interfaces"
            :aria-label="t('setting.tproxyExcludedInterfaces')"
            :placeholder="t('setting.tproxyExcludedInterfacesPlaceholder')"
            hide-details="auto"
            density="compact"
            dir="ltr"
            @change="
              (e: Event) =>
                set(
                  'tproxyExcludedInterfaces',
                  (e.target as HTMLInputElement).value,
                )
            "
          />
        </SettingRow>
      </v-expand-transition>
      <v-expand-transition>
        <SettingRow
          v-if="transparentOn && form.transparentType === 'tproxy'"
          :title="t('operations.tproxyWhiteIpGroups')"
          :hint="t('tproxyWhiteIpGroups.messages.0')"
          action
          @click="openWhiteIps"
        />
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="usesTun">
          <SettingRow
            :title="t('setting.tunAutoRoute')"
            :hint="t('setting.messages.tunAutoRoute')"
          >
            <v-switch
              :model-value="form.tunAutoRoute"
              :aria-label="t('setting.tunAutoRoute')"
              hide-details
              @update:model-value="(v) => set('tunAutoRoute', !!v)"
            />
          </SettingRow>
          <v-expand-transition>
            <SettingRow
              v-if="!form.tunAutoRoute"
              :title="t('operations.configureTunRouteScript')"
              :subtitle="form.tunRouteShellPath"
              action
              @click="openTunScript"
            />
          </v-expand-transition>
          <SettingRow
            :title="t('setting.tunExcludeProcesses')"
            :hint="t('setting.messages.tunExcludeProcesses')"
            action
            @click="openTunProcesses"
          >
            <v-badge
              v-if="form.tunExcludeProcesses"
              :content="
                form.tunExcludeProcesses.split(',').filter((p) => p).length
              "
              inline
              color="primary"
              class="me-2"
            />
          </SettingRow>
        </div>
      </v-expand-transition>
    </v-list>
  </v-card>
</template>

<style scoped>
.proxy-settings__interfaces {
  min-width: 220px;
}
</style>
