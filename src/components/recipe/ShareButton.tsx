"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Uses the device share sheet where there is one, otherwise copies the link. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // The visitor closed the share sheet or denied clipboard access; nothing to report.
    }
  };

  return (
    <Button type="button" size="lg" variant="outline" onClick={share}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Havola nusxalandi" : "Ulashish"}</span>
    </Button>
  );
}
