import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const links = [...NAVIGATION_LINKS.footer.product, ...NAVIGATION_LINKS.footer.legal];

  return (
    <footer className="border-t border-amber-200 bg-amber-100/60">
      <Container size="xl" className="py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2" aria-label={`${PLATFORM_CONFIG.name} — bosh sahifa`}>
              <span className="h-2.5 w-2.5 rounded-full bg-clay-400" aria-hidden="true" />
              <span className="font-serif text-2xl font-semibold text-amber-950">{PLATFORM_CONFIG.name}</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-amber-600">{PLATFORM_CONFIG.tagline}. Oshxona uchun yaratilgan.</p>
          </div>
          <nav aria-label="Pastki menyu">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-amber-900 hover:text-amber-700">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-10 text-sm text-amber-600">© {year} {PLATFORM_CONFIG.name}. Barcha huquqlar himoyalangan.</p>
      </Container>
    </footer>
  );
}
