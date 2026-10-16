import type { Metadata, Viewport } from "next";
import { Literata, Onest } from "next/font/google";
import { LOCALE_INFO } from "@/i18n/core";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getMessages, getT } from "@/i18n/server";
import { SITE_URL } from "@/lib/site-url";
import { NavProgress } from "@/components/layout/NavProgress";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-literata",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const title = t("meta.title");
  return {
    title: { default: title, template: "%s | Damda" },
    description: t("meta.description"),
    keywords: t("meta.keywords").split(", "),
    authors: [{ name: "Damda" }],
    creator: "Damda",
    publisher: "Damda",
    formatDetection: { email: false, address: false, telephone: false },
    metadataBase: new URL(SITE_URL),
    openGraph: { type: "website", locale: LOCALE_INFO[locale].og, url: SITE_URL, siteName: "Damda", title, description: t("meta.shortDescription") },
    twitter: { card: "summary_large_image", title, description: t("meta.shortDescription") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { color: "#fdfbf7" },
  ],
  width: "device-width",
  initialScale: 1,
  };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return (
    <html
      lang={LOCALE_INFO[locale].html}
      className={`${onest.variable} ${literata.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col bg-amber-50 text-amber-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-amber-100 focus:px-4 focus:py-2"
        >
          {t("nav.skip")}
        </a>
        <NavProgress />
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}