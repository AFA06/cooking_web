import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Separator } from "@/components/ui/Separator";
import { NAVIGATION_LINKS, PLATFORM_CONFIG } from "@/lib/constants";

const CURRENT_YEAR = 2026;

export function Footer() {

  return (
    <footer className="bg-amber-950 text-white py-16 lg:py-20" role="contentinfo">
      <Container size="lg">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-serif font-medium tracking-tight" aria-label={`${PLATFORM_CONFIG.name} - Home`}>
              {PLATFORM_CONFIG.name}
            </Link>
            <p className="mt-4 text-amber-300 text-sm leading-relaxed">
              Step-by-step recipes from the creators you love. Designed for the
              kitchen, not the feed.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="font-medium mb-4">Product</h3>
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-amber-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-amber-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-3">
              {NAVIGATION_LINKS.footer.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-amber-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="border-amber-800 mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-amber-400 text-sm">
            © {CURRENT_YEAR} {PLATFORM_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-white transition-colors"
              aria-label="Telegram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.998 6.186a.992.992 0 0 0-1.388-.518l-8.483 4.937-3.243-3.154a.974.974 0 0 0-1.399.381L2.868 19.574a.992.992 0 0 0 .475 1.37.981.981 0 0 0 .527.115.986.986 0 0 0 .436-.136l6.963-3.063 5.38 5.688a.988.988 0 0 0 1.442.003l7.609-8.51a.99.99 0 0 0-.012-1.374l-.319-.373z" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}