import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ResendButton, ResetPasswordForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { completePasswordReset, resendPasswordResetCode } from "../actions";

export const metadata: Metadata = { title: "Yangi parol", robots: { index: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deliberately never looks the reset up: this screen is identical whether or not the account exists,
 * so it cannot be used to find out who has one.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c = "" } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  if (!UUID.test(c)) redirect("/auth/forgot");

  return (
    <SiteShell>
      <AuthScreen
        eyebrow="Parolni tiklash"
        title={<>Yangi parol <em className="text-clay-400">o‘rnating.</em></>}
        note="Agar hisob mavjud bo‘lsa, kod yuborildi: tasdiqlangan emailingizga, email bo‘lmasa telefoningizga SMS orqali. Emailingizga kira olmasangiz, pastdagi SMS tugmasini bosing."
      >
        <ResetPasswordForm action={completePasswordReset} challengeId={c} />
        <div className="mt-6 flex flex-col gap-4">
          <ResendButton action={resendPasswordResetCode} challengeId={c} label="Kodni qayta yuborish" />
          <ResendButton action={resendPasswordResetCode} challengeId={c} via="sms" label="Emailga kira olmayman — SMS yuborish" />
          <Link href="/auth/forgot" className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            Boshqa raqam yoki email kiritish
          </Link>
        </div>
      </AuthScreen>
    </SiteShell>
  );
}
