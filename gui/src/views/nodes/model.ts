// The node page's state and operations, without the view: the touch
// (servers, subscriptions, what is connected), the tab, the selection,
// and every request the page makes. NodesView renders it; the spec
// drives it.
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import {
  deleteConnection,
  deleteTouch,
  getHttpLatency,
  getPingLatency,
  getSharingAddress,
  getTouch,
  postConnection,
  putOutboundConnections,
  putSubscription,
} from "@/api";
import { watchConnected } from "@/api/connect";
import type {
  OutboundStatus,
  Touch,
  TouchResponse,
  TouchServer,
  TouchSubscription,
  Which,
} from "@/api/types";
import { openLoading } from "@/composables/useLoading";
import { useAppStore, type Running } from "@/stores/app";

export type Row = TouchServer;
/** what a table row may be: a server, a subscription's server, or a subscription */
export type Selectable = TouchServer | TouchSubscription;
/** the tab: the subscription list, the servers, or one subscription's servers */
export type Tab = "subscriptions" | "servers" | `sub-${number}`;

export function runningOf(running: boolean, networkPaused: boolean): Running {
  if (networkPaused) return "paused";
  return running ? "running" : "stopped";
}

/** whichOf addresses a row the way the backend does. */
export function whichOf(row: Selectable): Which {
  return row._type === "subscriptionServer"
    ? { _type: row._type, id: row.id, sub: (row as Row).sub }
    : { _type: row._type, id: row.id };
}

export function sameWhich(a: Which, b: Which): boolean {
  return (
    a._type === b._type &&
    a.id === b.id &&
    (a._type !== "subscriptionServer" || a.sub === b.sub)
  );
}

/** rowKey identifies a row across refreshes: a subscription update reorders nodes and reuses ids, so the key is what the row points at. */
export function rowKey(row: Selectable): string {
  if (row._type === "subscription")
    return `subscription|${row.id}|${row.address}`;
  const r = row as Row;
  return `${r._type}|${r.sub ?? -1}|${r.address}|${r.name}|${r.net}`;
}

const latencyOf = (row: Row) => parseInt(row.pingLatency);

/** compareLatency sorts numbers ascending and puts untested rows last, whatever the direction. */
export function compareLatency(a: Row, b: Row, asc = true): number {
  const x = latencyOf(a);
  const y = latencyOf(b);
  if (isNaN(x)) return 1;
  if (isNaN(y)) return -1;
  return asc ? x - y : y - x;
}

/** compareConnection puts connected rows first, then by latency. */
export function compareConnection(a: Row, b: Row, asc = true): number {
  if (a.connected && !b.connected) return -1;
  if (!a.connected && b.connected) return 1;
  return compareLatency(a, b, asc);
}

export function filterRows(rows: Row[], query: string): Row[] {
  if (!query) return rows;
  const search = query.toLowerCase();
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(search) ||
      row.address.toLowerCase().includes(search) ||
      row.net.toLowerCase().includes(search),
  );
}

