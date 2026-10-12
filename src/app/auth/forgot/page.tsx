import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ForgotForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Parolni tiklash", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <SiteShell>
      <AuthScreen
        eyebrow="Parolni tiklash"
        title={<>Parolni <em className="text-clay-400">unutdingizmi?</em></>}
        note="Hisobingizga bog‘langan telefon raqami yoki emailni kiriting. Tasdiqlash kodini yuboramiz."
      >
        <ForgotForm action={requestPasswordReset} />
        <p className="mt-6 text-sm text-amber-900">
          <Link href="/auth/login" className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            Kirish sahifasiga qaytish
          </Link>
        </p>
      </AuthScreen>
    </SiteShell>
  );
}
