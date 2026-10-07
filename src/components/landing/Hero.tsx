import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-gradient-to-b from-amber-50 via-white to-amber-50"
      aria-labelledby="hero-heading"
    >
      <Container size="lg">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-amber-950 leading-tight tracking-tight"
            >
              Stop going back to YouTube{" "}
              <span className="text-amber-700">while you&rsquo;re cooking.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-amber-700 leading-relaxed max-w-xl">
              {PLATFORM_CONFIG.tagline}. Designed to guide you from the first
              ingredient to the finished dish — no messy phone, no missed steps.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="xl" asChild>
                <a href={PLATFORM_CONFIG.urls.recipes}>Explore Recipes</a>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href={PLATFORM_CONFIG.urls.becomeCreator}>Become a Creator</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-amber-600/80">
              Free recipes available. Premium recipes unlock detailed guidance,
              timers, and creator tips.
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-amber-100">
              <Image
                src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80"
                alt="Cooking app interface showing step-by-step guided cooking experience with timer and ingredients"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/30 via-transparent to-transparent" />
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-amber-600">
              <div className="flex -space-x-2">
                {["👨‍🍳", "👩‍🍳", "🧑‍🍳", "👨‍🍳"].map((emoji, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 rounded-full bg-white border-2 border-amber-50 flex items-center justify-center text-base"
                    aria-hidden="true"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="font-medium">
                12 creators already sharing recipes
              </span>
            </div>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg
          className="w-6 h-6 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}