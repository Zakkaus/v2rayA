import { createI18n } from "vue-i18n";
import messages from "../locales";

// Ready translated locale messages

// Create i18n instance with options
let locale = "en";
let _lang = typeof localStorage === "undefined" ? "" : localStorage["_lang"];
if (_lang && _lang in messages) {
  locale = _lang;
} else {
  for (let l of window.navigator.languages) {
    l = l.split("-")[0];
    if (l in messages) {
      locale = l;
      break;
    }
  }
}

// Composition mode: components use $t through the global injection, and
// scripts use i18n.global. Plurals are t(key, n); $tc is gone.
const i18n = createI18n({
  locale,
  messages,
  fallbackLocale: "en",
  legacy: false,
});
document.documentElement.lang = locale;

export default i18n;
