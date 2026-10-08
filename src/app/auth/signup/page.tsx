import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCurrentUser } from "@/server/auth";
import { signup } from "../actions";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <SiteShell>
      <Container size="sm" className="py-14 sm:py-20 max-w-md">
        <h1 className="text-3xl font-serif font-medium text-amber-950">Create your account</h1>
        <p className="mt-2 text-amber-800">Save recipes and track what you cook.</p>
        <AuthForm mode="signup" action={signup} next={safe} />
      </Container>
    </SiteShell>
  );
}
