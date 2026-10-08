import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-amber-100">
      <Container size="lg">
        <nav className="flex h-16 items-center justify-between" aria-label="Main navigation">
          <Link
            href="/"
            className="text-xl font-serif font-medium text-amber-950 tracking-tight"
            aria-label={`${PLATFORM_CONFIG.name} - Home`}
          >
            {PLATFORM_CONFIG.name}
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              {NAVIGATION_LINKS.public.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" asChild>
                <Link href={PLATFORM_CONFIG.urls.recipes}>Explore recipes</Link>
              </Button>
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}