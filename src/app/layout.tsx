import type { Metadata, Viewport } from "next";
import { Literata, Onest } from "next/font/google";
import { SITE_URL } from "@/lib/site-url";
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

export const metadata: Metadata = {
  title: {
    default: "Damda — sevimli ijodkorlaringizdan qadam-baqadam retseptlar",
    template: "%s | Damda",
  },
  description:
    "Pishirayotganda YouTube’ga qaytmang. Haqiqiy oshpaz va ijodkorlarning retseptlari — masalliq, miqdor, taymer va keyingi qadam bilan. Bepul va premium retseptlar.",
  keywords: ["retseptlar", "o‘zbek taomlari", "qadam-baqadam retsept", "osh", "lag‘mon", "pazandalik"],
  authors: [{ name: "Damda" }],
  creator: "Damda",
  publisher: "Damda",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: "Damda",
    title: "Damda — sevimli ijodkorlaringizdan qadam-baqadam retseptlar",
    description:
      "Pishirayotganda YouTube’ga qaytmang. Haqiqiy ijodkorlarning retseptlari qadam-baqadam yo‘l-yo‘riq bilan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Damda — sevimli ijodkorlaringizdan qadam-baqadam retseptlar",
    description:
      "Pishirayotganda YouTube’ga qaytmang. Haqiqiy ijodkorlarning retseptlari qadam-baqadam yo‘l-yo‘riq bilan.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "#fdfbf7" },
  ],
  width: "device-width",
  initialScale: 1,
  };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uz"
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
          Asosiy tarkibga o‘tish
        </a>
        {children}
      </body>
    </html>
  );
}