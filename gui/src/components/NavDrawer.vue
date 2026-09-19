<script setup lang="ts">
// The standard navigation drawer for expanded windows (≥ 840 dp): the
// brand, the destinations, and the theme, language and account menus at
// the bottom. There is no top app bar at this width; the page titles
// itself, and the core's state lives on the dashboard.
import { useI18n } from "vue-i18n";
import { destinations } from "./destinations";
import ShellMenus from "./ShellMenus.vue";
import { useAppStore } from "@/stores/app";
import logo from "@/assets/img/v2raya-icon.svg";

const { t } = useI18n();
const store = useAppStore();
</script>

<template>
  <v-navigation-drawer permanent :width="256" color="surface" class="drawer">
    <div class="drawer__brand">
      <img :src="logo" alt="" class="drawer__logo" />
      <span class="md3-title-large">v2rayA</span>
    </div>
    <v-list nav density="default" class="px-3 pt-2 pb-0">
      <v-list-item
        v-for="d in destinations"
        :key="d.view"
        :active="store.view === d.view"
        :prepend-icon="store.view === d.view ? d.activeIcon : d.icon"
        :title="t(d.label)"
        rounded="xl"
        class="drawer__item"
        @click="store.view = d.view"
      />
    </v-list>
    <template #append>
      <v-divider class="mx-7" />
      <v-list nav density="default" class="px-3 py-2">
        <ShellMenus variant="list" />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.drawer__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 28px 20px;
}
.drawer__logo {
  width: 28px;
  height: 28px;
}
/* Material's drawer item: 56 dp tall, label-large */
.drawer :deep(.v-list-item) {
  min-height: 48px;
  padding-inline: 16px;
}
.drawer :deep(.v-list-item__spacer) {
  width: 16px;
}
.drawer :deep(.v-list-item-title) {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
}
.drawer :deep(.v-list-item__prepend > .v-icon) {
  opacity: 1;
}
/* the active destination: Material's secondary-container pill */
.drawer :deep(.v-list-item--active) {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}
.drawer :deep(.v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}
</style>
