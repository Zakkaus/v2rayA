<script setup lang="ts">
// The navigation rail (Material 3: 80 dp wide at the start edge, the
// brand at the top, one item per destination with the 56×32 indicator
// pill behind the active icon and the label under it). Shown from
// 600 dp up; the bottom bar takes over below. Standing in for the
// collapsed drawer it also carries the core's state and the menus.
import { useI18n } from "vue-i18n";
import { mdiMenu } from "@mdi/js";
import { destinations } from "./destinations";
import ShellMenus from "./ShellMenus.vue";
import { useAppStore } from "@/stores/app";
import logo from "@/assets/img/v2raya-icon.svg";

/** collapsible: the rail stands in for the drawer and offers the way back */
defineProps<{ collapsible?: boolean }>();
const { t } = useI18n();
const store = useAppStore();
</script>

<template>
  <v-navigation-drawer permanent :width="80" color="surface" class="rail">
    <v-btn
      v-if="collapsible"
      :icon="mdiMenu"
      variant="text"
      :aria-label="t('common.menu')"
      @click="store.setNavCollapsed(false)"
    />
    <div class="rail__brand">
      <img :src="logo" alt="v2rayA" class="rail__logo" />
    </div>
    <nav class="rail__items" :aria-label="t('common.menu')">
      <button
        v-for="d in destinations"
        :key="d.view"
        type="button"
        class="rail__item"
        :class="{ 'rail__item--active': store.view === d.view }"
        :aria-current="store.view === d.view ? 'page' : undefined"
        @click="store.view = d.view"
      >
        <span class="rail__indicator">
          <v-icon
            :icon="store.view === d.view ? d.activeIcon : d.icon"
            size="24"
          />
        </span>
        <span class="md3-label-medium">{{ t(d.label) }}</span>
      </button>
    </nav>
    <template v-if="collapsible">
      <v-divider class="my-3 rail__divider" />
      <div class="rail__extras">
        <slot name="core" />
      </div>
    </template>
    <template v-if="collapsible" #append>
      <div class="rail__menus">
        <ShellMenus variant="icons" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.rail :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
}
.rail__brand {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.rail__logo {
  width: 40px;
  height: 40px;
}
.rail__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rail__item {
  width: 80px;
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
.rail__item--active {
  color: rgb(var(--v-theme-on-surface));
}
.rail__indicator {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}
.rail__item:hover .rail__indicator {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.rail__item--active .rail__indicator {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}
.rail__divider {
  width: 48px;
  flex: none;
}
.rail__extras,
.rail__menus {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.rail__menus {
  padding: 12px 0 16px;
}
.rail__item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 8px;
}
</style>
