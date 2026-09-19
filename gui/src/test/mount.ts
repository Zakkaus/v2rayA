// mountWithApp mounts a component the way the page does: Vuetify, Pinia,
// vue-i18n (English). For specs under happy-dom, which lacks the layout
// observers Vuetify's components register.
import { mount, type ComponentMountingOptions } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import type { Component } from "vue";
import messages from "@/locales";
import { vuetify } from "@/theme";

class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= Observer as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??=
  Observer as unknown as typeof IntersectionObserver;
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

export function mountWithApp<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const i18n = createI18n({ legacy: false, locale: "en", messages });
  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [vuetify, pinia, i18n, ...(options.global?.plugins ?? [])],
    },
    attachTo: document.body,
  });
}
