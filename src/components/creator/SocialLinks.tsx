import Link from "next/link";
import { Plus } from "lucide-react";
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

const HOVER: Record<SocialPlatform, string> = {
  instagram: "hover:border-[#c13584] hover:bg-[#c13584]",
  tiktok: "hover:border-amber-950 hover:bg-amber-950",
  telegram: "hover:border-[#229ed9] hover:bg-[#229ed9]",
  youtube: "hover:border-[#d93025] hover:bg-[#d93025]",
};

export function SocialLinks({ links, canEdit = false }: { links: Links; canEdit?: boolean }) {
  const present = SOCIAL_PLATFORMS.filter((p) => links[p.key]);
  if (present.length === 0 && !canEdit) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {present.length > 0 && (
        <ul className="flex flex-wrap gap-2.5" aria-label="Ijtimoiy tarmoqlar">
          {present.map((p) => (
            <li key={p.key}>
              <a
                href={links[p.key]}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={p.label}
                aria-label={`${p.label} sahifasi`}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-950 transition-colors duration-200 hover:text-white",
                  HOVER[p.key],
                )}
              >
                <SocialIcon platform={p.key} className="h-[1.35rem] w-[1.35rem]" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {canEdit && present.length < SOCIAL_PLATFORMS.length && (
        <Link
          href="/dashboard/profile"
          className="flex h-12 items-center gap-2 rounded-full border border-dashed border-amber-400 px-4 text-[0.95rem] font-medium text-amber-900 transition-colors hover:border-amber-950 hover:text-amber-950"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ijtimoiy tarmoq qo‘shish
        </Link>
      )}
    </div>
  );
}
