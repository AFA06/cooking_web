import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Separator } from "@/components/ui/Separator";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-amber-950 text-white py-14 lg:py-16" role="contentinfo">
      <Container size="lg">
        <div className="flex flex-col md:flex-row md:justify-between gap-10 mb-10">
          <div className="max-w-sm">
            <Link
              href="/"
              className="text-xl font-serif font-medium tracking-tight"
              aria-label={`${PLATFORM_CONFIG.name} - Home`}
            >
              {PLATFORM_CONFIG.name}
            </Link>
            <p className="mt-4 text-amber-300 text-sm leading-relaxed">
              Step-by-step recipes from the creators you love. Designed for the kitchen, not the feed.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-amber-300 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="border-amber-800 mb-8" />

        <p className="text-amber-400 text-sm">
          © {CURRENT_YEAR} {PLATFORM_CONFIG.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
