"use client";

import * as React from "react";
import Link from "next/link";

interface Item {
  label: string;
  href: string;
}

export function MobileMenu({ items, children }: { items: Item[]; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center text-amber-950"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Mobil menyu" className="absolute left-0 right-0 top-16 border-b border-amber-200 bg-amber-50 px-5 pb-4" onClick={() => setOpen(false)}>
          <ul className="divide-y divide-amber-200">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="block py-4 text-lg font-medium text-amber-950">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          {children}
        </nav>
      )}
    </div>
  );
}
