<script setup lang="ts">
// The navigation bar for compact windows (Material 3: 80 dp at the
// bottom on surface-container, one item per destination with the 64×32
// indicator pill behind the active icon and the label under it).
import { useI18n } from "vue-i18n";
import { destinations } from "./destinations";
import { useAppStore } from "@/stores/app";

const { t } = useI18n();
const store = useAppStore();
</script>

<template>
  <v-bottom-navigation
    :height="80"
    bg-color="surface-container"
    class="bar"
    tag="nav"
  >
    <button
      v-for="d in destinations"
      :key="d.view"
      type="button"
      class="bar__item"
      :class="{ 'bar__item--active': store.view === d.view }"
      :aria-current="store.view === d.view ? 'page' : undefined"
      @click="store.view = d.view"
    >
      <span class="bar__indicator">
        <v-icon
          :icon="store.view === d.view ? d.activeIcon : d.icon"
          size="24"
        />
      </span>
      <span class="md3-label-medium">{{ t(d.label) }}</span>
    </button>
  </v-bottom-navigation>
</template>

<style scoped>
.bar :deep(.v-bottom-navigation__content) {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 12px 0 16px;
}
.bar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
}
.bar__item--active {
  color: rgb(var(--v-theme-on-surface));
}
.bar__indicator {
  width: 64px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}
.bar__item:hover .bar__indicator {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.bar__item--active .bar__indicator {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}
.bar__item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
  border-radius: 8px;
}
</style>
