/** Countries people can sign up from, with dialing code and the length of the local number. Safe in the browser. */

export interface Country {
  /** ISO code, also the key of the country name in messages (country.UZ …). */
  iso: string;
  flag: string;
  dial: string;
  /** Allowed lengths of the number after the dialing code. */
  lengths: number[];
  /** How the local part is grouped for reading, e.g. [2, 3, 2, 2] → "90 123 45 67". */
  groups: number[];
  example: string;
}

export const COUNTRIES: Country[] = [
  { iso: "UZ", flag: "🇺🇿", dial: "998", lengths: [9], groups: [2, 3, 2, 2], example: "90 123 45 67" },
  { iso: "KZ", flag: "🇰🇿", dial: "7", lengths: [10], groups: [3, 3, 2, 2], example: "701 234 56 78" },
  { iso: "RU", flag: "🇷🇺", dial: "7", lengths: [10], groups: [3, 3, 2, 2], example: "912 345 67 89" },
  { iso: "KG", flag: "🇰🇬", dial: "996", lengths: [9], groups: [3, 3, 3], example: "700 123 456" },
  { iso: "TJ", flag: "🇹🇯", dial: "992", lengths: [9], groups: [2, 3, 2, 2], example: "90 123 45 67" },
  { iso: "TM", flag: "🇹🇲", dial: "993", lengths: [8], groups: [2, 2, 2, 2], example: "65 12 34 56" },
  { iso: "TR", flag: "🇹🇷", dial: "90", lengths: [10], groups: [3, 3, 2, 2], example: "532 123 45 67" },
  { iso: "AE", flag: "🇦🇪", dial: "971", lengths: [9], groups: [2, 3, 4], example: "50 123 4567" },
  { iso: "KR", flag: "🇰🇷", dial: "82", lengths: [9, 10], groups: [2, 4, 4], example: "10 1234 5678" },
  { iso: "GB", flag: "🇬🇧", dial: "44", lengths: [10], groups: [4, 3, 3], example: "7400 123 456" },
  { iso: "DE", flag: "🇩🇪", dial: "49", lengths: [10, 11], groups: [3, 4, 4], example: "151 2345 6789" },
  { iso: "US", flag: "🇺🇸", dial: "1", lengths: [10], groups: [3, 3, 4], example: "201 555 0123" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function countryByIso(iso: string | null | undefined): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_COUNTRY;
}

/** Digits of the local part, cut to the longest allowed length. Never strips anything the person typed. */
export function localDigits(input: string, country: Country): string {
  return input.replace(/\D/g, "").slice(0, Math.max(...country.lengths));
}

/**
 * For pasting: "+998 90 123 45 67" or "998901234567" into a field already set to +998 keeps only the local
 * part. Only applies when the text is longer than a local number, so typing "998…" by hand is left alone.
 */
export function stripDialCode(input: string, country: Country): string {
  const digits = input.replace(/\D/g, "");
  const max = Math.max(...country.lengths);
  if (digits.length > max && digits.startsWith(country.dial)) return digits.slice(country.dial.length);
  return digits;
}

export function formatLocal(digits: string, country: Country): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of country.groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) parts.push(digits.slice(i));
  return parts.join(" ");
}

/** "+998901234567" for a valid number of the chosen country, otherwise null. */
export function toInternational(country: Country, local: string): string | null {
  const d = local.replace(/\D/g, "");
  if (!country.lengths.includes(d.length) || d.startsWith("0")) return null;
  if (country.iso === "UZ" && !/^[1-9]/.test(d)) return null;
  return `+${country.dial}${d}`;
}

/** Accepts a full international number of any supported country (with or without +). */
export function parseInternational(input: string): { phone: string; country: Country } | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  const bare = digits.replace(/^\+/, "");
  // A bare nine-digit number is read as Uzbek, as people there usually type it.
  if (bare.length === 9) {
    const phone = toInternational(DEFAULT_COUNTRY, bare);
    return phone ? { phone, country: DEFAULT_COUNTRY } : null;
  }
  // Longest dialing code first, so +998 wins over +9x.
  for (const country of [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)) {
    if (!bare.startsWith(country.dial)) continue;
    const phone = toInternational(country, bare.slice(country.dial.length));
    if (phone) return { phone, country };
  }
  return null;
}
