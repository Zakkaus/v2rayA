import "vuetify/styles";
import { createVuetify, type ThemeDefinition } from "vuetify";
import { md3 } from "vuetify/blueprints";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import "./typography.scss";

// Material 3 colour roles. The brand's yellow is a container colour, not a
// text colour: MD3 puts it behind filled buttons and chips, and pairs it
// with a dark "on" colour. The dark palette is the one dark-theme.scss
// already carried as --md-* variables.
export const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#fffbff",
    "on-background": "#1c1b1f",
    surface: "#fffbff",
    "on-surface": "#1c1b1f",
    "surface-variant": "#e7e2d0",
    "on-surface-variant": "#49463a",
    "surface-container": "#f3efe3",
    "surface-container-high": "#ede9dd",
    "surface-bright": "#fffbff",
    outline: "#7a7667",
    "outline-variant": "#cbc6b5",
    primary: "#6d5e00",
    "on-primary": "#ffffff",
    "primary-container": "#ffe08a",
    "on-primary-container": "#211b00",
    secondary: "#506da4",
    "on-secondary": "#ffffff",
    "secondary-container": "#d8e2ff",
    "on-secondary-container": "#001a41",
    tertiary: "#4497a5",
    "on-tertiary": "#ffffff",
    "tertiary-container": "#bdeaf5",
    "on-tertiary-container": "#001f24",
    error: "#ba1a1a",
    "on-error": "#ffffff",
    "error-container": "#ffdad6",
    "on-error-container": "#410002",
    success: "#506da4",
    warning: "#dc8e47",
    info: "#4497a5",
  },
};

export const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#1c1b1f",
    "on-background": "#e6e1e5",
    surface: "#1c1b1f",
    "on-surface": "#e6e1e5",
    "surface-variant": "#49454f",
    "on-surface-variant": "#cac4d0",
    "surface-container": "#211f26",
    "surface-container-high": "#2b2930",
    "surface-bright": "#3b383e",
    outline: "#938f99",
    "outline-variant": "#49454f",
    primary: "#d0bcff",
    "on-primary": "#381e72",
    "primary-container": "#4f378b",
    "on-primary-container": "#eaddff",
    secondary: "#adc6ff",
    "on-secondary": "#002e69",
    "secondary-container": "#1f3f53",
    "on-secondary-container": "#d8e2ff",
    tertiary: "#4fc3d9",
    "on-tertiary": "#00363d",
    "tertiary-container": "#004f58",
    "on-tertiary-container": "#bdeaf5",
    error: "#ffb4ab",
    "on-error": "#690005",
    "error-container": "#93000a",
    "on-error-container": "#ffdad6",
    success: "#4fc3d9",
    warning: "#ffb300",
    info: "#4fc3d9",
  },
};

// The theme name Vuetify starts with; App switches it from the stored
// preference (auto/light/dark) and the OS query.
export const vuetify = createVuetify({
  blueprint: md3,
  icons: { defaultSet: "mdi", aliases, sets: { mdi } },
  theme: {
    defaultTheme: "light",
    themes: { light, dark },
    // the state layer opacities MD3 specifies; the blueprint does not set them
    variations: {
      colors: ["primary", "secondary", "tertiary"],
      lighten: 1,
      darken: 1,
    },
  },
  defaults: {
    global: { ripple: false },
    VBtn: { variant: "flat" },
    VCard: { elevation: 0, rounded: "lg" },
    VDialog: { scrim: "on-surface" },
    VTextField: { variant: "outlined", density: "comfortable" },
    VSelect: { variant: "outlined", density: "comfortable" },
    VCombobox: { variant: "outlined", density: "comfortable" },
    VTextarea: { variant: "outlined", density: "comfortable" },
    VSwitch: { inset: true, color: "primary" },
    VDataTable: { density: "comfortable" },
  },
});
