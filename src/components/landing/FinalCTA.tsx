import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="final-cta-heading">
      <Container size="md">
        <div className="text-center max-w-3xl mx-auto">
          <h2 id="final-cta-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
            Ready to cook something?
          </h2>
          <p className="mt-4 text-amber-700 text-lg">
            Discover recipes from creators you trust. Start cooking with
            confidence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" className="w-full sm:w-auto" asChild>
              <a href={PLATFORM_CONFIG.urls.recipes}>Explore Recipes</a>
            </Button>
          </div>

          <Separator className="my-12" />

          <div className="text-center">
            <p className="text-amber-700 mb-4">
              Have recipes people love? Build your guided cooking library.
            </p>
            <Button variant="outline" size="lg" asChild>
              <a href={PLATFORM_CONFIG.urls.becomeCreator}>Become a Creator</a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}