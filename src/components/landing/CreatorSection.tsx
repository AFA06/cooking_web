import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PLATFORM_CONFIG } from "@/lib/constants";

const BENEFITS = [
  {
    icon: "📝",
    title: "Publish recipes your way",
    description:
      "Structure your recipes with ingredients, steps, timers, tips, and media. Your recipes become guided cooking experiences, not just videos.",
  },
  {
    icon: "🔗",
    title: "One link to share everywhere",
    description:
      "Post one link on Instagram, TikTok, Telegram, YouTube. Your audience gets the full guided experience instantly — no app download required.",
  },
  {
    icon: "📊",
    title: "See what resonates",
    description:
      "Track views, starts, completions, and saves. Understand which recipes your audience actually cooks, not just watches.",
  },
  {
    icon: "💰",
    title: "Monetize premium content",
    description:
      "Offer free recipes to build trust. Premium recipes unlock detailed guidance, timers, and exclusive tips. You set the price, we handle the rest.",
  },
];

export function CreatorSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="creator-heading">
      <Container size="lg">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="sticky top-24">
            <Badge variant="founding" className="mb-4 inline-block">
              Founding creators: 0% commission
            </Badge>
            <h2 id="creator-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
              Your audience already loves your recipes.
              <br />
              Give them a better way to cook them.
            </h2>
            <p className="mt-6 text-amber-700 text-lg leading-relaxed">
              Join the first 10 founding creators and pay 0% platform commission
              forever. Build your recipe library, reach more home cooks, and earn
              from premium content.
            </p>
            <Button size="lg" className="mt-8 w-full sm:w-auto" asChild>
              <a href={PLATFORM_CONFIG.urls.becomeCreator}>Join as a Creator</a>
            </Button>
          </div>

          <div className="space-y-6">
            {BENEFITS.map((benefit, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-amber-950">{benefit.title}</h3>
                  <p className="mt-1 text-sm text-amber-700">{benefit.description}</p>
                </div>
              </div>
            ))}

            <div className="mt-8 p-5 rounded-xl bg-amber-950 text-white">
              <h3 className="font-semibold text-lg">Founding creator terms</h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-200">
                <li>• First 10 creators: 0% commission permanently</li>
                <li>• After founding phase: 10% platform commission</li>
                <li>• You own your content and audience relationship</li>
                <li>• Payouts monthly, transparent reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}