export function useNodes() {
  const store = useAppStore();
  const touch = ref<Touch>({
    servers: [],
    subscriptions: [],
    connectedServer: [],
  });
  const ready = ref(false);
  const selected = ref<Selectable[]>([]);
  const tab = ref<Tab>(storedTab());

  watch(tab, (t) => {
    localStorage.setItem("lastNodeTab", t);
    selected.value = [];
  });

  const isEmpty = computed(
    () =>
      ready.value &&
      !touch.value.servers.length &&
      !touch.value.subscriptions.length,
  );
  const connected = computed<Which[]>(() => touch.value.connectedServer ?? []);
  /** the rows connected in the current outbound */
  const connectedRows = computed(() =>
    connected.value
      .filter((w) => (w.outbound ?? "proxy") === store.outboundName)
      .map((w) => ({ which: w, row: locate(touch.value, w) }))
      .filter((x): x is { which: Which; row: Row } => x.row !== null),
  );
  const observatory = computed<OutboundStatus[]>(() => {
    const frame = store.observatory as {
      body?: { outboundStatus?: OutboundStatus[] };
    } | null;
    return frame?.body?.outboundStatus ?? [];
  });
  /** the tabs holding a connected node of the current outbound */
  const connectedTabs = computed(() => {
    const tabs = new Set<Tab>();
    for (const { which } of connectedRows.value)
      tabs.add(which._type === "server" ? "servers" : `sub-${which.sub ?? 0}`);
    return tabs;
  });
  const canDelete = computed(
    () =>
      selected.value.length > 0 &&
      selected.value.every((r) => r._type !== "subscriptionServer"),
  );
  const canTest = computed(
    () =>
      selected.value.length > 0 &&
      selected.value.some((r) => r._type !== "subscription"),
  );

  function apply(res: TouchResponse) {
    const next = res.touch;
    next.subscriptions.forEach((s, i) => {
      s.status = dayjs(s.status)
        .tz(dayjs.tz.guess())
        .format("YYYY-MM-DD HH:mm:ss");
      s.servers.forEach((v) => {
        v.sub = i;
        v.connected = false;
      });
    });
    next.servers.forEach((v) => (v.connected = false));
    for (const w of next.connectedServer ?? []) {
      if ((w.outbound ?? "proxy") !== store.outboundName) continue;
      const row = locate(next, w);
      if (row) row.connected = true;
    }
    // keep the selection on the rows that replace the selected ones
    const keys = selected.value.map(rowKey);
    const byKey = new Map<string, Selectable>();
    for (const row of [
      ...next.servers,
      ...next.subscriptions,
      ...next.subscriptions.flatMap((s) => s.servers),
    ]) {
      const k = rowKey(row);
      if (!byKey.has(k)) byKey.set(k, row);
    }
    touch.value = next;
    selected.value = keys
      .map((k) => byKey.get(k))
      .filter((r): r is Selectable => !!r);
    store.setRunning(
      runningOf(res.running, !!res.networkPaused),
      !!res.networkPaused,
    );
    store.connectedServer = next.connectedServer ?? [];
  }

  // the connected marks depend on the outbound in view
  watch(
    () => store.outboundName,
    () => {
      for (const row of allRows()) row.connected = false;
      for (const { row } of connectedRows.value) row.connected = true;
    },
  );

  function allRows(): Row[] {
    return [
      ...touch.value.servers,
      ...touch.value.subscriptions.flatMap((s) => s.servers),
    ];
  }

  /** sync reloads the touch; the socket's open and every mutation call it. */
  async function sync(): Promise<void> {
    apply(await getTouch());
    ready.value = true;
  }

  /** load is the first sync, with retries while the backend comes up. */
  async function load(retries = 3): Promise<void> {
    try {
      await sync();
      if (!connectedTabs.value.has(tab.value) && connectedTabs.value.size)
        tab.value = [...connectedTabs.value][0];
    } catch {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return load(retries - 1);
      }
      ready.value = true;
    }
  }

  async function connect(
    row: Row,
    outbound = store.outboundName,
  ): Promise<void> {
    const loading = openLoading();
    const control = new AbortController();
    try {
      const res = await watchConnected(
        postConnection(
          { ...whichOf(row), outbound },
          { signal: control.signal },
        ),
        () => control.abort(),
      );
      if (res) apply(res);
      else await sync();
    } finally {
      loading.close();
    }
  }

  async function disconnect(
    row: Row,
    outbound = store.outboundName,
  ): Promise<void> {
    apply(await deleteConnection({ ...whichOf(row), outbound }));
  }

  function inGroup(row: Row, group: string): boolean {
    const w = whichOf(row);
    return connected.value.some(
      (c) => (c.outbound ?? "proxy") === group && sameWhich(c, w),
    );
  }

  /** toggleGroup adds the row to the group's members, or removes it. */
  async function toggleGroup(row: Row, group: string): Promise<void> {
    const w = whichOf(row);
    const members = connected.value
      .filter((c) => (c.outbound ?? "proxy") === group)
      .map((c) => ({
        id: c.id,
        _type: c._type,
        sub: c._type === "subscriptionServer" ? c.sub : 0,
        outbound: group,
      }));
    const next = inGroup(row, group)
      ? members.filter((m) => !sameWhich(m, w))
      : members.concat([
          { id: w.id, _type: w._type, sub: w.sub ?? 0, outbound: group },
        ]);
    const loading = openLoading();
    try {
      apply(await putOutboundConnections({ outbound: group, touches: next }));
    } finally {
      loading.close();
    }
  }

  async function connectFastest(
    rows: Row[],
    group: string,
  ): Promise<Row | null> {
    let fastest: Row | null = null;
    let lowest = Infinity;
    for (const row of rows) {
      const latency = latencyOf(row);
      if (latency < lowest) {
        fastest = row;
        lowest = latency;
      }
    }
    if (!fastest) return null;
    const loading = openLoading();
    try {
      apply(
        await putOutboundConnections({
          outbound: group,
          touches: [whichOf(fastest)],
        }),
      );
      return fastest;
    } finally {
      loading.close();
    }
  }

  /** testLatency measures the selected rows by TCP ping or an HTTP request; rows show "testing" meanwhile. */
  async function testLatency(
    http: boolean,
    testingText: string,
  ): Promise<void> {
    return testAll(
      selected.value.filter((r): r is Row => r._type !== "subscription"),
      http,
      testingText,
    );
  }

  async function testAll(
    rows: Row[],
    http: boolean,
    testingText: string,
  ): Promise<void> {
    const whiches = rows.map(
      (r) => ({ ...whichOf(r), sub: r.sub ?? null }) as Which,
    );
    rows.forEach((r) => (r.pingLatency = testingText));
    try {
      const res = await (http
        ? getHttpLatency(whiches)
        : getPingLatency(whiches));
      for (const w of res.whiches) {
        const row = locate(touch.value, w);
        if (row) row.pingLatency = w.pingLatency ?? "";
      }
    } catch (err) {
      rows.forEach((r) => (r.pingLatency = ""));
      throw err;
    }
  }

  async function deleteSelected(): Promise<void> {
    await deleteTouch(
      selected.value.map((r) => ({ id: r.id, _type: r._type })),
    );
    selected.value = [];
    await sync();
  }

  /** sharingLinks collects the share link of every selected row; a row without one is skipped. */
  async function sharingLinks(): Promise<string[]> {
    const links = await Promise.all(
      selected.value.map((r) =>
        getSharingAddress(whichOf(r)).then((x) => x.sharingAddress),
      ),
    );
    return links.filter((l) => !!l);
  }

  async function updateSubscription(s: TouchSubscription): Promise<void> {
    apply(await putSubscription({ id: s.id, _type: s._type }));
  }

  /** statusOf is what the observatory last saw of a connected node, if anything. */
  function statusOf(which: Which): OutboundStatus | undefined {
    return observatory.value.find((o) => sameWhich(o.which, which));
  }

  return {
    touch,
    ready,
    selected,
    tab,
    isEmpty,
    connectedRows,
    connectedTabs,
    canDelete,
    canTest,
    load,
    sync,
    connect,
    disconnect,
    inGroup,
    toggleGroup,
    connectFastest,
    testAll,
    testLatency,
    deleteSelected,
    sharingLinks,
    updateSubscription,
    statusOf,
    apply,
  };
}

/** locate finds the row a Which points at. */
export function locate(touch: Touch, which: Which): Row | null {
  if (which._type === "server") return touch.servers[which.id - 1] ?? null;
  if (which._type === "subscriptionServer")
    return touch.subscriptions[which.sub ?? -1]?.servers[which.id - 1] ?? null;
  return null;
}

function storedTab(): Tab {
  const t = localStorage.getItem("lastNodeTab") ?? "";
  if (t === "subscriptions" || t === "servers" || /^sub-\d+$/.test(t))
    return t as Tab;
  return "subscriptions";
}
