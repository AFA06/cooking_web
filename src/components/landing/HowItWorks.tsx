import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PLATFORM_CONFIG } from "@/lib/constants";

const STEPS = [
  {
    number: "01",
    title: "Find a recipe",
    description:
      "Browse recipes from creators you trust. Filter by cuisine, difficulty, time, or dietary needs. Every recipe has a clear preview so you know what you're getting.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
    imageAlt: "Recipe discovery screen showing Uzbek plov, lagman, and samsa recipes",
  },
  {
    number: "02",
    title: "Prepare your ingredients",
    description:
      "See exact quantities, prep notes, and all ingredients organized by step. Tap to check off items. No more guessing or missing ingredients halfway through.",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&q=80",
    imageAlt: "Ingredients list with checkboxes and exact measurements",
  },
  {
    number: "03",
    title: "Cook step by step",
    description:
      "One clear instruction at a time. Large text, relevant photos, built-in timers, temperature guides, and creator tips. Swipe or tap to advance — no scrolling through videos.",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80",
    imageAlt: "Guided cooking mode showing step 4 of 10 with timer and instruction",
  },
  {
    number: "04",
    title: "Finish with confidence",
    description:
      "Complete the recipe and save your notes. Track what you've cooked, revisit favorites, and build your personal cookbook. Share results with the creator.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80",
    imageAlt: "Finished dish photo with cooking completion screen",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-amber-50" aria-labelledby="howitworks-heading">
      <Container size="lg">
        <header className="text-center max-w-2xl mx-auto mb-16">
          <h2 id="howitworks-heading" className="text-3xl sm:text-4xl font-serif font-medium text-amber-950">
            How it works
          </h2>
          <p className="mt-4 text-amber-700 text-lg">
            Four simple steps from discovering a recipe to enjoying your meal.
          </p>
        </header>

        <div className="space-y-16">
          {STEPS.map((step, index) => (
            <article
              key={step.number}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <div
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-amber-100 ${
                  index % 2 === 1 ? "lg:col-start-2" : ""
                }`}
              >
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div
                className={`${
                  index % 2 === 1 ? "lg:col-start-1" : ""
                } text-center lg:text-left`}
              >
                <span className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                  Step {step.number}
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-serif font-medium text-amber-950">
                  {step.title}
                </h3>
                <p className="mt-4 text-amber-700 leading-relaxed">{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" asChild>
            <a href={PLATFORM_CONFIG.urls.recipes}>Try it yourself →</a>
          </Button>
        </div>
      </Container>
    </section>
  );
}