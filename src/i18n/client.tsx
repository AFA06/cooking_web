"use client";

import * as React from "react";
import { DEFAULT_LOCALE, createT, type Locale, type Messages, type TFunction } from "@/i18n/core";

interface Value {
  locale: Locale;
  t: TFunction;
}

const Context = React.createContext<Value>({ locale: DEFAULT_LOCALE, t: (key) => key });

/** Gives client components the current language and its dictionary. Mounted once in the root layout. */
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ locale, t: createT(locale, messages) }), [locale, messages]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useT = () => React.useContext(Context).t;
export const useLocale = () => React.useContext(Context).locale;
