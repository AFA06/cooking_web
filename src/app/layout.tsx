import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Damda — Step-by-step recipes from the creators you love",
    template: "%s | Damda",
  },
  description:
    "Stop going back to YouTube while you're cooking. Structured, guided cooking experiences from real food creators. Free and premium recipes.",
  keywords: [
    "cooking",
    "recipes",
    "uzbek food",
    "guided cooking",
    "food creators",
    "step by step recipes",
  ],
  authors: [{ name: "Damda" }],
  creator: "Damda",
  publisher: "Damda",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://damda.uz"),
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://damda.uz",
    siteName: "Damda",
    title: "Damda — Step-by-step recipes from the creators you love",
    description:
      "Stop going back to YouTube while you're cooking. Structured, guided cooking experiences from real food creators.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Damda cooking platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Damda — Step-by-step recipes from the creators you love",
    description:
      "Stop going back to YouTube while you're cooking. Structured, guided cooking experiences from real food creators.",
    images: ["/og-image.jpg"],
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
    { media: "(prefers-color-scheme: light)", color: "#fef9f3" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uz"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col bg-amber-50 text-amber-950">
        {children}
      </body>
    </html>
  );
}