<script setup lang="ts">
// The page, laid out the Material 3 way: a navigation rail from 600 dp
// (a bottom navigation bar below), a top app bar with the page's title,
// the core's state chip and the account, theme and language menus, and
// the current page's pane under v-main; the hosts for notices, dialogs
// and the loading overlay. The shell also runs the session: it is the
// starter resetSession() calls.
//
// Coexistence period: the node list and the address dialog are still the
// old Buefy ones; the node list reports the core's state as translated
// text, which the bridge below turns into the store's enum.
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
import { mdiPower, mdiSitemapOutline } from "@mdi/js";
import {
  deleteV2ray,
  getAccount,
  getOutbounds,
  getVersion,
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
} from "@/composables";
import DialogHost from "@/components/hosts/DialogHost.vue";
import LoadingHost from "@/components/hosts/LoadingHost.vue";
import NoticeHost from "@/components/hosts/NoticeHost.vue";
import NavBar from "@/components/NavBar.vue";
import NavDrawer from "@/components/NavDrawer.vue";
import NavRail from "@/components/NavRail.vue";
import ShellMenus from "@/components/ShellMenus.vue";
import { destinations } from "@/components/destinations";
import { languages } from "@/components/languages";
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
import OutboundMenu from "@/components/OutboundMenu.vue";
import ModalCustomPorts from "@/components/modalCustomPorts.vue";
import AboutView from "@/views/AboutView.vue";
import LogsView from "@/views/LogsView.vue";
import SettingsView from "@/views/SettingsView.vue";
import vuex from "@/store";

const store = useAppStore();
const { t, locale } = useI18n();
const notify = useNotify();
const theme = useTheme();
const vuetifyLocale = useLocale();
// Material's window size classes: compact < 600, medium < 840, expanded
const { width } = useDisplay();
const compact = computed(() => width.value < 600);
const expanded = computed(() => width.value >= 840);
const pageTitle = computed(() =>
  t(destinations.find((d) => d.view === store.view)?.label ?? "common.nodes"),
);

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

// ---- the address dialog (still the old one) ------------------------------------

function openPorts() {
  openLegacy({
    component: ModalCustomPorts,
    hasModalCard: true,
    customClass: "modal-custom-ports",
  });
}

// ---- theme and language ---------------------------------------------------------

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

watch(
  locale,
  (flag) => {
    vuetifyLocale.current.value = vuetifyLocales[flag] ?? "en";
    dayjs.locale(languages.find((l) => l.flag === flag)?.dayjs ?? flag);
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
    <NavDrawer v-if="expanded && !store.navCollapsed">
      <template #core>
        <v-list-item
          :prepend-icon="mdiPower"
          :title="labelOf(store.running)"
          :subtitle="
            store.running === 'running' ? t('v2ray.stop') : t('v2ray.start')
          "
          rounded="xl"
          @click="toggleRunning"
        >
          <template #append>
            <v-switch
              :model-value="store.running === 'running'"
              :loading="store.running === 'checking'"
              :color="statusColor"
              hide-details
              density="compact"
              tabindex="-1"
              @click.stop="toggleRunning"
            />
          </template>
        </v-list-item>
      </template>
      <template #groups>
        <OutboundMenu
          variant="list"
          @changed="nodeRef?.syncLatestNodeOverview()"
        />
      </template>
    </NavDrawer>
    <NavRail v-else-if="!compact" :collapsible="expanded">
      <template #core>
        <v-tooltip :text="labelOf(store.running)" location="end">
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="mdiPower"
              :color="statusColor"
              variant="tonal"
              :aria-label="labelOf(store.running)"
              @click="toggleRunning"
            />
          </template>
        </v-tooltip>
        <v-tooltip
          :text="`${t('common.proxyGroups')}: ${store.outboundName.toUpperCase()}`"
          location="end"
        >
          <template #activator="{ props: tip }">
            <v-btn
              v-bind="tip"
              :icon="mdiSitemapOutline"
              variant="tonal"
              color="tertiary"
              :aria-label="t('common.proxyGroups')"
              @click="store.setNavCollapsed(false)"
            />
          </template>
        </v-tooltip>
      </template>
    </NavRail>

    <v-app-bar
      v-if="!expanded"
      :height="64"
      flat
      color="surface"
      scroll-behavior="elevate"
    >
      <template v-if="compact" #prepend>
        <img :src="logo" alt="v2rayA" class="bar__logo ms-2" />
      </template>
      <v-app-bar-title class="md3-title-large">{{ pageTitle }}</v-app-bar-title>
      <v-chip
        :color="statusColor"
        variant="tonal"
        size="large"
        class="status-chip md3-label-large me-2"
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
      <OutboundMenu
        v-if="!compact"
        class="me-3"
        @changed="nodeRef?.syncLatestNodeOverview()"
      />
      <template #append>
        <ShellMenus variant="icons" />
      </template>
    </v-app-bar>

    <v-main>
      <div class="page" :class="{ 'page--wide': store.view === 'nodes' }">
        <h1 v-if="expanded" class="md3-headline-medium page__title">
          {{ pageTitle }}
        </h1>
        <div v-show="store.view === 'nodes'">
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
        </div>
        <SettingsView v-if="store.view === 'settings'" />
        <LogsView v-else-if="store.view === 'logs'" />
        <AboutView v-else-if="store.view === 'about'" />
      </div>
    </v-main>

    <NavBar v-if="compact" />

    <NoticeHost />
    <DialogHost />
    <LoadingHost />
  </v-app>
</template>

<style scoped>
.bar__logo {
  width: 32px;
  height: 32px;
}
.status-chip {
  cursor: pointer;
  min-width: 5em;
  justify-content: center;
}
/* Material's margins: 16 dp on compact, 24 dp from medium; readable width */
.page {
  padding: 16px;
  margin: 0 auto;
  max-width: 1040px;
}
.page--wide {
  max-width: 1400px;
}
.page__title {
  margin: 8px 0 24px;
}
@media (min-width: 600px) {
  .page {
    padding: 24px;
  }
}
</style>
