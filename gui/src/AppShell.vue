<script setup lang="ts">
// The page: top app bar (brand, the core's state, the outbound groups,
// the actions), a drawer for the actions on phones, the node list, and
// the hosts for notices, dialogs and the loading overlay. The shell also
// runs the session: it is the starter resetSession() calls.
//
// Coexistence period: the node list and the settings, log and address
// dialogs are still the old Buefy ones; they open through openLegacy and
// report the core's state as translated text, which the bridge below
// turns into the store's enum.
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay, useLocale, useTheme } from "vuetify";
import dayjs from "dayjs";
import {
  mdiAccountCircleOutline,
  mdiChevronDown,
  mdiCogOutline,
  mdiHeartOutline,
  mdiLogout,
  mdiMenu,
  mdiPalette,
  mdiScriptTextOutline,
  mdiTranslate,
} from "@mdi/js";
import {
  deleteV2ray,
  getAccount,
  getOutbounds,
  getVersion,
  postOutbound,
  postV2ray,
} from "@/api";
import { ApiError, currentSession } from "@/api/client";
import { watchConnected } from "@/api/connect";
import { errorText } from "@/api/errors";
import type {
  ObservatoryMessage,
  RunningStateMessage,
  Which,
  WsMessage,
} from "@/api/types";
import { installClientHooks } from "@/clientHooks";
import {
  createMessageSocket,
  openDialog,
  openLoading,
  useNotify,
  usePrompt,
} from "@/composables";
import DialogHost from "@/components/hosts/DialogHost.vue";
import LoadingHost from "@/components/hosts/LoadingHost.vue";
import NoticeHost from "@/components/hosts/NoticeHost.vue";
import ThemePanel from "@/components/ThemePanel.vue";
import AboutDialog from "@/dialogs/About.vue";
import LoginDialog from "@/dialogs/Login.vue";
import ServerDialog from "@/dialogs/Server/index.vue";
import { closeProgrammatic, openLegacy } from "@/plugins/session";
import { onSessionTeardown, resetSession, setSessionStarter } from "@/session";
import { useAppStore, type Running } from "@/stores/app";
import { vuetifyLocales } from "@/theme";
import { schemeColors } from "@/theme/scheme";
import logo from "@/assets/img/v2raya-icon.svg";
// the old page's pieces, replaced view by view
import NodeList from "@/node.vue";
import OutboundGroupPanel from "@/components/outboundGroupPanel.vue";
import ModalSetting from "@/components/modalSetting.vue";
import ModalLog from "@/components/modalLog.vue";
import ModalCustomPorts from "@/components/modalCustomPorts.vue";
import vuex from "@/store";

const store = useAppStore();
const { t, locale } = useI18n();
const notify = useNotify();
const prompt = usePrompt();
const theme = useTheme();
const vuetifyLocale = useLocale();
const { mdAndDown } = useDisplay();
const drawer = ref(false);

// ---- the old node list -------------------------------------------------------

interface NodeListInstance {
  syncLatestNodeOverview(showError?: boolean): Promise<boolean>;
  notifyRunning(networkPaused?: boolean): void;
  notifyStopped(networkPaused?: boolean): void;
}
interface NodeState {
  running: string;
  networkPaused: boolean;
  connectedServer: Which[] | null;
}
const nodeRef = ref<NodeListInstance | null>(null);
// a new session gets a new node list, as the old root rebuild gave it
const sessionSerial = ref(0);
// the object node.vue reports its state in and watches; the start/stop
// handlers write into it, as the old App.vue did
let nodeState: NodeState | null = null;

function runningOf(label: string): Running {
  if (label === t("common.isRunning")) return "running";
  if (label === t("common.notRunning")) return "stopped";
  if (label === t("common.waitingNetwork")) return "paused";
  return "checking";
}
function labelOf(running: Running): string {
  return t(
    {
      running: "common.isRunning",
      stopped: "common.notRunning",
      paused: "common.waitingNetwork",
      checking: "common.checkRunning",
    }[running],
  );
}
function onNodeState(state: NodeState) {
  nodeState = state;
  store.setRunning(runningOf(state.running), state.networkPaused);
  store.connectedServer = state.connectedServer ?? [];
}
function pushRunning(running: Running, connectedServer: Which[] | null) {
  if (nodeState)
    Object.assign(nodeState, {
      running: labelOf(running),
      networkPaused: false,
      connectedServer,
    });
  store.setRunning(running);
  store.connectedServer = connectedServer ?? [];
}
// the old settings dialogs commit the state as text into the Vuex store
vuex.watch(
  (s: { running: string }) => s.running,
  (label: string) => {
    if (nodeState) nodeState.running = label;
    store.setRunning(runningOf(label), store.networkPaused);
  },
);

