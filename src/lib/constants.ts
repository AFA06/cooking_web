export const PLATFORM_CONFIG = {
  name: "Damda",
  urls: {
    recipes: "/recipes",
    becomeCreator: "/creators/join",
    login: "/auth/login",
    signup: "/auth/signup",
    account: "/account",
    shopping: "/shopping",
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
  supportedLocales: ["uz", "ru", "en", "kz"] as const,
  defaultLocale: "uz" as const,
} as const;

export type SupportedLocale = (typeof PLATFORM_CONFIG.supportedLocales)[number];

/** Link labels are message keys: translate them with t(label). */
export const NAVIGATION_LINKS = {
  public: [
    { label: "nav.home", href: "/" },
    { label: "nav.recipes", href: PLATFORM_CONFIG.urls.recipes },
    { label: "nav.becomeCreator", href: PLATFORM_CONFIG.urls.becomeCreator },
  ],
  footer: {
    product: [
      { label: "nav.recipes", href: PLATFORM_CONFIG.urls.recipes },
      { label: "nav.becomeCreator", href: PLATFORM_CONFIG.urls.becomeCreator },
    ],
    legal: [
      { label: "nav.terms", href: "/terms" },
      { label: "nav.privacy", href: "/privacy" },
    ],
  },
} as const;
