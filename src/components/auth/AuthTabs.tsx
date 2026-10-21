import Link from "next/link";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";

/** "Sign in | Create account" switch shared by both forms. Keeps the page the person was heading to. */
export async function AuthTabs({ active, next }: { active: "login" | "signup"; next: string }) {
  const t = await getT();
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
  const tabs = [
    { key: "login", href: `/auth/login${suffix}`, label: t("nav.login") },
    { key: "signup", href: `/auth/signup${suffix}`, label: t("auth.createAccount") },
  ] as const;
  return (
    <nav aria-label={t("auth.switchLabel")} className="mt-8 grid grid-cols-2 rounded-full border border-amber-200 bg-amber-100 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          replace
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "flex h-11 items-center justify-center rounded-full text-[0.95rem] font-semibold transition-colors",
            active === tab.key ? "bg-amber-950 text-amber-50" : "text-amber-900 hover:text-amber-950",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** Why the person was sent here, so signing in doesn't feel like a detour. */
export async function authReason(next: string): Promise<string | undefined> {
  const t = await getT();
  if (/^\/recipes\/[^/]+\/cook/.test(next)) return t("auth.reasonCook");
  if (/^\/recipes\/[^/?#]+/.test(next)) return t("auth.reasonRecipe");
  return undefined;
}
