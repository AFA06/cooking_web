import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, createT, isLocale, mergeMessages, type Locale, type Messages, type TFunction } from "@/i18n/core";
import uz from "@/i18n/messages/uz.json";
import ru from "@/i18n/messages/ru.json";
import en from "@/i18n/messages/en.json";
import kz from "@/i18n/messages/kz.json";

const CATALOG: Record<Locale, Messages> = { uz, ru, en, kz } as Record<Locale, Messages>;

/** Dictionary for a language, with Uzbek filling any key that language does not have yet. */
export const getMessages = (locale: Locale): Messages =>
  locale === DEFAULT_LOCALE ? CATALOG.uz : mergeMessages(CATALOG.uz, CATALOG[locale]);

/** The visitor's language: their saved choice, else the browser's preference, else Uzbek. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (code === "kk") return "kz";
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
});

/** Translator for server components, server actions and metadata. */
export const getT = cache(async (): Promise<TFunction> => {
  const locale = await getLocale();
  return createT(locale, getMessages(locale));
});
