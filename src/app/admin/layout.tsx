import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { BRAND_NAME } from "@/lib/brand";
import { requireAdminPage } from "@/server/admin";
import { getT } from "@/i18n/server";
import { logout } from "@/app/auth/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { default: t("adm.metaDefault"), template: `%s · Admin | ${BRAND_NAME}` }, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([requireAdminPage(), getT()]);

  return (
    <AdminShell
      userName={user.name}
      userEmail={user.email ?? user.phone ?? ""}
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
    </AdminShell>
  );
}
