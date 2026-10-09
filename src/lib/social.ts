/** Social profiles a creator can link. Pure data and validation, shared by forms and display. */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"], base: "https://instagram.com/", placeholder: "https://instagram.com/username" },
  { key: "tiktok", label: "TikTok", hosts: ["tiktok.com"], base: "https://www.tiktok.com/@", placeholder: "https://www.tiktok.com/@username" },
  { key: "telegram", label: "Telegram", hosts: ["t.me", "telegram.me"], base: "https://t.me/", placeholder: "https://t.me/username" },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], base: "https://www.youtube.com/@", placeholder: "https://www.youtube.com/@username" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

const USERNAME = /^@?[a-zA-Z0-9._-]{2,50}$/;

/**
 * Accepts a full profile link or a bare username and returns a safe https link
 * on the platform's own domain, or null when the input is not a profile there.
 */
export function normalizeSocialUrl(platform: SocialPlatform, input: string): string | null {
  const config = SOCIAL_PLATFORMS.find((p) => p.key === platform);
  const value = input.trim();
  if (!config || value === "") return null;
  if (USERNAME.test(value)) return config.base + value.replace(/^@/, "");

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
    if (!config.hosts.some((allowed) => host === allowed)) return null;
    if (url.pathname.length <= 1) return null;
    return `https://${url.hostname}${url.pathname}`.slice(0, 200);
  } catch {
    return null;
  }
}

/** Keeps only known platforms with valid links; used on anything read from storage or a form. */
export function cleanSocialLinks(raw: unknown): SocialLinks {
  const result: SocialLinks = {};
  if (!raw || typeof raw !== "object") return result;
  for (const { key } of SOCIAL_PLATFORMS) {
    const value = (raw as Record<string, unknown>)[key];
    const url = typeof value === "string" ? normalizeSocialUrl(key, value) : null;
    if (url) result[key] = url;
  }
  return result;
}
