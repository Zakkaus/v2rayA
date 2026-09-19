import { defineStore } from "pinia";
import type { Which, VersionResponse } from "@/api/types";

/** The core's state as the backend reports it; text for it comes from the locale. */
export type Running = "checking" | "running" | "stopped" | "paused";
export type ThemePreference = "auto" | "light" | "dark";

// One store for the session-wide state the old App.vue kept in data and
// localStorage: what was a translated text ("正在运行") is an enum here, so
// switching the language does not have to rebuild the page.
export const useAppStore = defineStore("app", {
  state: () => ({
    token: localStorage.getItem("token") ?? "",
    backendAddress: localStorage.getItem("backendAddress") ?? "",
    running: "checking" as Running,
    networkPaused: false,
    connectedServer: [] as Which[],
    outboundName: "proxy",
    outbounds: ["proxy"] as string[],
    observatory: null as Record<string, unknown> | null,
    version: null as VersionResponse | null,
    /** the last /version banner facts, seeded from localStorage before the request answers */
    lite: localStorage.getItem("lite") === "true",
    docker: localStorage.getItem("docker") === "true",
    variant: localStorage.getItem("variant") ?? "",
    loadBalanceValid: localStorage.getItem("loadBalanceValid") !== "false",
    coreVersionValid: localStorage.getItem("coreVersionValid") !== "false",
    coreVersionErr: localStorage.getItem("coreVersionErr") ?? "",
    themePreference: (["light", "dark"].includes(
      localStorage.getItem("theme") ?? "",
    )
      ? localStorage.getItem("theme")
      : "auto") as ThemePreference,
    systemDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    language: localStorage.getItem("_lang") ?? "",
  }),
  getters: {
    loggedIn: (s) => s.token !== "",
    isDark: (s) =>
      s.themePreference === "auto"
        ? s.systemDark
        : s.themePreference === "dark",
  },
  actions: {
    setToken(token: string) {
      this.token = token;
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    },
    setBackendAddress(address: string) {
      this.backendAddress = address;
      localStorage.setItem("backendAddress", address);
    },
    setRunning(running: Running, networkPaused = false) {
      this.running = running;
      this.networkPaused = networkPaused;
    },
    setTheme(preference: ThemePreference) {
      this.themePreference = preference;
      localStorage.setItem("theme", preference);
    },
    setLanguage(code: string) {
      this.language = code;
      localStorage.setItem("_lang", code);
    },
    applyVersion(v: VersionResponse) {
      this.version = v;
      this.lite = v.lite;
      this.docker = !!v.docker;
      this.variant = v.variant;
      this.loadBalanceValid = v.loadBalanceValid;
      this.coreVersionValid = v.coreVersionValid;
      this.coreVersionErr = v.coreVersionErr;
      localStorage.setItem("lite", String(v.lite));
      localStorage.setItem("docker", String(!!v.docker));
      localStorage.setItem("variant", v.variant);
      localStorage.setItem("loadBalanceValid", String(v.loadBalanceValid));
      localStorage.setItem("coreVersionValid", String(v.coreVersionValid));
      localStorage.setItem("coreVersionErr", v.coreVersionErr);
      localStorage.setItem("version", v.version);
    },
  },
});
