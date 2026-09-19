// The choice lists two pages share: the transparent proxy mode and the
// rule port's splitting mode, as Vuetify select items.
export type T = (key: string) => string;

export const transparentModes = (t: T) => {
  const on = (label: string) => `${t("setting.options.on")}: ${label}`;
  return [
    { value: "close", title: t("setting.options.off") },
    { value: "proxy", title: on(t("setting.options.global")) },
    { value: "whitelist", title: on(t("setting.options.whitelistCn")) },
    { value: "gfwlist", title: on(t("setting.options.gfwlist")) },
    { value: "pac", title: on(t("setting.options.sameAsPacMode")) },
  ];
};

export const pacModes = (t: T) => [
  { value: "whitelist", title: t("setting.options.whitelistCn") },
  { value: "gfwlist", title: t("setting.options.gfwlist") },
  { value: "routingA", title: "RoutingA" },
];
