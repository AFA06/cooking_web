import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getCurrentUser } from "@/server/auth";
import { logout } from "@/app/auth/actions";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isCreator = user?.role === "creator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const mobileItems = [
    ...NAVIGATION_LINKS.public,
    ...(user
      ? [
          ...(isCreator ? [{ label: "Retsept yaratish", href: "/dashboard/recipes/new" }, { label: "Ijodkor paneli", href: "/dashboard" }] : []),
          ...(isAdmin ? [{ label: "Admin paneli", href: "/admin" }] : []),
          { label: "Mening oshxonam", href: PLATFORM_CONFIG.urls.account },
        ]
      : [{ label: "Ro‘yxatdan o‘tish", href: PLATFORM_CONFIG.urls.signup }]),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/70 bg-amber-50/85 backdrop-blur-md">
      <Container size="xl">
        <nav className="flex h-16 items-center gap-6" aria-label="Asosiy menyu">
          <Link href="/" className="flex items-center gap-2" aria-label={`${PLATFORM_CONFIG.name} — bosh sahifa`}>
            <span className="h-2.5 w-2.5 rounded-full bg-clay-400" aria-hidden="true" />
            <span className="font-serif text-[1.6rem] font-semibold leading-none tracking-tight text-amber-950">{PLATFORM_CONFIG.name}</span>
          </Link>

          <ul className="ml-4 hidden items-center gap-7 md:flex">
            {NAVIGATION_LINKS.public.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[0.95rem] text-amber-900 transition-colors hover:text-amber-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="hidden px-2 text-sm text-amber-600 hover:text-amber-950 lg:block">Admin</Link>
                )}
                {isCreator && (
                  <Button size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/dashboard/recipes/new"><Plus className="h-4 w-4" aria-hidden="true" />Retsept yaratish</Link>
                  </Button>
                )}
                <Link
                  href={PLATFORM_CONFIG.urls.account}
                  className="flex h-10 items-center gap-2 rounded-full pl-1 pr-3 text-sm font-medium text-amber-950 hover:bg-amber-100"
                  aria-label="Mening oshxonam"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-500 font-serif text-sm font-semibold text-white" aria-hidden="true">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-28 truncate sm:block">{user.name.split(" ")[0]}</span>
                </Link>
                <form action={logout} className="hidden md:block">
                  <button type="submit" className="h-10 px-2 text-sm text-amber-600 hover:text-amber-950">Chiqish</button>
                </form>
              </>
            ) : (
              <>
                <Link href={PLATFORM_CONFIG.urls.login} className="flex h-10 items-center px-3 text-[0.95rem] font-medium text-amber-950 hover:text-amber-700">
                  Kirish
                </Link>
                <Button size="sm" asChild className="hidden min-[420px]:inline-flex">
                  <Link href={PLATFORM_CONFIG.urls.signup}>Ro‘yxatdan o‘tish</Link>
                </Button>
              </>
            )}
            <MobileMenu items={mobileItems}>
              {user && (
                <form action={logout} className="border-t border-amber-200 pt-2">
                  <button type="submit" className="block w-full py-4 text-left text-lg font-medium text-amber-950">Chiqish</button>
                </form>
              )}
            </MobileMenu>
          </div>
        </nav>
      </Container>
    </header>
  );
}
