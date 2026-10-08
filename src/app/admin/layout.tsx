import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/server/admin";
import { logout } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: { default: "Admin paneli", template: "%s · Admin | Damda" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();

  return (
    <AdminShell
      userName={user.name}
      userEmail={user.email}
      logout={
        <form action={logout}>
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-amber-200/80 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Chiqish
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
