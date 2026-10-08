import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "@/components/landing/MobileMenu";
import { getCurrentUser } from "@/server/auth";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export async function Navigation() {
  const user = await getCurrentUser();
  const isCreator = user?.role === "creator" || user?.role === "admin";
  const mobileItems = [
    ...NAVIGATION_LINKS.public,
    ...(user
      ? [...(isCreator ? [{ label: "Boshqaruv paneli", href: "/dashboard" }] : []), { label: "Mening oshxonam", href: PLATFORM_CONFIG.urls.account }]
      : [{ label: "Ro‘yxatdan o‘tish", href: PLATFORM_CONFIG.urls.signup }]),
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-50/95 backdrop-blur">
      <Container size="xl">
        <nav className="flex h-16 items-center justify-between gap-4" aria-label="Asosiy menyu">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-amber-950" aria-label={`${PLATFORM_CONFIG.name} — bosh sahifa`}>
            {PLATFORM_CONFIG.name}
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {NAVIGATION_LINKS.public.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[0.95rem] font-medium text-amber-900 transition-colors hover:text-amber-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isCreator && (
                  <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/dashboard">Panel</Link>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={PLATFORM_CONFIG.urls.account}>Mening oshxonam</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={PLATFORM_CONFIG.urls.login}>Kirish</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href={PLATFORM_CONFIG.urls.signup}>Ro‘yxatdan o‘tish</Link>
                </Button>
              </>
            )}
            <MobileMenu items={mobileItems} />
          </div>
        </nav>
      </Container>
    </header>
  );
}
