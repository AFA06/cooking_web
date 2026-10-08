"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartColumn, ChefHat, ExternalLink, LayoutDashboard, Menu, Receipt, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Umumiy ko‘rinish", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Statistika", icon: ChartColumn },
  { href: "/admin/creators", label: "Ijodkorlar", icon: ChefHat },
  { href: "/admin/recipes", label: "Retseptlar", icon: BookOpen },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/purchases", label: "Xaridlar", icon: Receipt },
];

interface Props {
  userName: string;
  userEmail: string;
  /** Logout form rendered by the server layout. */
  logout: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ userName, userEmail, logout, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sidebar = (
    <div className="flex h-full flex-col bg-amber-950 text-amber-100">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/admin" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-serif text-2xl font-semibold text-white">Damda</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-400">Admin</span>
        </Link>
        <button type="button" className="flex h-10 w-10 items-center justify-center lg:hidden" aria-label="Menyuni yopish" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Admin bo‘limlari" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-500">Boshqaruv</p>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors",
                    active ? "bg-white/10 font-medium text-white" : "text-amber-200/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-amber-300" aria-hidden="true" />}
                  <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-amber-200/80 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Saytni ochish
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-md bg-white/5 px-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300 font-serif text-base font-semibold text-amber-950" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-amber-300/80">{userEmail}</p>
          </div>
        </div>
        <div className="mt-1">{logout}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50 lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menyusi">
          <button type="button" className="absolute inset-0 bg-amber-950/60" aria-label="Menyuni yopish" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-amber-200 bg-amber-50/95 px-4 backdrop-blur lg:hidden">
        <button type="button" className="flex h-11 w-11 items-center justify-center text-amber-950" aria-label="Menyuni ochish" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="font-serif text-xl font-semibold text-amber-950">Damda</span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-700">Admin</span>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-[100rem] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
