<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { Which } from "@/api/types";
import type { DashboardMember } from "./model";

defineOptions({ name: "DashboardNodeSelection" });
const props = defineProps<{
  members: DashboardMember[];
  select: (which: Which | null) => Promise<boolean>;
}>();
const emit = defineEmits<{ close: [selected?: boolean] }>();
const { t } = useI18n();
const saving = ref(false);
const selected = ref(
  props.members.find((member) => member.which.selected)?.key ?? "auto",
);

async function choose(key: string | null) {
  if (saving.value || key === null) return;
  const which =
    key === "auto"
      ? null
      : props.members.find((member) => member.key === key)?.which;
  if (which === undefined) return;
  saving.value = true;
  if (await props.select(which)) emit("close", true);
  else
    selected.value =
      props.members.find((member) => member.which.selected)?.key ?? "auto";
  saving.value = false;
}
</script>

<template>
  <v-card rounded="xl" :loading="saving">
    <v-card-title class="md3-headline-small px-6 pt-6">
      {{ t("dashboard.switchNode") }}
    </v-card-title>
    <v-card-text class="px-6">
      <v-radio-group
        v-model="selected"
        :disabled="saving"
        :aria-label="t('dashboard.switchNode')"
        hide-details
        @update:model-value="choose"
      >
        <v-list bg-color="transparent">
          <v-list-item class="px-0">
            <v-radio value="auto" :label="t('dashboard.autoFastest')" />
          </v-list-item>
          <v-list-item v-for="member in members" :key="member.key" class="px-0">
            <v-radio :value="member.key">
              <template #label>
                <div class="py-2">
                  <div class="md3-body-large selection-name" dir="auto">
                    {{ member.row.name || member.row.address }}
                  </div>
                  <div class="md3-body-small text-on-surface-variant" dir="ltr">
                    {{ member.row.net }} · {{ member.latency }}
                  </div>
                </div>
              </template>
            </v-radio>
          </v-list-item>
        </v-list>
      </v-radio-group>
    </v-card-text>
    <v-card-actions class="px-6 pb-4">
      <v-spacer />
      <v-btn variant="text" :disabled="saving" @click="emit('close')">{{
        t("operations.cancel")
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.selection-name {
  overflow-wrap: anywhere;
}
</style>
