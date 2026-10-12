import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ResendButton, VerifyCodeForm } from "@/components/auth/CodeForms";
import { SiteShell } from "@/components/layout/SiteShell";
import { maskPhone } from "@/lib/auth-rules";
import { getCurrentUser } from "@/server/auth";
import { cooldownLeft, getOpenChallenge } from "@/server/challenges";
import { resendSignupCode, verifySignup } from "../actions";

export const metadata: Metadata = { title: "Raqamni tasdiqlash", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string; next?: string }> }) {
  const { c = "", next = "" } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "";
  const challenge = await getOpenChallenge(c, "signup");

  return (
    <SiteShell>
      <AuthScreen
        eyebrow="Tasdiqlash"
        title={<>Kodni <em className="text-clay-400">kiriting.</em></>}
        note={challenge?.destination ? `${maskPhone(challenge.destination)} raqamiga 6 xonali kod yubordik.` : "Kod muddati tugagan."}
      >
        {challenge ? (
          <>
            <VerifyCodeForm action={verifySignup} challengeId={challenge.id} next={safe} />
            <div className="mt-6 flex flex-col gap-3">
              <ResendButton action={resendSignupCode} challengeId={challenge.id} label="Kodni qayta yuborish" secondsLeft={cooldownLeft(challenge)} />
              <Link href="/auth/signup" className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
                Raqamni o‘zgartirish
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-8 text-amber-900">
            <Link href="/auth/signup" className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
              Hisob yaratishni qaytadan boshlang
            </Link>
          </p>
        )}
      </AuthScreen>
    </SiteShell>
  );
}
