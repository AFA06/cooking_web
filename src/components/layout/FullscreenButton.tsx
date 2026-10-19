"use client";

import * as React from "react";
import { Maximize, Minimize } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/*
 * Full screen hides the browser's tabs and address bar. It covers the whole document, so it stays on while
 * people move between pages. Safari on iPad still uses the webkit-prefixed API, and iPhone Safari can't put a
 * page in full screen at all, so the button only shows where it works.
 */
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenEnabled?: boolean };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const doc = () => document as FsDocument;
const isFull = () => !!(doc().fullscreenElement ?? doc().webkitFullscreenElement);
const isSupported = () => !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}

async function toggle() {
  try {
    if (isFull()) await (document.exitFullscreen?.() ?? doc().webkitExitFullscreen?.());
    else {
      const root = document.documentElement as FsElement;
      await (root.requestFullscreen?.({ navigationUI: "hide" }) ?? root.webkitRequestFullscreen?.());
    }
  } catch {
    // Refused by the browser (e.g. not started by a tap): nothing changes and nothing breaks.
  }
}

export function FullscreenButton({ className }: { className?: string }) {
  const t = useT();
  const supported = React.useSyncExternalStore(subscribe, isSupported, () => false);
  const full = React.useSyncExternalStore(subscribe, isFull, () => false);
  if (!supported) return null;
  const label = full ? t("nav.exitFullscreen") : t("nav.fullscreen");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={full}
      aria-label={label}
      title={label}
      className={cn("flex h-10 w-10 items-center justify-center rounded-full text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700", className)}
    >
      {full ? <Minimize className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" /> : <Maximize className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />}
    </button>
  );
}
