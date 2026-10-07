import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function CreatorCTA() {
  return (
    <section className="py-20 lg:py-28 bg-amber-950 text-white" aria-labelledby="creator-cta-heading">
      <Container size="md">
        <div className="text-center max-w-3xl mx-auto">
          <h2 id="creator-cta-heading" className="text-3xl sm:text-4xl font-serif font-medium">
            Turn your recipes into something your audience can actually cook.
          </h2>
          <p className="mt-6 text-amber-200 text-lg leading-relaxed">
            You&rsquo;ve built an audience that trusts your cooking. Give them a better
            way to follow your recipes &mdash; structured, guided, and monetizable.
            Join the founding creators and pay 0% commission forever.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="secondary" className="w-full sm:w-auto" asChild>
              <a href={PLATFORM_CONFIG.urls.becomeCreator}>Join as a Founding Creator</a>
            </Button>
            <Button size="xl" variant="outline" className="w-full sm:w-auto border-amber-300 text-white hover:bg-amber-800" asChild>
              <a href={PLATFORM_CONFIG.urls.creators}>See current creators</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-amber-400">
            First 10 creators get founding status · 0% commission · You own your
            content
          </p>
        </div>
      </Container>
    </section>
  );
}