import { createApp } from "vue";
import store from "@/store";
import AppShell from "@/AppShell.vue";
import i18n from "@/plugins/i18n";
import Buefy from "@/plugins/buefy";
import VirtualScroller from "@/plugins/virtual-scroll";
import { install as installAxios } from "@/plugins/axios";
import { install as installDayjs } from "@/plugins/dayjs";
import { createPinia } from "pinia";
import { vuetify } from "@/theme";
import { resetSession } from "@/session";

// Buefy's programmatic instances (the old dialogs, snackbars and loadings
// of the coexistence period) mount on <body> outside the shell's tree; the
// session reset closes them through closeProgrammatic().
const programmaticHandles = [];

let app = null;

export function buildApp() {
  app = createApp(AppShell);
  app.use(store);
  app.use(createPinia());
  app.use(vuetify);
  app.use(i18n);
  app.use(Buefy);
  app.use(VirtualScroller);
  installAxios(app);
  installDayjs(app);
  // The old dialogs call this.$remount() after a login or a backend
  // address change. The root stays; the session is reset.
  app.config.globalProperties.$remount = () => resetSession();
  return app;
}

// Buefy 3 exports SnackbarProgrammatic and friends as classes bound to an
// app; module-level code (axios interceptors, the network inspector) has no
// component to take $buefy from, so it takes the root app's.
export function buefy() {
  return app.config.globalProperties.$buefy;
}

export function registerProgrammatic(handle) {
  // A closed instance unmounts itself and leaves the document; drop those
  // so the list only holds what closeProgrammatic() still has to close.
  for (let i = programmaticHandles.length - 1; i >= 0; i--) {
    const el = programmaticHandles[i].$el;
    if (!el || !document.body.contains(el)) {
      programmaticHandles.splice(i, 1);
    }
  }
  programmaticHandles.push(handle);
}

// Register + return the handle of a programmatic instance opened through the
// component's own $buefy (which carries the app context). The caller still
// gets the handle back for its own .close().
export function openModal(ctx, opts) {
  const handle = ctx.$buefy.modal.open(opts);
  registerProgrammatic(handle);
  return handle;
}

export function openLoading(ctx) {
  // Buefy 3 reads options.onClose when the overlay closes and does not
  // tolerate a missing options object.
  const handle = ctx.$buefy.loading.open({});
  registerProgrammatic(handle);
  return handle;
}

// The new views open an old dialog through this during the coexistence
// period; the handle is the same as openModal's.
export function openLegacy(opts) {
  const handle = buefy().modal.open(opts);
  registerProgrammatic(handle);
  return handle;
}

export function closeProgrammatic() {
  for (const handle of programmaticHandles) {
    if (handle && typeof handle.close === "function") {
      handle.close();
    }
  }
  programmaticHandles.length = 0;
}
