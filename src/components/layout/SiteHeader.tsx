import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getCurrentUser } from "@/server/auth";
import { logout } from "@/app/auth/actions";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isCreator = user?.role === "creator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  // Signed-in visitors get their own kitchen right in the bar, after the public links.
  const barItems = [...NAVIGATION_LINKS.public, ...(user ? [{ label: "Mening oshxonam", href: PLATFORM_CONFIG.urls.account }] : [])];

  const mobileItems = [
    ...NAVIGATION_LINKS.public,
    ...(user
      ? [
          ...(isCreator ? [{ label: "Retsept yaratish", href: "/dashboard/recipes/new" }, { label: "Ijodkor paneli", href: "/dashboard" }] : []),
          ...(isAdmin ? [{ label: "Admin paneli", href: "/admin" }] : []),
          { label: "Mening oshxonam", href: PLATFORM_CONFIG.urls.account },
          { label: "Profil sozlamalari", href: "/account/settings" },
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
            {barItems.map((link) => (
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
                {isCreator && (
                  <Button size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/dashboard/recipes/new"><Plus className="h-4 w-4" aria-hidden="true" />Retsept yaratish</Link>
                  </Button>
                )}
                <UserMenu name={user.name} email={user.email} isCreator={isCreator} isAdmin={isAdmin} />
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
