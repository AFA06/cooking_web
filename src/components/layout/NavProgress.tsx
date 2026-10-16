"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin bar at the top of the screen that starts the moment an internal link is clicked and finishes when the
 * new page is in place. Pages are rendered on the server, and on a slow connection the next page can take a
 * second to arrive: without this, the click looks like it did nothing.
 */
function Bar() {
  const pathname = usePathname();
  const key = `${pathname}?${useSearchParams().toString()}`;
  // The address the click was made on. While it is still the current one, the next page is on its way.
  const [from, setFrom] = React.useState<string | null>(null);
  const keyRef = React.useRef(key);
  React.useEffect(() => {
    keyRef.current = key;
  }, [key]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Same page, or only a jump to an anchor: nothing to wait for.
      if (url.pathname === location.pathname && url.search === location.search) return;
      setFrom(keyRef.current);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const state = from === null ? "idle" : from === key ? "loading" : "done";
  React.useEffect(() => {
    if (state === "idle") return;
    // Fade out after arriving; and never leave a bar hanging if the navigation was cancelled.
    const id = setTimeout(() => setFrom(null), state === "done" ? 300 : 15000);
    return () => clearTimeout(id);
  }, [state]);

  if (state === "idle") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className={state === "loading" ? "nav-progress-run h-full bg-clay-400" : "nav-progress-done h-full bg-clay-400"} />
    </div>
  );
}

export function NavProgress() {
  return (
    <React.Suspense fallback={null}>
      <Bar />
    </React.Suspense>
  );
}
