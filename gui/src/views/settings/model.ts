// The settings page's state and its two requests, without the view: the
// form as GET /setting returns it, saved with PUT /setting in the shape
// the old dialog sent (integers where it parsed them).
import { reactive, ref } from "vue";
import { getRemoteGFWListVersion, getSetting, putSetting } from "@/api";
import { ApiError } from "@/api/client";
import { watchConnected } from "@/api/connect";
import type { Setting } from "@/api/types";
import { openLoading } from "@/composables/useLoading";
import { useAppStore } from "@/stores/app";

export const defaultForm = () => ({
  transparent: "close",
  transparentType: "tproxy",
  ipforward: false,
  portSharing: false,
  tproxyExcludedInterfaces: "",
  tunAutoRoute: true,
  tunRouteShellType: "",
  tunRouteShellPath: "",
  tunSetupScript: "",
  tunTeardownScript: "",
  tunExcludeProcesses: "",
  pacMode: "whitelist",
  pacAutoUpdateMode: "none",
  pacAutoUpdateIntervalHour: 0,
  subscriptionAutoUpdateMode: "none",
  subscriptionAutoUpdateIntervalHour: 0,
  proxyModeWhenSubscribe: "direct",
  tcpFastOpen: "default",
  logLevel: "info",
  inboundSniffing: "disable",
  routeOnly: false,
  muxOn: "no",
  mux: 8,
});
export type SettingForm = ReturnType<typeof defaultForm>;

/** what PUT /setting takes; the numbers are parsed, as the old dialog did */
export function toRequest(form: SettingForm): Setting {
  return {
    ...form,
    pacAutoUpdateIntervalHour: parseInt(String(form.pacAutoUpdateIntervalHour)),
    subscriptionAutoUpdateIntervalHour: parseInt(
      String(form.subscriptionAutoUpdateIntervalHour),
    ),
    mux: parseInt(String(form.mux)),
  } as Setting;
}

export function useSettings() {
  const store = useAppStore();
  const form = reactive(defaultForm());
  const ready = ref(false);
  const localGFWListVersion = ref("");
  const remoteGFWListVersion = ref("");

  async function load(): Promise<void> {
    const res = await getSetting();
    for (const key of Object.keys(form) as (keyof SettingForm)[]) {
      if (key in res.setting)
        (form as Record<string, unknown>)[key] = res.setting[key];
    }
    localGFWListVersion.value = res.localGFWListVersion ?? "";
    if (store.lite) form.transparentType = "system_proxy";
    ready.value = true;
  }

  async function loadRemoteVersion(): Promise<void> {
    remoteGFWListVersion.value = (
      await getRemoteGFWListVersion()
    ).remoteGFWListVersion;
  }

  /** save applies the settings; an invalid config stops the core, which the store then shows. */
  async function save(): Promise<void> {
    const loading = openLoading();
    const control = new AbortController();
    try {
      await watchConnected(
        putSetting(toRequest(form), { signal: control.signal }),
        () => control.abort(),
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.body?.errorCode === "INVALID_CONFIG" ||
          err.body?.message?.includes("invalid config"))
      )
        store.setRunning("stopped");
      throw err;
    } finally {
      loading.close();
    }
  }

  return {
    form,
    ready,
    localGFWListVersion,
    remoteGFWListVersion,
    load,
    loadRemoteVersion,
    save,
  };
}
