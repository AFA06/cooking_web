import { Navigation } from "@/components/landing/Navigation";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CreatorSection } from "@/components/landing/CreatorSection";
import { FeaturedRecipes } from "@/components/landing/FeaturedRecipes";
import { CookingExperience } from "@/components/landing/CookingExperience";
import { FreeVsPremium } from "@/components/landing/FreeVsPremium";
import { CreatorCTA } from "@/components/landing/CreatorCTA";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="flex-1">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <CreatorSection />
        <FeaturedRecipes />
        <CookingExperience />
        <FreeVsPremium />
        <CreatorCTA />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}