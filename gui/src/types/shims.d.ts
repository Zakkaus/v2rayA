// Loose types for the JavaScript modules the redo still shares with the
// old components. They go when their last consumer is rewritten.
declare module "js-base64" {
  export const Base64: {
    encode(s: string, urlsafe?: boolean): string;
    encodeURI(s: string): string;
    decode(s: string): string;
  };
}

declare module "@/assets/js/utils" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parseURL(u: string): any;
  export function generateURL(parts: {
    username?: string;
    password?: string;
    protocol?: string;
    host?: string;
    port?: number | string;
    params?: Record<string, unknown>;
    hash?: string;
    path?: string;
  }): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function handleResponse(
    res: any,
    that: any,
    suc?: any,
    err?: any,
    fail?: any,
  ): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function backendMessage(vm: any, res: any): string;
  export function escapeHtml(text: string): string;
  export function toInt(s: unknown): number;
  export function sanitizeALPN(alpn: string): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function locateServer(touch: any, which: any): any;
}

// qrcode ships no types; the two calls the sharing dialog makes.
declare module "qrcode" {
  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options: { errorCorrectionLevel?: string; width?: number },
      callback: (error: Error | null | undefined) => void,
    ): void;
  };
  export default QRCode;
}

// @nuintun/qrcode has types its package exports do not expose.
declare module "@nuintun/qrcode" {
  export class Decoder {
    scan(dataUrl: string): Promise<{ data: string }>;
  }
}
