"use client";

import * as React from "react";
import { ImagePlus, Link2, RefreshCw, Trash2 } from "lucide-react";
import { uploadImage } from "@/app/media/actions";
import { useT } from "@/i18n/client";
import { resizeToJpeg } from "@/lib/image-resize";
import { UploadError, discardMedia, uploadMedia } from "@/lib/media-upload";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Shape of the picture box. */
  shape?: "wide" | "square";
  /** Smaller box and no link field, for rows of photos. */
  compact?: boolean;
  label?: string;
  /** Keep the photo in private file storage, shown only to people who may see the recipe step it is on. */
  stored?: boolean;
  /** Told when an upload starts and ends, so the form can wait for it. */
  onBusy?: (busy: boolean) => void;
}

const jpegBlob = (base64: string) => new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: "image/jpeg" });

/**
 * Pick, drop or paste a photo. It is resized in the browser and stored on our side, so the
 * creator gets a permanent link without needing a hosting account.
 */
export function ImageUploader({ value, onChange, shape = "wide", compact = false, label, stored = false, onBusy }: Props) {
  const t = useT();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [link, setLink] = React.useState("");

  const unmounted = React.useRef(new AbortController());
  React.useEffect(() => {
    const controller = unmounted.current;
    return () => controller.abort();
  }, []);

  // The photo being replaced or removed is dropped from storage, unless a saved recipe still shows it.
  const replace = (url: string) => {
    if (value && value !== url) discardMedia(value);
    onChange(url);
  };

  const take = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(null);
    setBusy(true);
    onBusy?.(true);
    try {
      const base64 = await resizeToJpeg(file);
      let result: { url: string } | { error: string };
      if (stored) {
        try {
          result = { url: await uploadMedia("image", jpegBlob(base64), { signal: unmounted.current.signal }) };
        } catch (problem) {
          // Until file storage is set up, photos are kept the old way.
          if (!(problem instanceof UploadError && problem.code === "storage_off")) throw problem;
          result = await uploadImage(base64);
        }
      } else {
        result = await uploadImage(base64);
      }
      if ("error" in result) setError(result.error);
      else replace(result.url);
    } catch (problem) {
      if (!unmounted.current.signal.aborted) setError(problem instanceof UploadError ? problem.message : t("review.photoFail"));
    } finally {
      setBusy(false);
      onBusy?.(false);
      if (input.current) input.current.value = "";
    }
  };

  const box = shape === "wide" ? "aspect-[16/10]" : "aspect-square";

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={label ?? t("up.upload")} onChange={(e) => take(e.target.files?.[0])} />
      {value ? (
        <div className={cn("group relative overflow-hidden rounded-2xl bg-amber-100", box)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- creator's own preview, any host */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-ink/60 text-sm font-medium text-paper">{t("dialog.loading")}</div>}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-ink/80 to-transparent p-2.5 pt-8">
            <button type="button" onClick={() => input.current?.click()} className="flex h-10 items-center gap-1.5 rounded-full bg-paper px-3.5 text-sm font-semibold text-ink">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {compact ? <span className="sr-only">{t("up.replace")}</span> : t("up.replace")}
            </button>
            <button type="button" onClick={() => replace("")} className="flex h-10 items-center gap-1.5 rounded-full bg-ink/70 px-3.5 text-sm font-semibold text-paper">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {compact ? <span className="sr-only">{t("up.remove")}</span> : t("up.remove")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void take(e.dataTransfer.files?.[0]);
          }}
          disabled={busy}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition-colors",
            box,
            dragging ? "border-amber-700 bg-amber-100" : "border-amber-300 bg-amber-100/50 hover:border-amber-700 hover:bg-amber-100",
          )}
        >
          <ImagePlus className={cn("text-amber-700", compact ? "h-6 w-6" : "h-9 w-9")} aria-hidden="true" />
          <span className={cn("font-semibold text-amber-950", compact ? "text-sm" : "text-lg")}>{busy ? t("dialog.loading") : t("up.upload")}</span>
          {!compact && <span className="text-sm text-amber-600">{t("up.drop")}</span>}
        </button>
      )}

      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}

      {!compact && (
        <div className="mt-2">
          {linkOpen ? (
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
                aria-label={t("up.orLink")}
                className="h-11 min-w-0 flex-1 rounded-xl border border-amber-300 bg-amber-100 px-3 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (/^https?:\/\//i.test(link.trim())) {
                    onChange(link.trim());
                    setLink("");
                    setLinkOpen(false);
                  }
                }}
                className="h-11 rounded-xl border border-amber-300 px-4 text-sm font-semibold text-amber-950 hover:border-amber-950"
              >
                {t("up.useLink")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {t("up.orLink")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
