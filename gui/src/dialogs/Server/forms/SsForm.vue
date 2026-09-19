<script setup lang="ts">
// The ss tab of the node editor. Contract: the model comes in by
// v-model and is edited in place; `readonly` shows a subscription node's
// values without editing; fields hidden by their conditions are not
// validated. Replace this placeholder with the form.
import type { SsModel } from "../models";
import PendingForm from "../PendingForm.vue";

defineModel<SsModel>({ required: true });
defineProps<{ readonly?: boolean }>();
</script>

<template>
  <PendingForm protocol="ss" />
</template>
