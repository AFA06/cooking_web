import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-amber-950 py-14 text-amber-50">
      <Container size="xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="font-serif text-2xl font-semibold" aria-label={`${PLATFORM_CONFIG.name} — bosh sahifa`}>
              {PLATFORM_CONFIG.name}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-amber-300">{PLATFORM_CONFIG.tagline}. Oshxona uchun yaratilgan, tasma uchun emas.</p>
          </div>
          <nav aria-label="Pastki menyu" className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.product.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-amber-200 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.legal.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-amber-200 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-12 border-t border-amber-50/15 pt-6 text-sm text-amber-300">© {year} {PLATFORM_CONFIG.name}. Barcha huquqlar himoyalangan.</p>
      </Container>
    </footer>
  );
}
