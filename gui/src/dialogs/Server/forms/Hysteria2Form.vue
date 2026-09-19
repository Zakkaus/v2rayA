<script setup lang="ts">
// The hysteria2 tab of the node editor. Contract: the model comes in by
// v-model and is edited in place; `readonly` shows a subscription node's
// values without editing; fields hidden by their conditions are not
// validated. Replace this placeholder with the form.
import type { Hysteria2Model } from "../models";
import PendingForm from "../PendingForm.vue";

defineModel<Hysteria2Model>({ required: true });
defineProps<{ readonly?: boolean }>();
</script>

<template>
  <PendingForm protocol="hysteria2" />
</template>
