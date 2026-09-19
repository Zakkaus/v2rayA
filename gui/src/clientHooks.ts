// What the app does with a failed request beyond the caller's own notice:
// a 401 ends the session, and a backend that cannot be reached is
// announced once per address with the way out (the address dialog, the
// manual). This is the old axios interceptor's UI, on the notice queue.
import { setClientHooks, type ApiError } from "@/api/client";
import { useNotify } from "@/composables/useNotify";
import i18n from "@/plugins/i18n";
import { resetSession } from "@/session";
import { useAppStore } from "@/stores/app";

let informed = "";

export function installClientHooks(ui: { openAddressDialog(): void }): void {
  const t = i18n.global.t;
  const notify = useNotify();
  const suggestAddress = () =>
    notify.info(t("axios.messages.optimizeBackend"), {
      timeout: 10_000,
      action: { label: t("operations.yes"), onClick: ui.openAddressDialog },
    });
  const informNotRunning = (url: string) => {
    if (informed === url) return;
    informed = url;
    suggestAddress();
    notify.warning(t("axios.messages.noBackendFound", { url }), {
      timeout: 10_000,
      action: {
        label: t("operations.helpManual"),
        onClick: () => window.open(t("axios.urls.usage"), "_blank"),
      },
    });
  };

  setClientHooks({
    onUnauthorized() {
      const store = useAppStore();
      if (store.loggedIn) void resetSession({ token: "" });
    },
    onError(err: ApiError) {
      const origin = originOf(err.url);
      if (err.kind === "mixed-content") {
        const host = new URL(err.url).hostname;
        const local = ["localhost", "local", "127.0.0.1"].includes(host);
        const ua = navigator.userAgent;
        if (local && ua.includes("AppleWebKit")) {
          // Chrome allows an https page to reach http://localhost; the
          // failure means the service is not running there
          informNotRunning(origin);
          return;
        }
        const gecko = ua.includes("Gecko") && !ua.includes("KHTML");
        notify.warning(
          t(`axios.messages.cannotCommunicate.${local && gecko ? 1 : 0}`),
          {
            timeout: 10_000,
            action: {
              label: t("operations.switchSite"),
              onClick: () => window.open("http://v.v2raya.org", "_self"),
            },
          },
        );
        suggestAddress();
      } else if (err.kind === "network" || err.url.endsWith("/api/version")) {
        informNotRunning(origin);
      }
    },
  });
}

/** originOf gives the backend's origin for a request URL: the absolute address, or this page's for a relative one. */
function originOf(url: string): string {
  try {
    return new URL(url, location.href).origin;
  } catch {
    return url;
  }
}
