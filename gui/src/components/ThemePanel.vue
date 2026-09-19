<script setup lang="ts">
// The theme choices, as list content: the appearance (auto, light, dark)
// and the seed colour the palettes derive from, as the colour picker's
// swatches. Rendered inside the app bar's menu and the drawer's menu.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { mdiThemeLightDark, mdiWeatherNight, mdiWeatherSunny } from "@mdi/js";
import { useAppStore, type ThemePreference } from "@/stores/app";
import { presetSeeds } from "@/theme/scheme";

const { t } = useI18n();
const store = useAppStore();

const modes: { value: ThemePreference; icon: string; key: string }[] = [
  { value: "auto", icon: mdiThemeLightDark, key: "theme.auto" },
  { value: "light", icon: mdiWeatherSunny, key: "theme.light" },
  { value: "dark", icon: mdiWeatherNight, key: "theme.dark" },
];
// the picker lays swatches out by column: one colour per column is one row
const swatches = presetSeeds.map((p) => [p.seed]);
const seed = computed({
  get: () => store.themeSeed,
  set: (v: string) => store.setThemeSeed(v),
});
</script>

<template>
  <v-card-text class="pb-2">
    <p class="md3-label-large text-on-surface-variant mb-2">
      {{ t("theme.appearance") }}
    </p>
    <v-btn-toggle
      :model-value="store.themePreference"
      mandatory
      divided
      variant="outlined"
      rounded="xl"
      density="comfortable"
      selected-class="bg-secondary-container text-on-secondary-container"
      class="w-100"
      @update:model-value="(v: ThemePreference) => store.setTheme(v)"
    >
      <v-btn
        v-for="m in modes"
        :key="m.value"
        :value="m.value"
        :prepend-icon="m.icon"
        class="flex-grow-1 text-none"
      >
        {{ t(m.key) }}
      </v-btn>
    </v-btn-toggle>
    <p class="md3-label-large text-on-surface-variant mt-5 mb-1">
      {{ t("theme.color") }}
    </p>
    <v-color-picker
      v-model="seed"
      mode="hex"
      :swatches="swatches"
      show-swatches
      hide-canvas
      hide-sliders
      hide-inputs
      swatches-max-height="72"
      elevation="0"
      class="bg-transparent swatches"
      width="100%"
    />
  </v-card-text>
</template>

<style scoped>
.swatches :deep(.v-color-picker-swatches__color) {
  width: 32px;
  height: 32px;
  max-height: 32px;
  border-radius: 50%;
  margin: 4px;
}
.swatches :deep(.v-color-picker-swatches > div) {
  padding: 4px 0;
}
</style>
