import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { getT } from "@/i18n/server";
import { isAdminEntryKey } from "@/server/admin-entry";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The admin sign-in. Reached through the secret address; any other key is an ordinary 404. */
export default async function AdminLoginPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAdminEntryKey(key)) notFound();
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (user?.role === "admin") redirect("/admin");

  return (
    <main className="flex min-h-svh items-center">
      <Container size="sm" className="py-16">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay-400">{PLATFORM_CONFIG.name} · Admin</p>
          <h1 className="mt-5 font-serif text-[2.5rem] font-medium leading-[1.05] text-amber-950">{t("admLogin.title")}</h1>
          <p className="mt-4 text-amber-900">{t("admLogin.note")}</p>
          <AdminLoginForm entryKey={key} />
        </div>
      </Container>
    </main>
  );
}
