import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CreatorProfileForm } from "@/components/dashboard/CreatorProfileForm";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Become a creator",
  description: "Turn your recipes into step-by-step cooking guides your audience can actually cook.",
  alternates: { canonical: "/creators/join" },
};
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const user = await getCurrentUser();
  if (user && (await getCreatorForUser(user.id))) redirect("/dashboard");

  return (
    <Container size="sm" className="py-14 sm:py-20">
      <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Become a creator</h1>
      <p className="mt-5 text-lg text-amber-800">
        Publish your recipes as structured, step-by-step guides with ingredients, timers and tips, share one link with
        your audience, and offer premium recipes.
      </p>
      <ul className="mt-8 space-y-3 text-amber-900 list-disc pl-5">
        <li>The first {PLATFORM_CONFIG.creator.foundingCreatorCount} creators join as founding partners.</li>
        <li>Founding creators pay no platform commission during the founding period.</li>
        <li>Premium recipes can be published now, but readers cannot pay for them until payments are added.</li>
      </ul>

      {user ? (
        <CreatorProfileForm defaultName={user.name} />
      ) : (
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/signup?next=/creators/join">Create an account to start</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login?next=/creators/join">I already have an account</Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
