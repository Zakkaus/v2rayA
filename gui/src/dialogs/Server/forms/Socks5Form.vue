<script setup lang="ts">
// The socks5 tab of the node editor. Contract: the model comes in by
// v-model and is edited in place; `readonly` shows a subscription node's
// values without editing; fields hidden by their conditions are not
// validated. Replace this placeholder with the form.
import type { Socks5Model } from "../models";
import PendingForm from "../PendingForm.vue";

defineModel<Socks5Model>({ required: true });
defineProps<{ readonly?: boolean }>();
</script>

<template>
  <PendingForm protocol="socks5" />
</template>
