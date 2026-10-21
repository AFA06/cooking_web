"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, BookOpen, ChartColumn, ClipboardCheck, ExternalLink, LayoutDashboard, Menu, Plus, Star, UserRound, Wallet, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "adm.nav.overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/recipes", label: "nav.recipes", icon: BookOpen },
  { href: "/dashboard/stats", label: "adm.nav.stats", icon: ChartColumn },
  { href: "/dashboard/orders", label: "studio.nav.orders", icon: ClipboardCheck },
  { href: "/dashboard/promotions", label: "studio.nav.promotions", icon: BadgePercent },
  { href: "/dashboard/sales", label: "studio.nav.sales", icon: Wallet },
  { href: "/dashboard/reviews", label: "studio.nav.reviews", icon: Star },
  { href: "/dashboard/profile", label: "studio.nav.profile", icon: UserRound },
];

interface Props {
  name: string;
  avatarUrl: string | null;
  publicHref: string;
  /** Sign-out form rendered by the server layout. */
  logout: React.ReactNode;
  children: React.ReactNode;
}

/** The creator studio frame: a sidebar of sections on wide screens, a drawer on phones. */
export function StudioShell({ name, avatarUrl, publicHref, logout, children }: Props) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <div className="theme-light flex h-full flex-col bg-amber-950 text-amber-100">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-serif text-2xl font-semibold text-white">{BRAND_NAME}</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-400">{t("studio.nav.group")}</span>
        </Link>
        <button type="button" className="flex h-10 w-10 items-center justify-center lg:hidden" aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pb-2 pt-1">
        <Link
          href="/dashboard/recipes/new"
          onClick={() => setOpen(false)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-clay-400 text-base font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t("dash.newRecipe")}
        </Link>
      </div>

      <nav aria-label={t("studio.nav.sections")} className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative flex min-h-12 items-center gap-3 rounded-md px-3 text-[0.98rem] transition-colors",
                    active ? "bg-white/10 font-medium text-white" : "text-amber-200/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-amber-300" aria-hidden="true" />}
                  <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {t(label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link href={publicHref} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-amber-200/80 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {t("adm.publicPage")}
        </Link>
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-amber-200/80 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {t("studio.backToSite")}
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-md bg-white/5 px-3 py-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- creator's own avatar, any host
            <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300 font-serif text-base font-semibold text-amber-950" aria-hidden="true">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{name}</p>
        </div>
        <div className="mt-1">{logout}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-amber-50 lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("studio.nav.sections")}>
          <button type="button" className="absolute inset-0 bg-ink/60" aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-amber-200 bg-amber-50/95 px-4 backdrop-blur lg:hidden">
        <button type="button" className="flex h-11 w-11 items-center justify-center text-amber-950" aria-label={t("nav.openMenu")} aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="font-serif text-xl font-semibold text-amber-950">{BRAND_NAME}</span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-700">{t("studio.nav.group")}</span>
        <Link href="/dashboard/recipes/new" className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-amber-700 px-4 text-sm font-semibold text-amber-50">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("dash.newRecipe")}
        </Link>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
