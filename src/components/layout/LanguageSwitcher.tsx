"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import GB from "country-flag-icons/react/3x2/GB";
import KZ from "country-flag-icons/react/3x2/KZ";
import RU from "country-flag-icons/react/3x2/RU";
import UZ from "country-flag-icons/react/3x2/UZ";
import { setLocale } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/client";
import { LOCALES, LOCALE_INFO, type Locale } from "@/i18n/core";

// SVG flags rather than emoji: Windows shows emoji flags as plain letters.
const FLAGS: Record<Locale, typeof UZ> = { uz: UZ, ru: RU, en: GB, kz: KZ };

function Flag({ locale }: { locale: Locale }) {
  const Icon = FLAGS[locale];
  return <Icon aria-hidden="true" className="h-[0.95rem] w-auto shrink-0 rounded-[3px] ring-1 ring-black/10" />;
}

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
        <Flag locale={current} />
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
              <span className={locale === current ? "flex items-center gap-3 font-semibold" : "flex items-center gap-3"}>
                <Flag locale={locale} />
                {LOCALE_INFO[locale].label}
              </span>
              {locale === current && <Check className="h-4 w-4 text-amber-700" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
