import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Become a creator",
  description: "Turn your recipes into step-by-step cooking guides your audience can actually cook.",
  alternates: { canonical: "/creators/join" },
};

export default function JoinPage() {
  return (
    <Container size="sm" className="py-14 sm:py-20">
      <h1 className="text-3xl sm:text-5xl font-serif font-medium text-amber-950">Become a creator</h1>
      <p className="mt-5 text-lg text-amber-800">
        Publish your recipes as structured, step-by-step guides with ingredients, timers and tips, share one link
        with your audience, and offer premium recipes.
      </p>
      <ul className="mt-8 space-y-3 text-amber-900 list-disc pl-5">
        <li>The first {PLATFORM_CONFIG.creator.foundingCreatorCount} creators join as founding partners.</li>
        <li>Founding creators pay no platform commission during the founding period.</li>
        <li>Recipe publishing is being built and is not open yet.</li>
      </ul>
      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Button size="lg" disabled title="Applications are not open yet">
          Applications opening soon
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/creators">See current creators</Link>
        </Button>
      </div>
    </Container>
  );
}
