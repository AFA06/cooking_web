/** Language model shared by the server and the browser. No server-only imports here. */

export const LOCALES = ["uz", "ru", "en", "kz"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "locale";

/** How each language names itself in the switcher, plus the codes browsers and Intl expect. */
export const LOCALE_INFO: Record<Locale, { label: string; short: string; html: string; intl: string; og: string }> = {
  uz: { label: "O‘zbekcha", short: "UZ", html: "uz", intl: "uz-UZ", og: "uz_UZ" },
  ru: { label: "Русский", short: "RU", html: "ru", intl: "ru-RU", og: "ru_RU" },
  en: { label: "English", short: "EN", html: "en", intl: "en-GB", og: "en_GB" },
  kz: { label: "Қазақша", short: "KZ", html: "kk", intl: "kk-KZ", og: "kk_KZ" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** A message is a string, or a set of plural forms keyed by Intl.PluralRules categories. */
export type Message = string | Partial<Record<"zero" | "one" | "two" | "few" | "many" | "other", string>>;
export interface Messages {
  [key: string]: Message | Messages;
}

export type Vars = Record<string, string | number>;
export type TFunction = (key: string, vars?: Vars) => string;

/** Overlays `over` on `base`; used so an incomplete translation falls back to Uzbek per key. */
export function mergeMessages(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = typeof v === "object" && typeof b === "object" && !("other" in v) ? mergeMessages(b as Messages, v as Messages) : v;
  }
  return out;
}

function lookup(messages: Messages, key: string): Message | undefined {
  let node: Message | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (node === undefined || typeof node === "string") return undefined;
    node = (node as Messages)[part];
  }
  return node as Message | undefined;
}

const isPluralForms = (m: Message): m is Exclude<Message, string> => typeof m === "object";

/** Builds a translator for one language. Falls back to the default language, then to the key itself. */
export function createT(locale: Locale, messages: Messages, fallback?: Messages): TFunction {
  const rules = new Intl.PluralRules(LOCALE_INFO[locale].intl);
  return (key, vars) => {
    const found = lookup(messages, key) ?? (fallback ? lookup(fallback, key) : undefined);
    if (found === undefined) return key;
    let text: string | undefined;
    if (isPluralForms(found)) {
      const count = typeof vars?.count === "number" ? vars.count : Number(vars?.count ?? 0);
      text = found[rules.select(count)] ?? found.other ?? Object.values(found)[0];
    } else {
      text = found;
    }
    if (text === undefined) return key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
  };
}
