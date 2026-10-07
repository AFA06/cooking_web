export const PLATFORM_CONFIG = {
  name: "Damda",
  tagline: "Step-by-step recipes from the creators you love",
  description:
    "Stop going back to YouTube while you're cooking. Structured, guided cooking experiences from real food creators.",
  urls: {
    recipes: "/recipes",
    creators: "/creators",
    becomeCreator: "/creators/join",
    login: "/auth/login",
    signup: "/auth/signup",
  },
  creator: {
    foundingCommissionRate: 0,
    standardCommissionRate: 0.1,
    foundingCreatorCount: 10,
  },
  pricing: {
    currency: "UZS",
    examples: [10000, 20000],
  },
  supportedLocales: ["uz", "ru", "en"] as const,
  defaultLocale: "uz" as const,
} as const;

export type SupportedLocale = (typeof PLATFORM_CONFIG.supportedLocales)[number];

export const NAVIGATION_LINKS = {
  public: [
    { label: "Recipes", href: PLATFORM_CONFIG.urls.recipes },
    { label: "Creators", href: PLATFORM_CONFIG.urls.creators },
    { label: "Become a Creator", href: PLATFORM_CONFIG.urls.becomeCreator },
  ],
  footer: {
    product: [
      { label: "Recipes", href: PLATFORM_CONFIG.urls.recipes },
      { label: "Creators", href: PLATFORM_CONFIG.urls.creators },
      { label: "Become a Creator", href: PLATFORM_CONFIG.urls.becomeCreator },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
} as const;