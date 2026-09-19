// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { mountWithApp } from "@/test/mount";
import About from "./About.vue";

describe("the about dialog", () => {
  test("lists the ports and links the discussions", () => {
    const w = mountWithApp(About);
    expect(w.text()).toContain("2017");
    expect(w.text()).toContain("v2rayA service port");
    expect(w.find('a[href$="/discussions"]').exists()).toBe(true);
    w.unmount();
  });
});
