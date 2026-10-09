import { SOCIAL_PLATFORMS, type SocialLinks as Links, type SocialPlatform } from "@/lib/social";
import { cn } from "@/lib/utils";

/** Simple line glyphs drawn for this product; not the platforms' official marks. */
export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: cn("h-5 w-5", className), "aria-hidden": true };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v10.5a3.75 3.75 0 1 1-3.75-3.75" />
          <path d="M14 4c.4 2.5 2.1 4.2 4.75 4.5" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path d="M20.5 4.5 3.5 11l5.5 2 2 6 3.2-4 4.3 3z" />
          <path d="m9 13 7-5" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10.2 9.3 4.6 2.7-4.6 2.7z" fill="currentColor" />
        </svg>
      );
  }
}

export function SocialLinks({ links }: { links: Links }) {
  const present = SOCIAL_PLATFORMS.filter((p) => links[p.key]);
  if (present.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Ijtimoiy tarmoqlar">
      {present.map((p) => (
        <li key={p.key}>
          <a
            href={links[p.key]}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex h-11 items-center gap-2 rounded-full border border-amber-300 px-4 text-[0.95rem] font-medium text-amber-950 transition-colors hover:border-amber-950"
          >
            <SocialIcon platform={p.key} />
            {p.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
