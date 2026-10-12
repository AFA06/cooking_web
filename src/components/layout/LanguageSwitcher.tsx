"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Globe } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/client";
import { LOCALES, LOCALE_INFO, type Locale } from "@/i18n/core";

/** Picks the site language. The choice is a cookie, so every page (and every later visit) follows it. */
export function LanguageSwitcher() {
  const router = useRouter();
  const t = useT();
  const current = useLocale();
  const [pending, startTransition] = React.useTransition();

  const choose = (locale: Locale) => {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${t("nav.language")}: ${LOCALE_INFO[current].label}`}
        disabled={pending}
        className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-amber-950 outline-none transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-700 data-[state=open]:bg-amber-100"
      >
        <Globe className="h-[1.1rem] w-[1.1rem] text-amber-600" aria-hidden="true" />
        {LOCALE_INFO[current].short}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="menu-pop z-[60] min-w-[11rem] rounded-2xl border border-amber-200 bg-amber-100 p-1.5 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.75)]"
        >
          {LOCALES.map((locale) => (
            <DropdownMenu.Item
              key={locale}
              lang={LOCALE_INFO[locale].html}
              onSelect={() => choose(locale)}
              className="flex h-11 cursor-pointer select-none items-center justify-between gap-6 rounded-xl px-3 text-[0.95rem] text-amber-950 outline-none data-[highlighted]:bg-amber-200"
            >
              <span className={locale === current ? "font-semibold" : undefined}>{LOCALE_INFO[locale].label}</span>
              {locale === current && <Check className="h-4 w-4 text-amber-700" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
