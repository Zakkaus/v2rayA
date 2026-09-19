// One function per backend operation (method + path), 41 in all, named
// <method><Path>. Bodies and queries are what the old components sent, so
// the recorded requests match byte for byte; types narrow them where the
// backend's Go types are known (types.ts) and stay open elsewhere.
import { call, timeouts } from "./client";
import type {
  CustomInbound,
  Ports,
  Setting,
  SettingResponse,
  TouchResponse,
  VersionResponse,
  Which,
} from "./types";

// ---- account and session ----------------------------------------------
export const getAccount = () =>
  call<unknown>({ url: "account", method: "get" });
export const postAccount = (body: { username: string; password: string }) =>
  call<{ token: string }>({ url: "account", method: "post", data: body });
export const postLogin = (body: { username: string; password: string }) =>
  call<{ token: string }>({ url: "login", method: "post", data: body });
export const getVersion = () =>
  call<VersionResponse>({ url: "version", method: "get" });

// ---- nodes and subscriptions ---------------------------------------------
export const getTouch = () =>
  call<TouchResponse>({ url: "touch", method: "get" });
export const deleteTouch = (touches: Which[]) =>
  call<TouchResponse>({ url: "touch", method: "delete", data: { touches } });
export const postImport = (body: {
  url: string;
  kind?: string;
  which?: Which;
}) =>
  call<TouchResponse>({
    url: "import",
    method: "post",
    data: body,
    timeout: timeouts.import,
  });
export const getSharingAddress = (touch: Which) =>
  call<{ sharingAddress: string }>({
    url: "sharingAddress",
    method: "get",
    params: { touch },
  });
export const putSubscription = (which: Which) =>
  call<TouchResponse>({ url: "subscription", method: "put", data: { which } });
export const patchSubscription = (body: Record<string, unknown>) =>
  call<TouchResponse>({ url: "subscription", method: "patch", data: body });
export const getPingLatency = (whiches: Which[]) =>
  call<{ whiches: Which[] }>({
    url: "pingLatency",
    method: "get",
    params: { whiches },
    timeout: timeouts.none,
  });
export const getHttpLatency = (whiches: Which[]) =>
  call<{ whiches: Which[] }>({
    url: "httpLatency",
    method: "get",
    params: { whiches },
    timeout: timeouts.none,
  });

// ---- connections and the core ---------------------------------------------
export const postConnection = (which: Which) =>
  call<TouchResponse>({ url: "connection", method: "post", data: which });
export const deleteConnection = (which: Which) =>
  call<TouchResponse>({ url: "connection", method: "delete", data: which });
export const putOutboundConnections = (body: {
  outbound: string;
  touches: Which[];
}) =>
  call<TouchResponse>({
    url: "outboundConnections",
    method: "put",
    data: body,
  });
export const postV2ray = () =>
  call<TouchResponse>({ url: "v2ray", method: "post" });
export const deleteV2ray = () =>
  call<TouchResponse>({ url: "v2ray", method: "delete" });

// ---- outbound groups ---------------------------------------------------------
export const getOutbounds = () =>
  call<{ outbounds: string[] }>({ url: "outbounds", method: "get" });
export const getOutbound = (outbound: string) =>
  call<unknown>({ url: "outbound", method: "get", params: { outbound } });
export const postOutbound = (body: Record<string, unknown>) =>
  call<unknown>({ url: "outbound", method: "post", data: body });
export const putOutbound = (body: Record<string, unknown>) =>
  call<unknown>({ url: "outbound", method: "put", data: body });
export const deleteOutbound = (body: Record<string, unknown>) =>
  call<unknown>({ url: "outbound", method: "delete", data: body });

// ---- settings ------------------------------------------------------------------
export const getSetting = () =>
  call<SettingResponse>({ url: "setting", method: "get" });
export const putSetting = (setting: Setting) =>
  call<unknown>({ url: "setting", method: "put", data: setting });
export const getPorts = () => call<Ports>({ url: "ports", method: "get" });
export const putPorts = (ports: Ports) =>
  call<unknown>({ url: "ports", method: "put", data: ports });
export const getCustomInbound = () =>
  call<{ inbounds: CustomInbound[] }>({ url: "customInbound", method: "get" });
export const postCustomInbound = (body: CustomInbound) =>
  call<unknown>({ url: "customInbound", method: "post", data: body });
export const deleteCustomInbound = (body: { tag: string }) =>
  call<unknown>({ url: "customInbound", method: "delete", data: body });
export const getRoutingA = () =>
  call<{ routingA: string }>({ url: "routingA", method: "get" });
export const putRoutingA = (body: { routingA: string }) =>
  call<unknown>({ url: "routingA", method: "put", data: body });
export const getDnsRules = () =>
  call<unknown>({ url: "dnsRules", method: "get" });
export const putDnsRules = (body: unknown) =>
  call<unknown>({ url: "dnsRules", method: "put", data: body });
export const getDomainsExcluded = () =>
  call<unknown>({ url: "domainsExcluded", method: "get" });
export const putDomainsExcluded = (body: unknown) =>
  call<unknown>({ url: "domainsExcluded", method: "put", data: body });
export const getTproxyWhiteIpGroups = () =>
  call<unknown>({ url: "tproxyWhiteIpGroups", method: "get" });
export const putTproxyWhiteIpGroups = (body: unknown) =>
  call<unknown>({ url: "tproxyWhiteIpGroups", method: "put", data: body });
export const getRemoteGFWListVersion = () =>
  call<{ remoteGFWListVersion: string }>({
    url: "remoteGFWListVersion",
    method: "get",
  });
export const putGfwList = () =>
  call<{ localGFWListVersion: string }>({
    url: "gfwList",
    method: "put",
    timeout: timeouts.none,
  });
export const deleteGfwList = () =>
  call<unknown>({ url: "gfwList", method: "delete" });

// ---- logs ------------------------------------------------------------------------
export const getLogger = (params: { skip: number }) =>
  call<string>({ url: "logger", method: "get", params });
