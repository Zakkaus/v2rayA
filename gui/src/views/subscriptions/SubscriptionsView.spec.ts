// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { setTimeout as delay } from "node:timers/promises";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { VApp } from "vuetify/components";
import {
  getTouch,
  putSubscription,
  deleteTouch,
  getSharingAddress,
} from "@/api";
import type { TouchResponse, TouchSubscription } from "@/api/types";
import {
  closeAllDialogs,
  closeDialog,
  dialogState,
} from "@/composables/useDialog";
import { closeAllNotices, noticeState } from "@/composables/useNotify";
import { mountWithApp } from "@/test/mount";
import ImportDialog from "@/dialogs/Import.vue";
import SharingDialog from "@/dialogs/Sharing.vue";
import SubscriptionDialog from "@/dialogs/Subscription.vue";
import SubscriptionsView from "../SubscriptionsView.vue";

vi.mock("@/api", () => ({
  getTouch: vi.fn(),
  putSubscription: vi.fn(),
  deleteTouch: vi.fn(),
  getSharingAddress: vi.fn(),
}));

const subscription: TouchSubscription = {
  id: 2,
  _type: "subscription",
  remarks: "Travel",
  host: "example.test",
  address: "https://example.test/subscription",
  status: "2026-09-19T12:00:00Z",
  info: "Used 1 GiB / 10 GiB · Expires 2026-10-01",
  servers: [
    {
      id: 0,
      _type: "subscriptionServer",
      name: "Node",
      address: "node.test",
      net: "vmess",
      pingLatency: "",
    },
  ],
  autoSelect: false,
};
let response: TouchResponse;
const App = defineComponent({
  setup: () => () => h(VApp, () => h(SubscriptionsView)),
});
let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("visualViewport", undefined);
  response = {
    running: false,
    networkPaused: false,
    touch: { subscriptions: [subscription], servers: [], connectedServer: [] },
  };
  vi.mocked(getTouch).mockImplementation(async () => response);
  vi.mocked(putSubscription).mockResolvedValue(response);
  vi.mocked(deleteTouch).mockResolvedValue(response);
  vi.mocked(getSharingAddress).mockResolvedValue({
    sharingAddress: subscription.address,
  });
});
afterEach(() => {
  wrapper?.unmount();
  closeAllDialogs();
  closeAllNotices();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

async function chooseAction(title: string) {
  await wrapper.get('button[aria-label="Operations"]').trigger("click");
  await flushPromises();
  const item = await vi.waitFor(() => {
    const match = Array.from(
      document.querySelectorAll<HTMLElement>(".v-overlay--active .v-list-item"),
    ).find((element) => element.textContent?.trim() === title);
    expect(match).toBeDefined();
    return match;
  });
  item!.click();
  await flushPromises();
  await vi.waitFor(() => {
    expect(
      wrapper
        .get('button[aria-label="Operations"]')
        .attributes("aria-expanded"),
    ).toBe("false");
  });
  // Vuetify locks reopening for 50 ms after a menu closes.
  await delay(60);
}

test("renders metadata and reloads after update, edit and confirmed deletion", async () => {
  wrapper = mountWithApp(App);
  await flushPromises();
  const card = wrapper.get(".v-card");
  expect(card.text()).toContain("Travel");
  // the quota line becomes a bar: used / total and the expiry
  expect(card.text()).toContain("1 GiB / 10 GiB");
  expect(card.text()).toContain("2026-10-01");
  expect(card.text()).toContain("2026-09-19");
  expect(card.text()).toMatch(/Number of Servers:\s*1/);

  await chooseAction("Update");
  expect(putSubscription).toHaveBeenCalledWith({
    id: 2,
    _type: "subscription",
  });
  expect(getTouch).toHaveBeenCalledTimes(2);

  await chooseAction("Modify");
  expect(dialogState.stack[0].component).toBe(SubscriptionDialog);
  expect(dialogState.stack[0].props.subscription).toEqual(subscription);
  response = {
    ...response,
    touch: {
      ...response.touch,
      subscriptions: [{ ...subscription, remarks: "Renamed" }],
    },
  };
  closeDialog(dialogState.stack[0].id, true);
  await flushPromises();
  expect(wrapper.get(".v-card").text()).toContain("Renamed");

  await chooseAction("Delete");
  closeDialog(dialogState.stack[0].id, false);
  await flushPromises();
  expect(deleteTouch).not.toHaveBeenCalled();
  await chooseAction("Delete");
  response = { ...response, touch: { ...response.touch, subscriptions: [] } };
  closeDialog(dialogState.stack[0].id, true);
  await flushPromises();
  expect(deleteTouch).toHaveBeenCalledWith([{ id: 2, _type: "subscription" }]);
  expect(wrapper.find(".v-empty-state").exists()).toBe(true);
});

test("shares with the existing dialog contract and imports from the empty state", async () => {
  response.touch.subscriptions = [];
  wrapper = mountWithApp(App);
  await flushPromises();
  await wrapper.get(".v-empty-state button").trigger("click");
  expect(dialogState.stack[0].component).toBe(ImportDialog);
  response.touch.subscriptions = [{ ...subscription, remarks: "" }];
  closeDialog(dialogState.stack[0].id, true);
  await flushPromises();
  expect(wrapper.get(".v-card-title").text()).toBe(subscription.host);
  expect(wrapper.get(".subscriptions > .d-flex .v-btn").text()).toBe("Import");
  await chooseAction("Share");
  expect(getSharingAddress).toHaveBeenCalledWith({
    id: 2,
    _type: "subscription",
  });
  expect(dialogState.stack[0].component).toBe(SharingDialog);
  expect(dialogState.stack[0].props).toEqual({
    title: "Share Subscription",
    name: subscription.host,
    link: subscription.address,
    type: "subscription",
  });
  closeDialog(dialogState.stack[0].id);
  await wrapper.get(".subscriptions > .d-flex .v-btn").trigger("click");
  expect(dialogState.stack[0].component).toBe(ImportDialog);
  closeDialog(dialogState.stack[0].id, false);
  await flushPromises();
  expect(getTouch).toHaveBeenCalledTimes(2);
});

test("shows a load failure rather than an empty state and allows another load", async () => {
  vi.mocked(getTouch).mockRejectedValueOnce(new Error("Backend unreachable"));
  wrapper = mountWithApp(App);
  expect(wrapper.find(".v-skeleton-loader").exists()).toBe(true);
  await flushPromises();
  expect(wrapper.get(".v-alert").text()).toContain("Backend unreachable");
  expect(noticeState.current?.text).toContain("Backend unreachable");
  expect(wrapper.find(".v-empty-state").exists()).toBe(false);
  await wrapper.get(".v-alert button").trigger("click");
  await flushPromises();
  expect(wrapper.find(".v-alert").exists()).toBe(false);
  expect(wrapper.get(".v-card-title").text()).toBe("Travel");
});
