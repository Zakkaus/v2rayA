// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DOMWrapper, flushPromises, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { VApp, VMain } from "vuetify/components";
import { getSetting, putSetting } from "@/api";
import type { Setting, VersionResponse } from "@/api/types";
import DialogHost from "@/components/hosts/DialogHost.vue";
import { closeAllDialogs } from "@/composables/useDialog";
import { useAppStore } from "@/stores/app";
import { mountWithApp } from "@/test/mount";
import ProxySettings from "./ProxySettings.vue";

vi.mock("@/api", () => ({
  getSetting: vi.fn(),
  putSetting: vi.fn(),
}));

const loaded: Setting = {
  transparent: "proxy",
  transparentType: "tproxy",
  ipforward: true,
  portSharing: false,
  tproxyExcludedInterfaces: "docker*,veth*",
  tunAutoRoute: true,
  tunRouteShellType: "bash",
  tunRouteShellPath: "/bin/bash",
  tunSetupScript: "",
  tunTeardownScript: "",
  tunExcludeProcesses: "firefox,chrome",
  pacMode: "gfwlist",
  pacAutoUpdateMode: "none",
  pacAutoUpdateIntervalHour: 24,
  subscriptionAutoUpdateMode: "none",
  subscriptionAutoUpdateIntervalHour: 12,
  proxyModeWhenSubscribe: "direct",
  tcpFastOpen: "default",
  logLevel: "info",
  inboundSniffing: "http,tls",
  routeOnly: true,
  muxOn: "yes",
  mux: 8,
};

let wrapper: VueWrapper;
beforeEach(() => {
  vi.mocked(getSetting).mockResolvedValue({
    setting: { ...loaded },
    localGFWListVersion: "2026-09-15",
  });
  vi.mocked(putSetting).mockResolvedValue(undefined);
});
afterEach(() => {
  closeAllDialogs();
  wrapper?.unmount();
  vi.clearAllMocks();
});

async function mountList() {
  wrapper = mountWithApp(
    defineComponent({
      setup: () => () =>
        h(VApp, null, () => [
          h(VMain, null, () => h(ProxySettings)),
          h(DialogHost),
        ]),
    }),
  );
  useAppStore().version = {
    os: "linux",
    isRoot: true,
    tunSupported: true,
  } as VersionResponse;
  await flushPromises();
}

async function choose(label: string, option: string) {
  await wrapper.get(`button[aria-label^="${label}:"]`).trigger("click");
  await flushPromises();
  const item = [...document.querySelectorAll('[role="menuitemradio"]')].find(
    (entry) => entry.textContent?.trim() === option,
  );
  expect(item, `${label}: ${option}`).toBeDefined();
  await new DOMWrapper(item!).trigger("click");
  await flushPromises();
}

async function toggle(label: string, value: boolean) {
  await wrapper.get(`input[aria-label="${label}"]`).setValue(value);
  await flushPromises();
}

describe("proxy settings", () => {
  test("saves every change at once with the whole form", async () => {
    await mountList();
    await toggle("Port Sharing", true);
    expect(putSetting).toHaveBeenCalledExactlyOnceWith(
      { ...loaded, portSharing: true },
      { signal: expect.any(AbortSignal) },
    );
    await choose("Transparent Proxy/System Proxy", "Off");
    expect(putSetting).toHaveBeenCalledTimes(2);
    expect(vi.mocked(putSetting).mock.calls[1][0]).toMatchObject({
      transparent: "close",
      portSharing: true,
    });
    expect(
      wrapper.find('input[aria-label="Excluded Interface Prefixes"]').exists(),
    ).toBe(false);
  });

  test("shows what the chosen implementation needs", async () => {
    await mountList();
    expect(
      wrapper.find('input[aria-label="Excluded Interface Prefixes"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain("Direct Whitelist IP Groups");
    await choose("Transparent Proxy/System Proxy Implementation", "tun");
    expect(wrapper.text()).toContain("TUN Excluded Processes");
    expect(wrapper.text()).not.toContain("Direct Whitelist IP Groups");
    expect(wrapper.text()).not.toContain("Configure Route Script");
    await toggle("Auto Route", false);
    expect(wrapper.text()).toContain("Configure Route Script");
  });

  test("reloads the settings when a save fails", async () => {
    await mountList();
    vi.mocked(putSetting).mockRejectedValueOnce(new Error("nope"));
    await toggle("Port Sharing", true);
    await flushPromises();
    expect(getSetting).toHaveBeenCalledTimes(2);
    expect(
      (
        wrapper.get('input[aria-label="Port Sharing"]')
          .element as HTMLInputElement
      ).checked,
    ).toBe(false);
  });
});
