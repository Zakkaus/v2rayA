<script setup lang="ts">
// The theme choices, as list content: the appearance (auto, light, dark)
// and the seed colour the palettes derive from — six presets and a
// custom one from the browser's colour picker. Rendered inside the app
// bar's menu and the phone drawer's group.
import { useI18n } from "vue-i18n";
import {
  mdiCheck,
  mdiPalette,
  mdiThemeLightDark,
  mdiWeatherNight,
  mdiWeatherSunny,
} from "@mdi/js";
import { useAppStore, type ThemePreference } from "@/stores/app";
import { presetSeeds } from "@/theme/scheme";

const { t } = useI18n();
const store = useAppStore();

const modes: { value: ThemePreference; icon: string; key: string }[] = [
  { value: "auto", icon: mdiThemeLightDark, key: "common.autoTheme" },
  { value: "light", icon: mdiWeatherSunny, key: "common.lightTheme" },
  { value: "dark", icon: mdiWeatherNight, key: "common.darkTheme" },
];

function pick(event: Event) {
  store.setThemeSeed((event.target as HTMLInputElement).value);
}
</script>

<template>
  <v-list-subheader>{{ t("theme.appearance") }}</v-list-subheader>
  <v-list-item
    v-for="m in modes"
    :key="m.value"
    :active="store.themePreference === m.value"
    :prepend-icon="m.icon"
    :title="t(m.key)"
    @click="store.setTheme(m.value)"
  />
  <v-divider class="my-1" />
  <v-list-subheader>{{ t("theme.color") }}</v-list-subheader>
  <div class="swatches px-4 pb-3">
    <button
      v-for="p in presetSeeds"
      :key="p.seed"
      type="button"
      class="swatch"
      :class="{ 'swatch--active': store.themeSeed === p.seed }"
      :style="{ background: p.seed }"
      :aria-label="p.seed"
      :aria-pressed="store.themeSeed === p.seed"
      @click="store.setThemeSeed(p.seed)"
    >
      <v-icon v-if="store.themeSeed === p.seed" :icon="mdiCheck" size="18" />
    </button>
    <label
      class="swatch swatch--custom"
      :class="{
        'swatch--active': !presetSeeds.some((p) => p.seed === store.themeSeed),
      }"
      :style="{ background: store.themeSeed }"
      :title="t('theme.custom')"
    >
      <input
        type="color"
        :value="store.themeSeed"
        :aria-label="t('theme.custom')"
        @input="pick"
      />
      <v-icon :icon="mdiPalette" size="18" />
    </label>
  </div>
</template>

<style scoped>
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.7);
  padding: 0;
}
.swatch--active {
  border-color: rgb(var(--v-theme-on-surface));
}
.swatch--custom {
  position: relative;
  overflow: hidden;
}
.swatch--custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
