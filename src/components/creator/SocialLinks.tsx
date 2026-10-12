import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { SocialIcon } from "@/components/creator/SocialIcon";
import { SOCIAL_PLATFORMS, type SocialLinks as Links, type SocialPlatform } from "@/lib/social";
import { cn } from "@/lib/utils";

const HOVER: Record<SocialPlatform, string> = {
  instagram: "hover:border-[#c13584] hover:bg-[#c13584]",
  tiktok: "hover:border-[#fe2c55] hover:bg-[#fe2c55]",
  telegram: "hover:border-[#229ed9] hover:bg-[#229ed9]",
  youtube: "hover:border-[#d93025] hover:bg-[#d93025]",
};

export async function SocialLinks({ links, canEdit = false }: { links: Links; canEdit?: boolean }) {
  const t = await getT();
  const present = SOCIAL_PLATFORMS.filter((p) => links[p.key]);
  const shape = "flex h-12 w-12 items-center justify-center rounded-full border";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <ul className="flex flex-wrap gap-2.5" aria-label={t("social.aria")}>
        {SOCIAL_PLATFORMS.map((p) => (
          <li key={p.key}>
            {links[p.key] ? (
              <a
                href={links[p.key]}
                target="_blank"
                rel="noopener noreferrer nofollow"
                title={p.label}
                aria-label={t("social.page", { label: p.label })}
                className={cn(shape, "border-amber-300 bg-amber-100 text-amber-950 transition-colors duration-200 hover:text-white", HOVER[p.key])}
              >
                <SocialIcon platform={p.key} className="h-[1.35rem] w-[1.35rem]" />
              </a>
            ) : (
              <span title={t("social.notLinked", { label: p.label })} className={cn(shape, "border-amber-300 text-amber-500")}>
                <SocialIcon platform={p.key} className="h-[1.35rem] w-[1.35rem]" />
                <span className="sr-only">{t("social.notLinked", { label: p.label })}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {canEdit && present.length < SOCIAL_PLATFORMS.length && (
        <Link
          href="/dashboard/profile"
          className="flex h-12 items-center gap-2 rounded-full border border-dashed border-amber-400 px-4 text-[0.95rem] font-medium text-amber-900 transition-colors hover:border-amber-950 hover:text-amber-950"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("social.add")}
        </Link>
      )}
    </div>
  );
}
