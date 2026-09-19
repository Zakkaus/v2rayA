// Shapes the backend sends and accepts, named after the Go types they come
// from (service/kernel/touch, service/db/configure). Fields the redo does
// not read are left out on purpose; a widening is a one-line change here.

export type TouchType = "server" | "subscription" | "subscriptionServer";

/** configure.Which — how the backend addresses one node or subscription. */
export interface Which {
  _type: TouchType;
  id: number;
  /** subscription index, only for subscriptionServer */
  sub?: number;
  pingLatency?: string;
  Link?: string;
  outbound?: string;
}

/** touch.Server */
export interface TouchServer {
  id: number;
  _type: TouchType;
  name: string;
  address: string;
  net: string;
  pingLatency: string;
}

/** touch.Subscription */
export interface TouchSubscription {
  id: number;
  _type: TouchType;
  remarks?: string;
  host: string;
  address: string;
  status: string;
  info: string;
  servers: TouchServer[];
  autoSelect: boolean;
}

/** touch.Touch */
export interface Touch {
  servers: TouchServer[];
  subscriptions: TouchSubscription[];
  connectedServer: Which[] | null;
}

/** GET /touch */
export interface TouchResponse {
  running: boolean;
  networkPaused: boolean;
  touch: Touch;
}

/** GET /version */
export interface VersionResponse {
  version: string;
  foundNew: boolean;
  remoteVersion: string;
  serviceValid: boolean;
  v5: boolean;
  lite: boolean;
  loadBalanceValid: boolean;
  variant: string;
  os: string;
  isRoot: boolean;
  tunSupported: boolean;
  coreVersionValid: boolean;
  coreVersionErr: string;
  hasAccounts: boolean;
  lastKernelExit: unknown;
  docker?: boolean;
}

/** configure.Setting — kept as the backend's own keys; the settings dialog owns the full list. */
export type Setting = Record<string, unknown> & {
  transparent: string;
  transparentType: string;
  pacMode: string;
  logLevel: string;
};

/** GET /setting */
export interface SettingResponse {
  setting: Setting;
  localGFWListVersion: string;
}

/** configure.Ports */
export interface Ports {
  socks5: number;
  http: number;
  socks5WithPac: number;
  httpWithPac: number;
  vmess: number;
  api: { port: number; services: string[] };
}

/** configure.CustomInbound */
export interface CustomInbound {
  tag: string;
  protocol: "socks" | "http";
  port: number;
  outbound: string;
  outboundType: "direct" | "routingA" | string;
  routingARules: string;
  username: string;
  password: string;
}

/** The WebSocket frames on /api/message. */
export type WsMessage =
  | {
      type: "running_state";
      body: { running: boolean; networkPaused?: boolean };
    }
  | {
      type: "observatory";
      body: { outboundName: string } & Record<string, unknown>;
    }
  | { type: string; body?: unknown };
