// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  enableAutoUnmount,
  flushPromises,
  type VueWrapper,
} from "@vue/test-utils";
import { mountWithApp } from "@/test/mount";
import {
  closeAllDialogs,
  closeDialog,
  dialogState,
} from "@/composables/useDialog";
import { closeAllNotices, noticeState } from "@/composables/useNotify";
import en from "@/locales/en";
import RoutingA from "./RoutingA.vue";

const api = vi.hoisted(() => ({
  getRoutingA: vi.fn(),
  putRoutingA: vi.fn(),
}));
vi.mock("@/api", () => api);

const rules = "default: direct\n# inbound(http, 8080)\n";
const button = (w: VueWrapper, label: string) =>
  w.findAll("button").find((b) => b.text() === label)!;

enableAutoUnmount(afterEach);
beforeEach(() => {
  api.getRoutingA.mockReset().mockResolvedValue({ routingA: rules });
  api.putRoutingA.mockReset().mockResolvedValue(null);
});
afterEach(() => {
  closeAllDialogs();
  closeAllNotices();
});

describe("the RoutingA dialog", () => {
  test("loads the script and saves it unchanged without confirming comments", async () => {
    const w = mountWithApp(RoutingA);
    await flushPromises();
    expect(w.get("textarea").element.value).toBe(rules);
    await button(w, en.operations.save).trigger("click");
    await flushPromises();
    expect(dialogState.stack).toHaveLength(0);
    expect(api.putRoutingA).toHaveBeenCalledExactlyOnceWith({
      routingA: rules,
    });
    expect(w.emitted("close")).toEqual([[]]);
    expect(noticeState.current).toBeNull();
  });

  test("saves edited text verbatim and shows the server warning for eight seconds", async () => {
    const warning = "Inbound ports are not generated";
    api.putRoutingA.mockResolvedValue({ warning });
    const w = mountWithApp(RoutingA);
    await flushPromises();
    const edited = "  default: proxy\n\n";
    await w.get("textarea").setValue(edited);
    await button(w, en.operations.save).trigger("click");
    await flushPromises();
    expect(api.putRoutingA).toHaveBeenCalledExactlyOnceWith({
      routingA: edited,
    });
    expect(noticeState.current).toMatchObject({
      kind: "warning",
      text: en.routingA.savedWithWarning.replace("{warning}", warning),
      timeout: 8000,
    });
    expect(w.emitted("close")).toEqual([[]]);
  });

  test.each(["inbound(http, 8080)", "  inbound (socks, 1080)"])(
    "requires confirmation for %s and allows cancelling before saving",
    async (inbound) => {
      api.getRoutingA.mockResolvedValue({ routingA: `${rules}${inbound}` });
      const w = mountWithApp(RoutingA);
      await flushPromises();
      expect(w.get('[role="alert"]').text()).toContain(
        en.routingA.inboundDeprecated,
      );
      await button(w, en.operations.save).trigger("click");
      await flushPromises();
      expect(api.putRoutingA).not.toHaveBeenCalled();
      expect(dialogState.stack).toHaveLength(1);
      expect(dialogState.stack[0].props.message).toBe(
        en.routingA.inboundDeprecatedConfirm,
      );
      closeDialog(dialogState.stack[0].id, false);
      await flushPromises();
      expect(api.putRoutingA).not.toHaveBeenCalled();
      expect(w.emitted("close")).toBeUndefined();
      await button(w, en.operations.save).trigger("click");
      await flushPromises();
      closeDialog(dialogState.stack[0].id, true);
      await flushPromises();
      expect(api.putRoutingA).toHaveBeenCalledExactlyOnceWith({
        routingA: `${rules}${inbound}`,
      });
      expect(w.emitted("close")).toEqual([[]]);
    },
  );

  test("rechecks edited lines and preserves warning dismissal until the next edit", async () => {
    const w = mountWithApp(RoutingA);
    await flushPromises();
    await w.get("textarea").setValue("\tinbound(http, 8080)");
    expect(w.get('[role="alert"]').text()).toContain(
      en.routingA.inboundDeprecated,
    );
    await w.get(".v-alert__close button").trigger("click");
    expect(w.find('.v-alert[role="alert"]').exists()).toBe(false);
    api.putRoutingA.mockRejectedValueOnce(new Error("Invalid rule"));
    await button(w, en.operations.save).trigger("click");
    await flushPromises();
    expect(dialogState.stack).toHaveLength(0);
    expect(api.putRoutingA).toHaveBeenCalledExactlyOnceWith({
      routingA: "\tinbound(http, 8080)",
    });
    expect(w.emitted("close")).toBeUndefined();
    await w.get("textarea").setValue("inbound (socks, 1080)");
    expect(w.get('[role="alert"]').text()).toContain(
      en.routingA.inboundDeprecated,
    );
    await w.get("textarea").setValue("# inbound(http, 8080)\ndefault: direct");
    expect(w.find('.v-alert[role="alert"]').exists()).toBe(false);
  });

  test("keeps the editor open after a save error and permits a corrected save", async () => {
    api.putRoutingA.mockRejectedValueOnce(new Error("Invalid rule"));
    const w = mountWithApp(RoutingA);
    await flushPromises();
    await button(w, en.operations.save).trigger("click");
    await flushPromises();
    expect(noticeState.current).toMatchObject({
      kind: "warning",
      text: en.routingA.saveFailed.replace("{message}", "Invalid rule"),
    });
    expect(w.emitted("close")).toBeUndefined();
    await w.get("textarea").setValue("");
    await button(w, en.operations.save).trigger("click");
    await flushPromises();
    expect(api.putRoutingA).toHaveBeenLastCalledWith({ routingA: "" });
    expect(w.emitted("close")).toEqual([[]]);
  });

  test("closes on a load failure without writing an empty script", async () => {
    api.getRoutingA.mockRejectedValue(new Error("Offline"));
    const w = mountWithApp(RoutingA);
    expect(button(w, en.operations.save).attributes("disabled")).toBeDefined();
    await flushPromises();
    expect(w.emitted("close")).toEqual([[]]);
    expect(api.putRoutingA).not.toHaveBeenCalled();
    expect(noticeState.current).toMatchObject({
      kind: "warning",
      text: "Offline",
    });
  });

  test("links to the manual and cancels without saving", async () => {
    const w = mountWithApp(RoutingA);
    await flushPromises();
    const help = w.get("a");
    expect(help.attributes("href")).toBe(
      "https://github.com/v2rayA/v2rayA/wiki/RoutingA",
    );
    expect(help.attributes("target")).toBe("_blank");
    await button(w, en.operations.cancel).trigger("click");
    expect(w.emitted("close")).toEqual([[]]);
    expect(api.putRoutingA).not.toHaveBeenCalled();
  });
});
