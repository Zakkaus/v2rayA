// Material 3 colour roles from one seed colour, the way the Material theme
// builder derives them: the seed's hue and chroma in HCT space give the
// primary, secondary, tertiary and neutral tonal palettes, and each role
// is a fixed tone of one palette, in a light and a dark version. The
// scheme is "tonal spot", Material's default. Only the seed is the user's
// choice; success, warning and info are the interface's own fixed hues.
import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeMonochrome,
  SchemeTonalSpot,
} from "@material/material-color-utilities";

/** The default seed: Google yellow. */
export const brandSeed = "#fbbc04";

export const presetSeeds: { name: string; seed: string }[] = [
  { name: "brand", seed: brandSeed },
  { name: "teal", seed: "#2a8c96" },
  { name: "blue", seed: "#4a6fd5" },
  { name: "green", seed: "#3d8f5a" },
  { name: "purple", seed: "#7b57c7" },
  { name: "red", seed: "#c8493f" },
];

// role → Vuetify colour key
const roles = {
  primary: "primary",
  onPrimary: "on-primary",
  primaryContainer: "primary-container",
  onPrimaryContainer: "on-primary-container",
  inversePrimary: "inverse-primary",
  secondary: "secondary",
  onSecondary: "on-secondary",
  secondaryContainer: "secondary-container",
  onSecondaryContainer: "on-secondary-container",
  tertiary: "tertiary",
  onTertiary: "on-tertiary",
  tertiaryContainer: "tertiary-container",
  onTertiaryContainer: "on-tertiary-container",
  error: "error",
  onError: "on-error",
  errorContainer: "error-container",
  onErrorContainer: "on-error-container",
  background: "background",
  onBackground: "on-background",
  surface: "surface",
  onSurface: "on-surface",
  surfaceDim: "surface-dim",
  surfaceBright: "surface-bright",
  surfaceContainerLowest: "surface-container-lowest",
  surfaceContainerLow: "surface-container-low",
  surfaceContainer: "surface-container",
  surfaceContainerHigh: "surface-container-high",
  surfaceContainerHighest: "surface-container-highest",
  surfaceVariant: "surface-variant",
  onSurfaceVariant: "on-surface-variant",
  inverseSurface: "inverse-surface",
  inverseOnSurface: "inverse-on-surface",
  outline: "outline",
  outlineVariant: "outline-variant",
  surfaceTint: "surface-tint",
} as const;

const fixed = {
  light: { success: "#506da4", warning: "#dc8e47", info: "#4497a5" },
  dark: { success: "#4fc3d9", warning: "#ffb300", info: "#4fc3d9" },
  on: {
    "on-success": "#ffffff",
    "on-warning": "#ffffff",
    "on-info": "#ffffff",
  },
};

/** isSeed accepts a #rrggbb colour. */
/** seedFromHue gives a vivid seed at a hue (0–360): HCT chroma 48, tone 60, as the theme builder's wheel does. */
export function seedFromHue(hue: number): string {
  return hexFromArgb(Hct.from(((hue % 360) + 360) % 360, 48, 60).toInt());
}

/** hueOf reads a seed's HCT hue, for the slider's position. */
export function hueOf(seed: string): number {
  return isSeed(seed) ? Hct.fromInt(argbFromHex(seed)).hue : 0;
}

