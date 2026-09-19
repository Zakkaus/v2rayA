<script setup lang="ts">
// The anytls tab of the node editor. Contract: the model comes in by
// v-model and is edited in place; `readonly` shows a subscription node's
// values without editing; fields hidden by their conditions are not
// validated. Replace this placeholder with the form.
import type { AnytlsModel } from "../models";
import PendingForm from "../PendingForm.vue";

defineModel<AnytlsModel>({ required: true });
defineProps<{ readonly?: boolean }>();
</script>

<template>
  <PendingForm protocol="anytls" />
</template>
