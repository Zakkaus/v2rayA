<script setup lang="ts">
// The about card: what v2rayA is, the ports it uses, where to report.
// The port numbers are the product's, the texts the locale's.
import { useI18n } from "vue-i18n";
import { mdiGithub } from "@mdi/js";

defineEmits<{ close: [] }>();
defineOptions({ name: "AboutDialog" });
const { t } = useI18n();

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
  <v-card class="about">
    <v-card-item class="px-6 pt-6">
      <v-card-title class="md3-headline-small pa-0"
        >mzz2017 / v2rayA</v-card-title
      >
    </v-card-item>
    <v-card-text class="px-6 md3-body-medium">
      <p>{{ t("about.intro") }}</p>
      <p class="md3-label-large mt-4 mb-1">{{ t("about.defaultPorts") }}</p>
      <dl class="about__ports">
        <template v-for="p in ports" :key="p.port">
          <dt dir="ltr">{{ p.port }}</dt>
          <dd>{{ t(`about.ports.${p.use}`) }}</dd>
        </template>
      </dl>
      <p class="md3-label-large mt-3 mb-1">{{ t("about.otherPorts") }}</p>
      <dl class="about__ports">
        <template v-for="p in otherPorts" :key="p.port">
          <dt dir="ltr">{{ p.port }}</dt>
          <dd>{{ t(`about.ports.${p.use}`) }}</dd>
        </template>
      </dl>
      <p class="mt-4">{{ t("about.local") }}</p>
      <p class="mt-2">
        <i18n-t keypath="about.report" tag="span" scope="global">
          <template #discussions>
            <a :href="`${repo}/discussions`" target="_blank" rel="noreferrer">{{
              t("about.discussions")
            }}</a>
          </template>
        </i18n-t>
      </p>
      <p class="mt-2">
        {{ t("about.docs") }}
        <a href="https://v2raya.org" target="_blank" rel="noreferrer" dir="ltr"
          >https://v2raya.org</a
        >
      </p>
    </v-card-text>
    <v-card-actions class="px-6 pb-4">
      <v-btn
        variant="text"
        :href="repo"
        target="_blank"
        rel="noreferrer"
        :prepend-icon="mdiGithub"
        >GitHub</v-btn
      >
      <v-spacer />
      <v-btn color="primary" @click="$emit('close')">{{
        t("operations.confirm")
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.about__ports {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 16px;
  row-gap: 2px;
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