export function isSeed(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** The colour set of one theme, complete: Vuetify's required keys and every Material role. */
export type SchemeColors = Record<string, string> &
  Record<
    | "background"
    | "surface"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "on-background"
    | "on-surface"
    | "on-primary"
    | "on-secondary"
    | "on-success"
    | "on-warning"
    | "on-error"
    | "on-info",
    string
  >;

// Named palettes: not derived from a seed but mapped onto Material's roles
// by hand. Rosé Pine (Dawn for light, Main for dark).
const rosePineDawn = {
  base: "#faf4ed",
  surface: "#fffaf3",
  overlay: "#f2e9e1",
  muted: "#9893a5",
  subtle: "#797593",
  text: "#575279",
  love: "#b4637a",
  gold: "#ea9d34",
  rose: "#d7827e",
  pine: "#286983",
  foam: "#56949f",
  iris: "#907aa9",
  highlightLow: "#f4ede8",
  highlightMed: "#dfdad9",
  highlightHigh: "#cecacd",
};
const rosePineMain = {
  base: "#191724",
  surface: "#1f1d2e",
  overlay: "#26233a",
  muted: "#6e6a86",
  subtle: "#908caa",
  text: "#e0def4",
  love: "#eb6f92",
  gold: "#f6c177",
  rose: "#ebbcba",
  pine: "#31748f",
  foam: "#9ccfd8",
  iris: "#c4a7e7",
  highlightLow: "#21202e",
  highlightMed: "#403d52",
  highlightHigh: "#524f67",
};

function rosePine(dark: boolean): Record<string, string> {
  const p = dark ? rosePineMain : rosePineDawn;
  return {
    primary: p.iris,
    "on-primary": p.base,
    "primary-container": dark ? p.highlightMed : p.highlightLow,
    "on-primary-container": p.text,
    "inverse-primary": dark ? rosePineDawn.iris : rosePineMain.iris,
    secondary: p.foam,
    "on-secondary": p.base,
    "secondary-container": dark ? p.highlightMed : p.highlightMed,
    "on-secondary-container": p.text,
    tertiary: p.rose,
    "on-tertiary": p.base,
    "tertiary-container": dark ? p.highlightLow : p.overlay,
    "on-tertiary-container": p.text,
    error: p.love,
    "on-error": p.base,
    "error-container": dark ? "#3d2231" : "#f6dfe3",
    "on-error-container": dark ? "#ffd9df" : "#6b2a3d",
    background: p.base,
    "on-background": p.text,
    surface: p.base,
    "on-surface": p.text,
    "surface-dim": dark ? "#16141f" : p.overlay,
    "surface-bright": dark ? p.highlightMed : p.surface,
    "surface-container-lowest": dark ? "#16141f" : p.surface,
    "surface-container-low": dark ? p.surface : p.highlightLow,
    "surface-container": p.overlay,
    "surface-container-high": dark ? p.highlightLow : p.highlightMed,
    "surface-container-highest": dark ? p.highlightMed : p.highlightHigh,
    "surface-variant": p.highlightMed,
    "on-surface-variant": p.subtle,
    "inverse-surface": p.text,
    "inverse-on-surface": p.base,
    outline: p.muted,
    "outline-variant": p.highlightHigh,
    "surface-tint": p.iris,
  };
}

export const palettes: Record<
  string,
  (dark: boolean) => Record<string, string>
> = {
  "rose-pine": rosePine,
};

/** isPalette tells a named palette from a seed. */
export function isPalette(value: string): boolean {
  return value in palettes;
}

/** schemeColors gives the Vuetify colour set for one seed or palette in one brightness. */
export function schemeColors(seed: string, dark: boolean): SchemeColors {
  if (isPalette(seed))
    return {
      ...palettes[seed](dark),
      ...fixed[dark ? "dark" : "light"],
      ...fixed.on,
    } as SchemeColors;
  const hct = Hct.fromInt(argbFromHex(isSeed(seed) ? seed : brandSeed));
  // a grey, black or white seed has no hue to speak of: tonal spot would
  // paint it pink from hue 0, so those get the monochrome scheme instead
  const scheme =
    hct.chroma < 5
      ? new SchemeMonochrome(hct, dark, 0)
      : new SchemeTonalSpot(hct, dark, 0);
  const colors: Record<string, string> = {};
  for (const [role, key] of Object.entries(roles)) {
    const color = MaterialDynamicColors[role as keyof typeof roles];
    colors[key] = hexFromArgb(color.getArgb(scheme));
  }
  return {
    ...colors,
    ...fixed[dark ? "dark" : "light"],
    ...fixed.on,
  } as SchemeColors;
}
