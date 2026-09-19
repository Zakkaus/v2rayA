// The four destinations the rail (≥ 600 dp) and the bottom bar (compact)
// offer; the app bar titles the current one.
import {
  mdiCogOutline,
  mdiCog,
  mdiInformationOutline,
  mdiInformation,
  mdiLanConnect,
  mdiScriptTextOutline,
  mdiScriptText,
} from "@mdi/js";
import type { View } from "@/stores/app";

export interface Destination {
  view: View;
  /** locale key of the label and the page title */
  label: string;
  icon: string;
  /** the filled variant, shown when active */
  activeIcon: string;
}

export const destinations: Destination[] = [
  {
    view: "nodes",
    label: "common.nodes",
    icon: mdiLanConnect,
    activeIcon: mdiLanConnect,
  },
  {
    view: "settings",
    label: "common.setting",
    icon: mdiCogOutline,
    activeIcon: mdiCog,
  },
  {
    view: "logs",
    label: "common.log",
    icon: mdiScriptTextOutline,
    activeIcon: mdiScriptText,
  },
  {
    view: "about",
    label: "common.about",
    icon: mdiInformationOutline,
    activeIcon: mdiInformation,
  },
];
