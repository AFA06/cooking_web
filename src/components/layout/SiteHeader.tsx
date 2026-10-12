import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { logout } from "@/app/auth/actions";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export async function SiteHeader() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const isCreator = user?.role === "creator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const personalItems = [
    { label: t("nav.myKitchen"), href: PLATFORM_CONFIG.urls.account },
    { label: t("nav.shopping"), href: PLATFORM_CONFIG.urls.shopping },
  ];
  const publicItems = NAVIGATION_LINKS.public.map((l) => ({ label: t(l.label), href: l.href }));
  // Signed-in visitors get their own pages right in the bar, after the public links.
  const barItems = [...publicItems, ...(user ? personalItems : [])];

  const mobileItems = [
    ...publicItems,
    ...(user
      ? [
          ...(isCreator ? [{ label: t("nav.createRecipe"), href: "/dashboard/recipes/new" }, { label: t("nav.creatorPanel"), href: "/dashboard" }] : []),
          ...(isAdmin ? [{ label: t("nav.adminPanel"), href: "/admin" }] : []),
          ...personalItems,
          { label: t("nav.settings"), href: "/account/settings" },
        ]
      : [{ label: t("nav.signup"), href: PLATFORM_CONFIG.urls.signup }]),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/70 bg-amber-50/85 backdrop-blur-md">
      <Container size="xl">
        <nav className="flex h-16 items-center gap-6" aria-label={t("nav.main")}>
          <Link href="/" className="flex items-center gap-2" aria-label={t("nav.homeLabel", { name: PLATFORM_CONFIG.name })}>
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

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                {isCreator && (
                  <Button size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/dashboard/recipes/new"><Plus className="h-4 w-4" aria-hidden="true" />{t("nav.createRecipe")}</Link>
                  </Button>
                )}
                <UserMenu name={user.name} email={user.email} isCreator={isCreator} isAdmin={isAdmin} />
              </>
            ) : (
              <>
                <Link href={PLATFORM_CONFIG.urls.login} className="flex h-10 items-center px-3 text-[0.95rem] font-medium text-amber-950 hover:text-amber-700">
                  {t("nav.login")}
                </Link>
                <Button size="sm" asChild className="hidden min-[420px]:inline-flex">
                  <Link href={PLATFORM_CONFIG.urls.signup}>{t("nav.signup")}</Link>
                </Button>
              </>
            )}
            <MobileMenu items={mobileItems}>
              {user && (
                <form action={logout} className="border-t border-amber-200 pt-2">
                  <button type="submit" className="block w-full py-4 text-left text-lg font-medium text-amber-950">{t("nav.logout")}</button>
                </form>
              )}
            </MobileMenu>
          </div>
        </nav>
      </Container>
    </header>
  );
}
