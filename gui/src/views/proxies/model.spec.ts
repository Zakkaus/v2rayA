// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { effectScope } from "vue";
import type { EffectScope } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { flushPromises } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import type * as Api from "@/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { mountWithApp } from "@/test/mount";
import { useAppStore } from "@/stores/app";
import type { TouchResponse, TouchServer } from "@/api/types";
import ProxiesView from "../ProxiesView.vue";
import NodesView from "../NodesView.vue";
import { groupMembers, useProxies } from "./model";

const api = vi.hoisted(() => ({
  getTouch: vi.fn(),
  getPingLatency: vi.fn(),
  postConnection: vi.fn(),
  putOutboundConnections: vi.fn(),
}));
vi.mock("@/api", async (original) => ({
  ...(await original<typeof Api>()),
  ...api,
}));

dayjs.extend(utc);
dayjs.extend(timezone);
const server = (id: number, name: string, net = "vmess"): TouchServer => ({
  id,
  name,
  net,
  _type: "server",
  address: `${name.toLowerCase()}.example:443`,
  pingLatency: "",
});
function fixture(): TouchResponse {
  return {
    running: true,
    networkPaused: false,
    touch: {
      servers: [server(1, "North"), server(2, "South", "trojan")],
      subscriptions: [0, 1].map((id) => ({
        id: id + 1,
        _type: "subscription",
        host: `feed-${id}.example`,
        address: `https://feed-${id}.example`,
        status: "2026-09-19T00:00:00Z",
        info: "",
        autoSelect: false,
        servers: [
          {
            ...server(1, id === 0 ? "West" : "East", "vless"),
            _type: "subscriptionServer",
            sub: id,
          },
        ],
      })),
      connectedServer: [
        { id: 1, _type: "server", outbound: "media" },
        { id: 1, _type: "subscriptionServer", sub: 0, outbound: "media" },
        { id: 2, _type: "server", outbound: "other" },
        { id: 1, _type: "subscriptionServer", sub: 1 },
        { id: 99, _type: "server", outbound: "media" },
      ],
    },
  };
}
let response: TouchResponse;
const scopes: EffectScope[] = [];
const wrappers: VueWrapper[] = [];
function model() {
  const scope = effectScope();
  scopes.push(scope);
  return scope.run(() => useProxies())!;
}
function mountPage() {
  const wrapper = mountWithApp(ProxiesView);
  wrappers.push(wrapper);
  useAppStore().outbounds = ["proxy", "media", "other", "empty"];
  return wrapper;
}

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
  response = fixture();
  vi.clearAllMocks();
  api.getTouch.mockImplementation(async () => structuredClone(response));
  api.putOutboundConnections.mockImplementation(
    async ({ outbound, touches }) => {
      response.touch.connectedServer = [
        ...response.touch.connectedServer!.filter(
          (which) => (which.outbound ?? "proxy") !== outbound,
        ),
        ...touches,
      ];
      return structuredClone(response);
    },
  );
  api.postConnection.mockImplementation(async () => structuredClone(response));
  api.getPingLatency.mockResolvedValue({
    whiches: [
      { id: 1, _type: "server", pingLatency: "80ms" },
      { id: 1, _type: "subscriptionServer", sub: 0, pingLatency: "20ms" },
      { id: 2, _type: "server", pingLatency: "1ms" },
    ],
  });
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  scopes.splice(0).forEach((scope) => scope.stop());
});

describe("outbound group cards", () => {
  test("resolves members by outbound and subscription index, ignoring missing nodes", () => {
    const touch = response.touch;
    expect(
      groupMembers(touch, touch.connectedServer!, "media").map(
        (row) => row.name,
      ),
    ).toEqual(["North", "West"]);
    expect(
      groupMembers(touch, touch.connectedServer!, "proxy").map(
        (row) => row.name,
      ),
    ).toEqual(["East"]);
    expect(groupMembers(touch, touch.connectedServer!, "empty")).toEqual([]);
  });

  test("searches names, addresses and protocols without changing group membership", async () => {
    const proxies = model();
    proxies.store.outbounds = ["media"];
    await proxies.sync();
    for (const [query, names] of [
      [" NoRtH ", ["North"]],
      ["west.example", ["West"]],
      ["VLESS", ["West"]],
      ["missing", []],
    ] as const) {
      proxies.query.value = query;
      expect(proxies.groups.value[0].visible.map((row) => row.name)).toEqual(
        names,
      );
      expect(proxies.groups.value[0].members.map((row) => row.name)).toEqual([
        "North",
        "West",
      ]);
    }
    proxies.query.value = "trojan";
    expect(proxies.sources.value[0].rows.map((row) => row.name)).toEqual([
      "South",
    ]);
    expect(proxies.sources.value[1].rows).toEqual([]);
  });

  test("tests and connects the group's fastest member, not the search result or another outbound", async () => {
    const proxies = model();
    await proxies.sync();
    proxies.query.value = "North";
    await proxies.testGroup("media", "testing");
    expect(api.getPingLatency).toHaveBeenCalledWith([
      { id: 1, _type: "server", sub: null },
      { id: 1, _type: "subscriptionServer", sub: 0 },
    ]);
    await proxies.connectGroup("media");
    expect(api.postConnection).toHaveBeenCalledWith(
      { id: 1, _type: "subscriptionServer", sub: 0, outbound: "media" },
      expect.anything(),
    );
    await proxies.toggleGroup(proxies.nodes.touch.value.servers[0], "media");
    expect(proxies.tested.value.has("media")).toBe(false);
  });

  test("mounts cards, removes a member by chip, filters sources and remembers list mode", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const media = wrapper.get('[data-group="media"]');
    expect(media.findAll(".v-chip").map((chip) => chip.text())).toEqual([
      "North",
      "West",
    ]);
    await media.get(".v-chip").trigger("click");
    await flushPromises();
    expect(media.findAll(".v-chip").map((chip) => chip.text())).toEqual([
      "West",
    ]);
    expect(wrapper.get('[data-group="proxy"]').text()).toContain("East");
    await wrapper.get("input").setValue("VLESS");
    expect(media.findAll(".v-chip").map((chip) => chip.text())).toEqual([
      "West",
    ]);
    await wrapper.get(".v-expansion-panel-title").trigger("click");
    await flushPromises();
    expect(wrapper.get(".v-expansion-panel-text").findAll(".v-chip")).toEqual(
      [],
    );
    const listButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "List")!;
    await listButton.trigger("click");
    await flushPromises();
    expect(wrapper.findComponent(NodesView).exists()).toBe(true);
    expect(localStorage.getItem("proxiesView")).toBe("list");
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    const restored = mountPage();
    await flushPromises();
    expect(restored.findComponent(NodesView).exists()).toBe(true);
  });

  test("keeps a failed load distinct from an empty group and retries", async () => {
    api.getTouch.mockRejectedValueOnce(new Error("backend unavailable"));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "backend unavailable",
    );
    expect(wrapper.find('[data-group="media"]').exists()).toBe(false);
    await wrapper.get('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(wrapper.get('[data-group="media"]').text()).toContain("West");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
