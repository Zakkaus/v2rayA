import { computed, onMounted, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import "@/plugins/dayjs";
import {
  deleteV2ray,
  getPingLatency,
  getPorts,
  getTouch,
  postV2ray,
  putOutboundSelection,
  putSubscription,
} from "@/api";
import { watchConnected } from "@/api/connect";
import { errorText } from "@/api/errors";
import type {
  Ports,
  Touch,
  TouchResponse,
  TouchServer,
  Which,
} from "@/api/types";
import { openLoading, useNotify } from "@/composables";
import { useAppStore } from "@/stores/app";
import { locate, runningOf, sameWhich } from "@/views/nodes/model";
import { useSettings, type SettingForm } from "@/views/settings/model";

export interface DashboardMember {
  key: string;
  which: Which;
  row: TouchServer;
  alive: boolean;
  latency: string;
  delay?: number;
}

// The backend formats both quota values in GiB.
function usage(info: string) {
  const m = /Used ([\d.]+ \w+) \/ ([\d.]+ \w+)(?: · Expires (\S+))?/.exec(info);
  if (!m || !(parseFloat(m[2]) > 0)) return null;
  return {
    used: m[1],
    total: m[2],
    expires: m[3] ?? "",
    percent: Math.min(100, (parseFloat(m[1]) / parseFloat(m[2])) * 100),
  };
}

export function useDashboard() {
  const store = useAppStore();
  const { t, locale } = useI18n();
  const notify = useNotify();
  const settings = useSettings();
  const touch = shallowRef<Touch>();
  const ports = shallowRef<Ports>();
  const loading = ref(true);
  const busy = ref(false);
  const error = ref("");
  const quickLoading = ref(true);
  const quickSaving = ref(false);
  const showSettings = ref(false);
  const selecting = ref(false);
  const testing = ref<string>();
  const measured = ref(new Map<string, string>());
  const updating = ref<number>();
  const updatingAll = ref(false);
  const members = computed<DashboardMember[]>(() =>
    store.connectedServer
      .filter((which) => (which.outbound ?? "proxy") === store.outboundName)
      .flatMap((which) => {
        const row = touch.value && locate(touch.value, which);
        if (!row) return [];
        const status = store.observatory[store.outboundName]?.find((entry) =>
          sameWhich(entry.which, which),
        );
        const delay =
          status && Number.isFinite(status.delay) && status.delay >= 0
            ? status.delay
            : undefined;
        const key = JSON.stringify([
          store.outboundName,
          which._type,
          which.sub,
          which.id,
          row.address,
          row.name,
        ]);
        return [
          {
            key,
            which,
            row,
            delay,
            alive: status?.alive ?? false,
            latency:
              measured.value.get(key) ??
              (delay !== undefined ? `${delay} ms` : row.pingLatency || "—"),
          },
        ];
      }),
  );
  const nodeInUse = computed(() => {
    const pinned = members.value.find((member) => member.which.selected);
    if (pinned) return pinned;
    let best: DashboardMember | undefined;
    for (const member of members.value) {
      if (
        member.alive &&
        member.delay !== undefined &&
        (best?.delay === undefined || member.delay < best.delay)
      )
        best = member;
    }
    return best ?? (members.value.length === 1 ? members.value[0] : undefined);
  });
  const subscriptions = computed(() =>
    (touch.value?.subscriptions ?? []).map((subscription) => {
      const quota = usage(subscription.info);
      const date = dayjs(subscription.status);
      const dateLocale =
        locale.value === "zh"
          ? "zh-cn"
          : locale.value === "fa-ir"
            ? "fa"
            : locale.value;
      return {
        ...subscription,
        usage: quota,
        summary: quota
          ? t("dashboard.usage", quota) +
            (quota.expires
              ? ` · ${t("dashboard.expires", { date: quota.expires })}`
              : "")
          : subscription.info,
        updatedAt:
          subscription.status && date.isValid()
            ? date.locale(dateLocale).fromNow()
            : subscription.status || "—",
      };
    }),
  );
  const stateLabel = computed(() =>
    t(
      {
        running: "common.isRunning",
        stopped: "common.notRunning",
        paused: "common.waitingNetwork",
        checking: "common.checkRunning",
      }[store.running],
    ),
  );
  const canToggle = computed(
    () => !loading.value && !busy.value && store.running !== "checking",
  );
  const quickDisabled = computed(
    () =>
      quickLoading.value ||
      !settings.ready.value ||
      quickSaving.value ||
      showSettings.value,
  );
  const subscriptionsBusy = computed(
    () => updatingAll.value || updating.value !== undefined,
  );

  function apply(response: TouchResponse) {
    touch.value = response.touch;
    store.connectedServer = response.touch.connectedServer ?? [];
    store.setRunning(
      runningOf(response.running, response.networkPaused),
      response.networkPaused,
    );
  }

  function report(err: unknown) {
    error.value = errorText(err);
    notify.warning(error.value);
  }

  async function loadQuick() {
    quickLoading.value = true;
    settings.ready.value = false;
    try {
      await settings.load();
    } catch (err) {
      report(err);
    } finally {
      quickLoading.value = false;
    }
  }

  onMounted(async () => {
    await Promise.all([
      getTouch().then(apply).catch(report),
      loadQuick(),
      getPorts()
        .then((value) => (ports.value = value))
        .catch(report),
    ]);
    loading.value = false;
  });

  async function setQuick<K extends keyof SettingForm>(
    key: K,
    value: SettingForm[K],
  ) {
    if (quickDisabled.value) return;
    settings.form[key] = value;
    quickSaving.value = true;
    try {
      await settings.save();
      notify.success(t("setting.saved"));
    } catch (err) {
      notify.warning(t("setting.saveFailed", { message: errorText(err) }));
      await loadQuick();
    } finally {
      quickSaving.value = false;
    }
  }

  async function toggleSettings() {
    if (quickSaving.value || quickLoading.value) return;
    showSettings.value = !showSettings.value;
    if (!showSettings.value) await loadQuick();
  }

  async function selectNode(
    which: Which | null,
    outbound = store.outboundName,
  ) {
    if (selecting.value) return false;
    selecting.value = true;
    try {
      apply(await putOutboundSelection({ outbound, which }));
      return true;
    } catch (err) {
      notify.warning(errorText(err));
      return false;
    } finally {
      selecting.value = false;
    }
  }

  async function testNode() {
    const member = nodeInUse.value;
    if (!member || testing.value) return;
    testing.value = member.key;
    try {
      const result = await getPingLatency([member.which]);
      const latency = result.whiches[0]?.pingLatency;
      if (latency) measured.value.set(member.key, latency);
    } catch (err) {
      notify.warning(errorText(err));
    } finally {
      testing.value = undefined;
    }
  }

  async function refreshSubscription(id: number) {
    updating.value = id;
    try {
      apply(await putSubscription({ _type: "subscription", id }));
      measured.value.clear();
    } catch (err) {
      notify.warning(errorText(err));
    } finally {
      updating.value = undefined;
    }
  }

  async function updateSubscription(id: number) {
    if (subscriptionsBusy.value) return;
    await refreshSubscription(id);
  }

  async function updateAll() {
    if (subscriptionsBusy.value) return;
    updatingAll.value = true;
    try {
      for (const { id } of subscriptions.value) await refreshSubscription(id);
    } finally {
      updatingAll.value = false;
    }
  }

  async function toggleRunning() {
    if (!canToggle.value) return;
    const starting = store.running !== "running";
    busy.value = true;
    const overlay = openLoading();
    try {
      if (starting) {
        const control = new AbortController();
        const response = await watchConnected(
          postV2ray({ signal: control.signal }),
          () => control.abort(),
          {
            onCheckFailed: (err) =>
              notify.warning(
                t("connection.checkFailed", { message: errorText(err) }),
              ),
          },
        );
        // The watcher can finish before POST answers; fetch the confirmed state.
        apply(response ?? (await getTouch()));
      } else {
        apply(await deleteV2ray());
      }
    } catch (err) {
      notify.warning(
        t(starting ? "v2ray.startFailed" : "v2ray.stopFailed", {
          message: errorText(err),
        }),
      );
    } finally {
      overlay.close();
      busy.value = false;
    }
  }

  return {
    store,
    loading,
    busy,
    error,
    members,
    nodeInUse,
    ports,
    subscriptions,
    quick: settings.form,
    quickLoading,
    quickSaving,
    quickDisabled,
    showSettings,
    selecting,
    testing,
    updating,
    updatingAll,
    subscriptionsBusy,
    stateLabel,
    canToggle,
    toggleRunning,
    setQuick,
    toggleSettings,
    selectNode,
    testNode,
    updateAll,
    updateSubscription,
  };
}
