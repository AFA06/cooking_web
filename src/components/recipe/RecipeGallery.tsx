"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  url: string;
  alt: string;
}

const ZOOM = 2.2;
const SWIPE_DISTANCE = 48;

const roundButton =
  "flex h-11 w-11 items-center justify-center rounded-full bg-amber-50/95 text-amber-950 shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-40";

/** Horizontal swipe on touch screens; returns handlers to spread on the swipe surface. */
function useSwipe(onPrev: () => void, onNext: () => void, enabled = true) {
  const startX = React.useRef<number | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = enabled ? e.touches[0].clientX : null;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const delta = e.changedTouches[0].clientX - startX.current;
      startX.current = null;
      if (delta > SWIPE_DISTANCE) onPrev();
      else if (delta < -SWIPE_DISTANCE) onNext();
    },
  };
}

function Lightbox({ photos, index, onIndex, onClose }: { photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const [zoomed, setZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState("50% 50%");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const many = photos.length > 1;

  const go = React.useCallback(
    (delta: number) => {
      setZoomed(false);
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndex],
  );

  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && many) go(-1);
      else if (e.key === "ArrowRight" && many) go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, many, onClose]);

  const follow = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const swipe = useSwipe(() => go(-1), () => go(1), many && !zoomed);
  const photo = photos[index];

  return (
    <div role="dialog" aria-modal="true" aria-label="Rasmlar galereyasi" className="fixed inset-0 z-[100] flex flex-col bg-amber-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-amber-50 sm:px-6">
        <p className="text-sm tabular-nums" aria-live="polite">
          {index + 1} / {photos.length}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className={roundButton} onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed} aria-label={zoomed ? "Kichraytirish" : "Kattalashtirish"}>
            {zoomed ? <ZoomOut className="h-5 w-5" aria-hidden="true" /> : <ZoomIn className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button ref={closeRef} type="button" className={roundButton} onClick={onClose} aria-label="Yopish">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-4 sm:px-20" {...swipe}>
        <div
          className={cn("relative h-full w-full overflow-hidden", zoomed ? "cursor-zoom-out" : "cursor-zoom-in")}
          onClick={(e) => {
            follow(e as unknown as React.PointerEvent<HTMLDivElement>);
            setZoomed((z) => !z);
          }}
          onPointerMove={follow}
        >
          <Image
            key={photo.url}
            src={photo.url}
            alt={photo.alt}
            fill
            sizes="100vw"
            quality={90}
            className="object-contain transition-transform duration-300 ease-out"
            style={{ transform: zoomed ? `scale(${ZOOM})` : "scale(1)", transformOrigin: origin }}
          />
        </div>
        {many && (
          <>
            <button type="button" className={cn(roundButton, "absolute left-3 top-1/2 -translate-y-1/2 sm:left-5")} onClick={() => go(-1)} aria-label="Oldingi rasm">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className={cn(roundButton, "absolute right-3 top-1/2 -translate-y-1/2 sm:right-5")} onClick={() => go(1)} aria-label="Keyingi rasm">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-4 py-4 sm:justify-center">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => {
                setZoomed(false);
                onIndex(i);
              }}
              aria-label={`${i + 1}-rasm`}
              aria-current={i === index}
              className={cn("relative h-16 w-20 shrink-0 overflow-hidden rounded-lg transition-opacity", i === index ? "ring-2 ring-amber-50" : "opacity-50 hover:opacity-100")}
            >
              <Image src={p.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Recipe photos: a large stage with arrows and thumbnails, opening into a zoomable full-screen view. */
export function RecipeGallery({ photos, badge }: { photos: Photo[]; badge?: React.ReactNode }) {
  const [index, setIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const many = photos.length > 1;
  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);
  const swipe = useSwipe(() => go(-1), () => go(1), many);
  const photo = photos[index];

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-amber-100 lg:aspect-[5/4]" {...swipe}>
        <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 cursor-zoom-in" aria-label="Rasmni kattalashtirib ko‘rish">
          <Image key={photo.url} src={photo.url} alt={photo.alt} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="rise object-cover" />
        </button>
        {badge && <div className="pointer-events-none absolute left-4 top-4">{badge}</div>}
        <button type="button" onClick={() => setOpen(true)} className={cn(roundButton, "absolute right-4 top-4")} aria-label="To‘liq ekranda ochish">
          <Expand className="h-5 w-5" aria-hidden="true" />
        </button>
        {many && (
          <>
            <button type="button" className={cn(roundButton, "absolute left-4 top-1/2 -translate-y-1/2 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100")} onClick={() => go(-1)} aria-label="Oldingi rasm">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className={cn(roundButton, "absolute right-4 top-1/2 -translate-y-1/2 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100")} onClick={() => go(1)} aria-label="Keyingi rasm">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="absolute bottom-4 right-4 rounded-full bg-amber-950/75 px-3 py-1 text-xs font-medium tabular-nums text-amber-50 backdrop-blur-sm" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
          </>
        )}
      </div>

      {many && (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}-rasmni ko‘rsatish`}
              aria-current={i === index}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl transition-opacity sm:w-28",
                i === index ? "ring-2 ring-amber-950 ring-offset-2 ring-offset-amber-50" : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={p.url} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && <Lightbox photos={photos} index={index} onIndex={setIndex} onClose={() => setOpen(false)} />}
    </div>
  );
}
