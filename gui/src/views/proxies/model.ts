import { computed, ref, watch } from "vue";
import type { Touch, Which } from "@/api/types";
import { useAppStore } from "@/stores/app";
import { filterRows, locate, useNodes, type Row } from "../nodes/model";

export function groupMembers(
  touch: Touch,
  connected: Which[],
  group: string,
): Row[] {
  return connected
    .filter((which) => (which.outbound ?? "proxy") === group)
    .map((which) => locate(touch, which))
    .filter((row): row is Row => row !== null);
}

export function useProxies() {
  const store = useAppStore();
  const nodes = useNodes();
  const query = ref("");
  const view = ref(
    localStorage.getItem("proxiesView") === "list" ? "list" : "cards",
  );
  const pending = ref<string | null>(null);
  const tested = ref(new Set<string>());
  const manualGroup = ref<string | null>(null);
  const loadError = ref<unknown>(null);
  const loading = ref(true);

  watch(view, (value) => localStorage.setItem("proxiesView", value));
  const groups = computed(() =>
    store.outbounds.map((name) => {
      const members = groupMembers(
        nodes.touch.value,
        store.connectedServer,
        name,
      );
      return { name, members, visible: filterRows(members, query.value) };
    }),
  );
  const sources = computed(() => [
    {
      key: "servers",
      name: "",
      rows: filterRows(nodes.touch.value.servers, query.value),
    },
    ...nodes.touch.value.subscriptions.map((subscription, index) => ({
      key: `sub-${index}`,
      name: subscription.remarks || subscription.host,
      rows: filterRows(subscription.servers, query.value),
    })),
  ]);
  const manualRows = computed(() =>
    filterRows(
      [
        ...nodes.touch.value.servers,
        ...nodes.touch.value.subscriptions.flatMap(
          (subscription) => subscription.servers,
        ),
      ],
      query.value,
    ),
  );

  async function sync() {
    loadError.value = null;
    loading.value = true;
    try {
      await nodes.sync();
    } catch (err) {
      loadError.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function testGroup(group: string, testingText: string) {
    pending.value = group;
    tested.value.delete(group);
    try {
      await nodes.testAll(
        groupMembers(nodes.touch.value, store.connectedServer, group),
        false,
        testingText,
      );
      tested.value.add(group);
    } finally {
      pending.value = null;
    }
  }

  async function connectGroup(group: string) {
    pending.value = group;
    try {
      await nodes.connectFastest(
        groupMembers(nodes.touch.value, store.connectedServer, group),
        group,
      );
    } finally {
      pending.value = null;
    }
  }

  async function toggleGroup(row: Row, group: string) {
    pending.value = group;
    try {
      await nodes.toggleGroup(row, group);
      tested.value.delete(group);
    } finally {
      pending.value = null;
    }
  }

  return {
    store,
    nodes,
    query,
    view,
    groups,
    sources,
    manualGroup,
    manualRows,
    pending,
    tested,
    loading,
    loadError,
    sync,
    testGroup,
    connectGroup,
    toggleGroup,
  };
}