// ---- the session -------------------------------------------------------------

function applyTitle() {
  const address = store.backendAddress;
  const relative =
    !address || (address.startsWith("/") && !address.startsWith("//"));
  let host = location.host;
  if (!relative) {
    try {
      host = new URL(address).host;
    } catch {
      host = address;
    }
  }
  document.title = `v2rayA - ${host}`;
}

// No token: ask whether an account exists, with a few retries in case the
// backend is still coming up, then show login or registration.
async function askForLogin() {
  const session = currentSession();
  for (let attempt = 0; ; attempt++) {
    try {
      const { hasAnyAccounts } = await getAccount();
      if (session !== currentSession()) return;
      openDialog(
        LoginDialog,
        { first: !hasAnyAccounts },
        { persistent: true, width: 420 },
      );
      return;
    } catch (err) {
      if (session !== currentSession()) return;
      if (!(err instanceof ApiError) || err.kind !== "network" || attempt >= 3)
        return;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function announceVersion() {
  const v = await getVersion();
  store.applyVersion(v);
  let text = t(v.docker ? "welcome.docker" : "welcome.default", {
    version: v.version,
  });
  let timeout = 3000;
  if (v.foundNew) {
    text +=
      t("welcome.separator") +
      t("welcome.newVersion", { version: v.remoteVersion });
    timeout = 5000;
  }
  // the running notice once per browser session, not on every reload
  const seenKey = "welcomeShown:" + v.version;
  let seen = false;
  try {
    seen = sessionStorage.getItem(seenKey) === "1";
    sessionStorage.setItem(seenKey, "1");
  } catch {
    // storage unavailable: show it
  }
  if (!seen || v.foundNew) {
    if (v.foundNew) notify.success(text, { timeout });
    else notify.info(text, { timeout });
  }
  // a core version mismatch is the node list's persistent banner already
  if (v.coreVersionValid !== false && v.serviceValid === false)
    notify.error(t("version.v2rayInvalid"), { timeout: 10_000 });
}

function onMessage(msg: WsMessage) {
  if (msg.type === "observatory") {
    const { body } = msg as ObservatoryMessage;
    if (body?.outboundName === store.outboundName) store.observatory = msg;
  } else if (msg.type === "running_state") {
    const { body } = msg as RunningStateMessage;
    if (!body) return;
    const paused = !!body.networkPaused;
    if (body.running === false) nodeRef.value?.notifyStopped(paused);
    else nodeRef.value?.notifyRunning(paused);
  }
}

async function startSession() {
  onSessionTeardown(closeProgrammatic);
  sessionSerial.value++;
  applyTitle();
  if (!store.loggedIn) {
    await askForLogin();
    return;
  }
  void announceVersion().catch(() => {
    // the client hooks announce an unreachable backend
  });
  void getOutbounds()
    .then((r) => store.setOutbounds(r.outbounds))
    .catch(() => {
      // an expired token: the 401 hook resets the session
    });
  const socket = createMessageSocket({
    onMessage,
    // messages are not replayed: every open re-syncs the state
    onOpen: () => void nodeRef.value?.syncLatestNodeOverview(),
  });
  onSessionTeardown(() => socket.stop());
  socket.start();
}

setSessionStarter(startSession);
installClientHooks({ openAddressDialog: openPorts });

// Development builds expose the dialogs the node list does not open yet,
// for the screenshot set and the parity harness.
if (import.meta.env.DEV) {
  Object.assign(window, {
    v2rayaDev: {
      openServerDialog: (which: Which | null = null, readonly = false) =>
        openDialog(ServerDialog, { which, readonly }, { width: 560 }),
    },
  });
}

// ---- the core's state ---------------------------------------------------------

const hovering = ref(false);
const statusColor = computed(
  () =>
    ({
      running: "success",
      stopped: "error",
      paused: "warning",
      checking: "surface-variant",
    })[store.running],
);
const statusText = computed(() => {
  if (hovering.value && store.running === "running") return t("v2ray.stop");
  if (hovering.value && store.running === "stopped") return t("v2ray.start");
  return labelOf(store.running);
});

async function toggleRunning() {
  if (store.running === "stopped" || store.running === "paused") {
    const loading = openLoading();
    const control = new AbortController();
    try {
      const res = await watchConnected(
        postV2ray({ signal: control.signal }),
        () => control.abort(),
        {
          onCheckFailed: (err) =>
            notify.warning(
              t("connection.checkFailed", { message: errorText(err) }),
            ),
        },
      );
      if (res) pushRunning("running", res.touch.connectedServer);
      else void nodeRef.value?.syncLatestNodeOverview();
    } catch (err) {
      notify.warning(t("v2ray.startFailed", { message: errorText(err) }));
    } finally {
      loading.close();
    }
  } else if (store.running === "running") {
    try {
      const res = await deleteV2ray();
      pushRunning("stopped", res.touch.connectedServer);
    } catch (err) {
      notify.warning(t("v2ray.stopFailed", { message: errorText(err) }));
    }
  }
}

// ---- outbound groups ----------------------------------------------------------

async function addOutbound() {
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

// ---- the actions -----------------------------------------------------------------

function openSettings() {
  openLegacy({
    component: ModalSetting,
    hasModalCard: true,
    canCancel: true,
    events: { clickPorts: openPorts },
  });
}
function openPorts() {
  openLegacy({
    component: ModalCustomPorts,
    hasModalCard: true,
    customClass: "modal-custom-ports",
  });
}
function openLogs() {
  openLegacy({ component: ModalLog, hasModalCard: true, canCancel: true });
}
function openAbout() {
  openDialog(AboutDialog, {}, { width: 560 });
}
function logout() {
  void resetSession({ token: "" });
}

watchEffect(() => {
  // both palettes follow the seed, so switching appearance later is instant
  theme.themes.value.light.colors = schemeColors(store.themeSeed, false);
  theme.themes.value.dark.colors = schemeColors(store.themeSeed, true);
});
watchEffect(() => {
  theme.global.name.value = store.isDark ? "dark" : "light";
  // the old components' dark styles key on this class
  document.documentElement.classList.toggle("theme-dark", store.isDark);
  document.body.classList.toggle("theme-dark", store.isDark);
});

const langs = [
  { code: "zh_CN", label: "中文-中国", flag: "zh", dayjs: "zh-cn" },
  { code: "en_US", label: "English-US", flag: "en", dayjs: "en" },
  { code: "fa_IR", label: "فارسی", flag: "fa", dayjs: "fa" },
  { code: "ru_RU", label: "Русский", flag: "ru", dayjs: "ru" },
  { code: "pt_BR", label: "Português-Brasil", flag: "pt", dayjs: "pt-br" },
  { code: "ko_KR", label: "한국어-대한민국", flag: "ko", dayjs: "ko" },
];
const currentLang = computed(
  () => langs.find((l) => l.flag === locale.value)?.label ?? locale.value,
);
function setLanguage(flag: string) {
  const lang = langs.find((l) => l.flag === flag);
  if (!lang) return;
  store.setLanguage(flag);
  locale.value = flag;
  drawer.value = false;
}
watch(
  locale,
  (flag) => {
    vuetifyLocale.current.value = vuetifyLocales[flag] ?? "en";
    dayjs.locale(langs.find((l) => l.flag === flag)?.dayjs ?? flag);
    document.documentElement.lang = flag;
    document.documentElement.dir = vuetifyLocale.isRtl.value ? "rtl" : "ltr";
    // the old node list keeps the state as text of the language it was
    // read in; a re-sync reads it again
    void nodeRef.value?.syncLatestNodeOverview();
  },
  { immediate: true },
);

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const onSystemTheme = (e: MediaQueryListEvent) =>
  (store.systemDark = e.matches);
onMounted(() => {
  darkQuery.addEventListener("change", onSystemTheme);
  void startSession();
});
onBeforeUnmount(() => darkQuery.removeEventListener("change", onSystemTheme));
</script>

<template>
  <v-app>
    <v-app-bar :height="64" flat color="surface" scroll-behavior="elevate">
      <template #prepend>
        <v-app-bar-nav-icon
          v-if="mdAndDown"
          :icon="mdiMenu"
          :aria-label="t('common.menu')"
          @click="drawer = !drawer"
        />
        <a href="/" class="brand no-select">
          <img :src="logo" alt="" class="brand__icon" />
          <span class="brand__name md3-title-large">v2rayA</span>
        </a>
      </template>

      <v-chip
        :color="statusColor"
        variant="tonal"
        size="large"
        class="status-chip md3-label-large ms-2"
        role="button"
        tabindex="0"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
        @click="toggleRunning"
        @keydown.enter.prevent="toggleRunning"
        @keydown.space.prevent="toggleRunning"
      >
        {{ statusText }}
      </v-chip>
      <div class="ms-2">
        <OutboundGroupPanel
          :outbounds="store.outbounds"
          :current-outbound="store.outboundName"
          :is-mobile="mdAndDown"
          @select="store.outboundName = $event"
          @add-outbound="addOutbound"
          @changed="nodeRef?.syncLatestNodeOverview()"
          @group-deleted="store.setOutbounds($event)"
        />
      </div>

      <template v-if="!mdAndDown" #append>
        <v-btn
          variant="text"
          :prepend-icon="mdiCogOutline"
          @click="openSettings"
        >
          {{ t("common.setting") }}
        </v-btn>
        <v-btn
          variant="text"
          :prepend-icon="mdiHeartOutline"
          @click="openAbout"
        >
          {{ t("common.about") }}
        </v-btn>
        <v-btn
          variant="text"
          :prepend-icon="mdiScriptTextOutline"
          @click="openLogs"
        >
          {{ t("common.log") }}
        </v-btn>
        <v-menu :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu"
              variant="text"
              :prepend-icon="mdiPalette"
              :append-icon="mdiChevronDown"
            >
              {{ t("theme.title") }}
            </v-btn>
          </template>
          <v-list density="compact" min-width="260">
            <ThemePanel />
          </v-list>
        </v-menu>
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu"
              variant="text"
              :prepend-icon="mdiTranslate"
              :append-icon="mdiChevronDown"
            >
              {{ currentLang }}
            </v-btn>
          </template>
          <v-list density="compact" min-width="220">
            <v-list-item
              v-for="lang in langs"
              :key="lang.code"
              :active="lang.flag === locale"
              :title="lang.label"
              :subtitle="lang.code"
              @click="setLanguage(lang.flag)"
            />
          </v-list>
        </v-menu>
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu"
              variant="text"
              :prepend-icon="mdiAccountCircleOutline"
              :append-icon="mdiChevronDown"
              class="me-2"
            >
              {{ store.username || t("common.notLogin") }}
            </v-btn>
          </template>
          <v-list density="compact" min-width="220">
            <v-list-item disabled>
              <v-list-item-title class="md3-body-medium">
                <i18n-t keypath="common.loggedAs" tag="span" scope="global">
                  <template #username>
                    <b>{{ store.username || t("common.notLogin") }}</b>
                  </template>
                </i18n-t>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              :prepend-icon="mdiLogout"
              :title="t('operations.logout')"
              @click="logout"
            />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-if="mdAndDown"
      v-model="drawer"
      temporary
      :width="300"
      location="start"
    >
      <v-list nav>
        <v-list-subheader class="md3-title-small">
          <i18n-t keypath="common.loggedAs" tag="span" scope="global">
            <template #username>
              <b>{{ store.username || t("common.notLogin") }}</b>
            </template>
          </i18n-t>
        </v-list-subheader>
        <v-list-item
          :prepend-icon="mdiCogOutline"
          :title="t('common.setting')"
          @click="openSettings"
        />
        <v-list-item
          :prepend-icon="mdiHeartOutline"
          :title="t('common.about')"
          @click="openAbout"
        />
        <v-list-item
          :prepend-icon="mdiScriptTextOutline"
          :title="t('common.log')"
          @click="openLogs"
        />
        <v-list-group>
          <template #activator="{ props: group }">
            <v-list-item
              v-bind="group"
              :prepend-icon="mdiPalette"
              :title="t('theme.title')"
            />
          </template>
          <ThemePanel />
        </v-list-group>
        <v-list-group>
          <template #activator="{ props: group }">
            <v-list-item
              v-bind="group"
              :prepend-icon="mdiTranslate"
              :title="currentLang"
            />
          </template>
          <v-list-item
            v-for="lang in langs"
            :key="lang.code"
            :active="lang.flag === locale"
            :title="lang.label"
            :subtitle="lang.code"
            @click="setLanguage(lang.flag)"
          />
        </v-list-group>
        <v-divider class="my-2" />
        <v-list-item
          :prepend-icon="mdiLogout"
          :title="t('operations.logout')"
          @click="logout"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <NodeList
        v-if="store.loggedIn"
        ref="nodeRef"
        :key="sessionSerial"
        :outbound="store.outboundName"
        :outbounds="store.outbounds"
        :observatory="store.observatory ?? undefined"
        :load-balance-valid="store.loadBalanceValid"
        :core-version-valid="store.coreVersionValid"
        :core-version-err="store.coreVersionErr"
        @input="onNodeState"
      />
    </v-main>

    <NoticeHost />
    <DialogHost />
    <LoadingHost />
  </v-app>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 4px;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
}
.brand__icon {
  width: 32px;
  height: 32px;
}
.status-chip {
  cursor: pointer;
  min-width: 5em;
  justify-content: center;
}
.no-select {
  user-select: none;
}
@media (max-width: 400px) {
  .brand__name {
    display: none;
  }
}
</style>
