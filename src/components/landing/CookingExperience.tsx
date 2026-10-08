"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StepTimer } from "@/components/recipe/StepTimer";
import { PLATFORM_CONFIG } from "@/lib/constants";

const DEMO = [
  {
    n: 4,
    title: "Piyozni qovuring",
    text: "Qozonda yog‘ni qizdiring. Piyozni qo‘shing va o‘rtacha olovda 7 daqiqa tillarang bo‘lguncha qovuring.",
    seconds: 7 * 60,
    tip: "Shoshilmang — tillarang piyoz oshning asosiy ta’mi.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&q=80",
    items: ["2 ta katta piyoz", "100 ml o‘simlik yog‘i"],
  },
  {
    n: 5,
    title: "Go‘shtni qo‘shing",
    text: "Go‘shtni piyozga soling. Olovni kuchaytiring va hamma tomonini 5 daqiqa qizartiring. Qozonni to‘ldirib yubormang.",
    seconds: 5 * 60,
    tip: "Go‘shtni qo‘shishdan oldin quriting — namlik qizarishga xalaqit beradi.",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=1000&q=80",
    items: ["500 g qo‘y go‘shti", "1 choy qoshiq tuz"],
  },
];

export function CookingExperience() {
  const [i, setI] = React.useState(0);
  const step = DEMO[i];

  return (
    <section className="bg-amber-950 py-20 text-amber-50 lg:py-28" aria-labelledby="cook-heading">
      <Container size="xl" className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">Qadam-baqadam rejim</p>
          <h2 id="cook-heading" className="mt-4 text-3xl font-medium sm:text-5xl">Oshxonada yoningizda turgan sokin yordamchi.</h2>
          <p className="mt-6 max-w-lg text-lg text-amber-100/90">
            Katta matn, kerakli masalliqlar, kerak joyda taymer va bitta tugma. Videoni qidirish shart emas.
          </p>
          <Button size="lg" className="mt-8 bg-amber-50 text-amber-950 hover:bg-white" asChild>
            <Link href={PLATFORM_CONFIG.urls.recipes}>Haqiqiy retseptni sinash</Link>
          </Button>
        </div>

        <div className="bg-amber-50 text-amber-950">
          <div className="relative aspect-[16/9] bg-amber-200">
            <Image key={step.image} src={step.image} alt={step.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Namuna · Qadam {step.n} / 8</p>
            <h3 className="mt-2 text-2xl font-medium sm:text-3xl">{step.title}</h3>
            <p className="mt-3 text-lg leading-relaxed">{step.text}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-amber-600">
              {step.items.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <div className="mt-5"><StepTimer key={i} seconds={step.seconds} /></div>
            <p className="mt-4 border-l-2 border-amber-700 pl-3 text-sm text-amber-900">Maslahat: {step.tip}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setI(0)} disabled={i === 0}>Orqaga</Button>
              <Button onClick={() => setI(1)} disabled={i === DEMO.length - 1}>Keyingi</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
