// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import type * as api from "@/api";
import { deleteV2ray, getSetting, getTouch, postV2ray } from "@/api";
import { watchConnected } from "@/api/connect";
import type { TouchResponse, TouchServer } from "@/api/types";
import { loadingState } from "@/composables/useLoading";
import { closeAllNotices, noticeState } from "@/composables/useNotify";
import { useAppStore } from "@/stores/app";
import { mountWithApp } from "@/test/mount";
import DashboardView from "../DashboardView.vue";

vi.mock("@/api", async (original) => ({
  ...(await original<typeof api>()),
  getTouch: vi.fn(),
  getSetting: vi.fn(),
  postV2ray: vi.fn(),
  deleteV2ray: vi.fn(),
}));
vi.mock("@/api/connect", () => ({
  watchConnected: vi.fn((request: Promise<TouchResponse>) => request),
}));

const server = (name: string): TouchServer => ({
  id: 1,
  _type: "server",
  name,
  address: `${name}.example:443`,
  net: "vmess",
  pingLatency: "24ms",
});
function response(running = false): TouchResponse {
  return {
    running,
    networkPaused: false,
    touch: {
      servers: [server("Standalone")],
      subscriptions: [
        {
          id: 1,
          _type: "subscription",
          host: "subscription.example",
          address: "https://subscription.example",
          status: "",
          info: "",
          autoSelect: false,
          servers: [{ ...server("Subscribed"), _type: "subscriptionServer" }],
        },
      ],
      connectedServer: [
        { _type: "server", id: 1 },
        { _type: "subscriptionServer", id: 1, sub: 0, outbound: "work" },
      ],
    },
  };
}

let wrapper: VueWrapper;
const control = () =>
  wrapper
    .getComponent(".dashboard-status")
    .findAll("button")
    .find((b) => /Start|Stop/.test(b.text()))!;
const counts = () =>
  wrapper
    .findAll("dd")
    .slice(-2)
    .map((dd) => dd.text());

beforeEach(() => {
  vi.clearAllMocks();
  closeAllNotices();
  vi.mocked(getTouch).mockResolvedValue(response());
  vi.mocked(getSetting).mockResolvedValue({
    setting: {
      transparent: "close",
      transparentType: "tproxy",
      pacMode: "routingA",
      logLevel: "info",
    },
    localGFWListVersion: "",
  });
  vi.mocked(postV2ray).mockResolvedValue(response(true));
  vi.mocked(deleteV2ray).mockResolvedValue(response());
});
afterEach(() => wrapper?.unmount());

describe("dashboard", () => {
  test("shows counts, connected group members and modes, then starts and stops the core", async () => {
    wrapper = mountWithApp(DashboardView);
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("Ready");
    expect(counts()).toEqual(["2", "1"]);
    expect(wrapper.findAll(".dashboard-node").map((c) => c.text())).toEqual([
      "Standalone24ms",
    ]);
    expect(wrapper.text()).toContain("Off");
    expect(wrapper.text()).toContain("RoutingA");

    await control().trigger("click");
    await flushPromises();
    expect(postV2ray).toHaveBeenCalledOnce();
    expect(wrapper.get('[role="status"]').text()).toBe("Running");
    await control().trigger("click");
    await flushPromises();
    expect(deleteV2ray).toHaveBeenCalledOnce();
    expect(wrapper.get('[role="status"]').text()).toBe("Ready");
    expect(getTouch).toHaveBeenCalledOnce();

    useAppStore().outboundName = "work";
    await flushPromises();
    expect(wrapper.findAll(".dashboard-node").map((c) => c.text())).toEqual([
      "Subscribed24ms",
    ]);
    await wrapper.get(".v-list-item").trigger("click");
    expect(useAppStore().view).toBe("settings");
  });

  test("keeps the confirmed state while starting and prevents duplicate requests", async () => {
    // The project's ES library target predates Promise.withResolvers.
    let finish!: (value: TouchResponse) => void;
    const promise = new Promise<TouchResponse>((resolve) => {
      finish = resolve;
    });
    vi.mocked(postV2ray).mockReturnValue(promise);
    wrapper = mountWithApp(DashboardView);
    await flushPromises();
    await control().trigger("click");
    await control().trigger("click");
    expect(postV2ray).toHaveBeenCalledOnce();
    expect(wrapper.get('[role="status"]').text()).toBe("Ready");
    expect(control().attributes("disabled")).toBeDefined();
    expect(loadingState.open.size).toBe(1);
    finish(response(true));
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("Running");
    expect(loadingState.open.size).toBe(0);
  });

  test("refreshes confirmed state when the connection watcher wins", async () => {
    vi.mocked(watchConnected).mockResolvedValueOnce(undefined);
    vi.mocked(getTouch)
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response(true));
    wrapper = mountWithApp(DashboardView);
    await flushPromises();
    await control().trigger("click");
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("Running");
    expect(getTouch).toHaveBeenCalledTimes(2);
  });

  test("resumes a paused core and preserves state on a failed stop", async () => {
    vi.mocked(getTouch).mockResolvedValue({
      ...response(true),
      networkPaused: true,
    });
    wrapper = mountWithApp(DashboardView);
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("Waiting for network");
    await control().trigger("click");
    await flushPromises();
    expect(postV2ray).toHaveBeenCalledOnce();
    vi.mocked(deleteV2ray).mockRejectedValueOnce(new Error("Core is busy"));
    await control().trigger("click");
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("Running");
    expect(noticeState.current?.text).toContain("Core is busy");
    expect(control().attributes("disabled")).toBeUndefined();
    expect(loadingState.open.size).toBe(0);
  });

  test("does not invent counts when loading fails", async () => {
    vi.mocked(getTouch).mockRejectedValueOnce(new Error("Backend unreachable"));
    wrapper = mountWithApp(DashboardView);
    expect(control().attributes("disabled")).toBeDefined();
    await flushPromises();
    expect(counts()).toEqual(["—", "—"]);
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Backend unreachable",
    );
    expect(noticeState.current?.text).toContain("Backend unreachable");
    expect(control().attributes("disabled")).toBeDefined();
  });

  test("shows a genuine empty inventory without connected node chips", async () => {
    vi.mocked(getTouch).mockResolvedValueOnce({
      ...response(),
      touch: { servers: [], subscriptions: [], connectedServer: null },
    });
    wrapper = mountWithApp(DashboardView);
    await flushPromises();
    expect(counts()).toEqual(["0", "0"]);
    expect(wrapper.findAll(".dashboard-node")).toHaveLength(0);
    expect(wrapper.text()).toContain("No nodes added");
  });
});
