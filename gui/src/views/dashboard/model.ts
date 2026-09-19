import { computed, onMounted, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { deleteV2ray, getSetting, getTouch, postV2ray } from "@/api";
import { watchConnected } from "@/api/connect";
import { errorText } from "@/api/errors";
import type { Setting, Touch, TouchResponse } from "@/api/types";
import { openLoading, useNotify } from "@/composables";
import { useAppStore } from "@/stores/app";
import { locate, runningOf } from "@/views/nodes/model";

export function useDashboard() {
  const store = useAppStore();
  const { t } = useI18n();
  const notify = useNotify();
  const touch = shallowRef<Touch>();
  const setting = shallowRef<Setting>();
  const loading = ref(true);
  const busy = ref(false);
  const error = ref("");
  const nodeCount = computed(() =>
    touch.value
      ? touch.value.servers.length +
        touch.value.subscriptions.reduce((n, sub) => n + sub.servers.length, 0)
      : undefined,
  );
  const subscriptionCount = computed(() => touch.value?.subscriptions.length);
  const connectedNodes = computed(() =>
    store.connectedServer
      .filter((which) => (which.outbound ?? "proxy") === store.outboundName)
      .flatMap((which) => {
        const row = touch.value && locate(touch.value, which);
        return row
          ? [{ key: `${which._type}-${which.sub ?? ""}-${which.id}`, row }]
          : [];
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
  const modeKeys: Record<string, string> = {
    close: "setting.options.off",
    proxy: "setting.options.global",
    whitelist: "setting.options.whitelistCn",
    gfwlist: "setting.options.gfwlist",
    pac: "setting.options.sameAsPacMode",
  };
  function modeLabel(value?: string) {
    if (!value) return "—";
    return modeKeys[value] ? t(modeKeys[value]) : value;
  }
  const transparentMode = computed(() => {
    const value = setting.value?.transparent;
    const label = modeLabel(value);
    return value && value !== "close"
      ? `${t("setting.options.on")}: ${label}`
      : label;
  });
  const rulePortMode = computed(() =>
    setting.value?.pacMode === "routingA"
      ? "RoutingA"
      : modeLabel(setting.value?.pacMode),
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

  onMounted(async () => {
    await Promise.all([
      getTouch().then(apply).catch(report),
      getSetting()
        .then((response) => (setting.value = response.setting))
        .catch(report),
    ]);
    loading.value = false;
  });

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
    nodeCount,
    subscriptionCount,
    connectedNodes,
    stateLabel,
    canToggle,
    transparentMode,
    rulePortMode,
    toggleRunning,
  };
}
