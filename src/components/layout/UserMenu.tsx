"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChefHat, ChevronDown, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { logout } from "@/app/auth/actions";

interface Props {
  name: string;
  email: string;
  isCreator: boolean;
  isAdmin: boolean;
}

const item =
  "flex h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-[0.95rem] text-amber-950 outline-none data-[highlighted]:bg-amber-200";

/** The signed-in person's avatar in the header; opens their links and the sign-out button. */
export function UserMenu({ name, email, isCreator, isAdmin }: Props) {
  const initial = name.slice(0, 1).toUpperCase();
  const links = [
    { href: "/account", label: "Mening oshxonam", icon: ChefHat },
    { href: "/account/settings", label: "Profil sozlamalari", icon: Settings },
    ...(isCreator ? [{ href: "/dashboard", label: "Ijodkor paneli", icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin paneli", icon: Shield }] : []),
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Profil menyusi"
        className="group flex h-11 items-center gap-2 rounded-full border border-amber-200 py-1 pl-1 pr-3 text-sm font-medium text-amber-950 outline-none transition-colors hover:border-amber-300 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-700 data-[state=open]:border-amber-300 data-[state=open]:bg-amber-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 font-serif text-base font-semibold text-amber-50" aria-hidden="true">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate sm:block">{name.split(" ")[0]}</span>
        <ChevronDown className="h-4 w-4 text-amber-600 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="menu-pop z-[60] w-72 rounded-2xl border border-amber-200 bg-amber-100 p-1.5 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.75)]"
        >
          <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-500 font-serif text-lg font-semibold text-amber-50" aria-hidden="true">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-amber-950">{name}</p>
              <p className="truncate text-sm text-amber-600">{email}</p>
            </div>
          </div>
          <DropdownMenu.Separator className="mx-1 mb-1.5 h-px bg-amber-200" />
          {links.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item key={href} asChild className={item}>
              <Link href={href}>
                <Icon className="h-[1.15rem] w-[1.15rem] text-amber-600" aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-amber-200" />
          <DropdownMenu.Item className={`${item} text-red-700`} onSelect={() => void logout()}>
            <LogOut className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            Chiqish
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
