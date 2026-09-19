<script setup lang="ts">
// The about page: what v2rayA is, the ports it uses, where to report.
// The port numbers are the product's, the texts the locale's.
import { useI18n } from "vue-i18n";
import { mdiForumOutline, mdiGithub, mdiOpenInNew } from "@mdi/js";
import { useAppStore } from "@/stores/app";

defineOptions({ name: "AboutView" });
const { t } = useI18n();
const store = useAppStore();

const ports = [
  { port: 2017, use: "service" },
  { port: 20170, use: "socks" },
  { port: 20171, use: "http" },
  { port: 20172, use: "httpRules" },
] as const;
const otherPorts = [{ port: 32345, use: "tproxy" }] as const;
const repo = "https://github.com/v2rayA/v2rayA";
</script>

<template>
  <div class="about">
    <v-sheet color="surface-container-low" rounded="xl" class="pa-6 pa-sm-8">
      <h1 class="md3-headline-medium mb-2">mzz2017 / v2rayA</h1>
      <p class="md3-body-large mb-1">{{ t("about.intro") }}</p>
      <p v-if="store.version" class="md3-body-medium text-on-surface-variant">
        {{ t("welcome.default", { version: store.version.version }) }}
      </p>
      <div class="d-flex flex-wrap ga-2 mt-6">
        <v-btn
          variant="tonal"
          :href="repo"
          target="_blank"
          rel="noreferrer"
          :prepend-icon="mdiGithub"
          >GitHub</v-btn
        >
        <v-btn
          variant="tonal"
          href="https://v2raya.org"
          target="_blank"
          rel="noreferrer"
          :prepend-icon="mdiOpenInNew"
          >{{ t("about.docs") }} v2raya.org</v-btn
        >
        <v-btn
          variant="tonal"
          :href="`${repo}/discussions`"
          target="_blank"
          rel="noreferrer"
          :prepend-icon="mdiForumOutline"
          >{{ t("about.discussions") }}</v-btn
        >
      </div>
    </v-sheet>

    <div class="about__grid mt-4">
      <v-sheet color="surface-container-low" rounded="xl" class="pa-6">
        <h2 class="md3-title-medium mb-3">{{ t("about.defaultPorts") }}</h2>
        <dl class="about__ports md3-body-medium">
          <template v-for="p in ports" :key="p.port">
            <dt dir="ltr">{{ p.port }}</dt>
            <dd>{{ t(`about.ports.${p.use}`) }}</dd>
          </template>
        </dl>
        <h2 class="md3-title-medium mt-5 mb-3">{{ t("about.otherPorts") }}</h2>
        <dl class="about__ports md3-body-medium">
          <template v-for="p in otherPorts" :key="p.port">
            <dt dir="ltr">{{ p.port }}</dt>
            <dd>{{ t(`about.ports.${p.use}`) }}</dd>
          </template>
        </dl>
      </v-sheet>
      <v-sheet
        color="surface-container-low"
        rounded="xl"
        class="pa-6 md3-body-medium"
      >
        <p>{{ t("about.local") }}</p>
        <p class="mt-3">
          <i18n-t keypath="about.report" tag="span" scope="global">
            <template #discussions>
              <a
                :href="`${repo}/discussions`"
                target="_blank"
                rel="noreferrer"
                >{{ t("about.discussions") }}</a
              >
            </template>
          </i18n-t>
        </p>
      </v-sheet>
    </div>
  </div>
</template>

<style scoped>
.about__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}
@media (min-width: 840px) {
  .about__grid {
    grid-template-columns: 1fr 1fr;
  }
}
.about__ports {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  row-gap: 4px;
  margin: 0;
}
.about__ports dt {
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface-variant));
}
.about__ports dd {
  margin: 0;
}
</style>
