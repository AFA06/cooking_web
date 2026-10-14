import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio/StudioShell";
import { getT } from "@/i18n/server";
import { logout } from "@/app/auth/actions";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect("/auth/login?next=/dashboard");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");

  return (
    <StudioShell
      name={creator.name}
      avatarUrl={creator.avatarUrl}
      publicHref={`/creators/${creator.slug}`}
      logout={
        <form action={logout}>
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-amber-200/80 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t("nav.logout")}
          </button>
        </form>
      }
    >
      {children}
    </StudioShell>
  );
}
