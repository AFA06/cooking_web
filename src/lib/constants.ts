export const PLATFORM_CONFIG = {
  name: "Damda",
  tagline: "Sevimli ijodkorlaringizdan qadam-baqadam retseptlar",
  urls: {
    recipes: "/recipes",
    creators: "/creators",
    becomeCreator: "/creators/join",
    login: "/auth/login",
    signup: "/auth/signup",
    account: "/account",
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
    { label: "Bosh sahifa", href: "/" },
    { label: "Retseptlar", href: PLATFORM_CONFIG.urls.recipes },
    { label: "Ijodkorlar", href: PLATFORM_CONFIG.urls.creators },
    { label: "Ijodkor bo‘lish", href: PLATFORM_CONFIG.urls.becomeCreator },
  ],
  footer: {
    product: [
      { label: "Retseptlar", href: PLATFORM_CONFIG.urls.recipes },
      { label: "Ijodkorlar", href: PLATFORM_CONFIG.urls.creators },
      { label: "Ijodkor bo‘lish", href: PLATFORM_CONFIG.urls.becomeCreator },
    ],
    legal: [
      { label: "Foydalanish shartlari", href: "/terms" },
      { label: "Maxfiylik siyosati", href: "/privacy" },
    ],
  },
} as const;
