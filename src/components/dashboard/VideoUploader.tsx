"use client";

import * as React from "react";
import { Link2, RefreshCw, Trash2, Video } from "lucide-react";
import { useT } from "@/i18n/client";
import { MAX_VIDEO_BYTES, VIDEO_PART_BYTES, parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Shown before the clip plays. */
  poster?: string;
  label?: string;
}

/** A failure the server explained in the creator's language. */
class UploadError extends Error {}

async function send(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : null;
    if (message && response.status < 500) throw new UploadError(message);
    throw new Error("upload failed");
  }
  return body;
}

/**
 * Pick or drop a short clip, or paste a link to one. The file is sent in small parts, so a weak
 * connection only has to repeat the part it dropped, and the creator sees how far along it is.
 */
export function VideoUploader({ value, onChange, poster, label }: Props) {
  const t = useT();
  const input = React.useRef<HTMLInputElement>(null);
  const running = React.useRef<AbortController | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [link, setLink] = React.useState("");

  React.useEffect(() => () => running.current?.abort(), []);

  const take = async (file: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError(t("err.videoType"));
    if (file.size > MAX_VIDEO_BYTES) return setError(t("err.videoBig", { mb: MAX_VIDEO_BYTES / 1024 / 1024 }));

    const abort = new AbortController();
    running.current = abort;
    setError(null);
    setProgress(0);
    try {
      const { id } = (await send("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size }),
        signal: abort.signal,
      })) as { id: string };
      const parts = Math.ceil(file.size / VIDEO_PART_BYTES);
      for (let part = 0; part < parts; part++) {
        const piece = file.slice(part * VIDEO_PART_BYTES, (part + 1) * VIDEO_PART_BYTES);
        for (let attempt = 1; ; attempt++) {
          try {
            await send(`/api/video/${id}?part=${part}`, { method: "PUT", body: piece, signal: abort.signal });
            break;
          } catch (problem) {
            if (problem instanceof UploadError || abort.signal.aborted || attempt === 3) throw problem;
          }
        }
        setProgress((part + 1) / parts);
      }
      onChange(`/api/video/${id}`);
    } catch (problem) {
      if (!abort.signal.aborted) setError(problem instanceof UploadError ? problem.message : t("up.videoFail"));
    } finally {
      if (running.current === abort) running.current = null;
      setProgress(null);
    }
  };

  const video = value ? parseVideoUrl(value) : null;
  const busy = progress !== null;
  const percent = Math.round((progress ?? 0) * 100);

  return (
    <div>
      <input ref={input} type="file" accept="video/*" className="sr-only" tabIndex={-1} aria-label={label ?? t("up.video")} onChange={(e) => take(e.target.files?.[0])} />
      {busy ? (
        <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 text-center">
          <p className="text-sm font-semibold text-amber-950 tabular-nums" role="status">
            {t("dialog.loading")} {percent}%
          </p>
          <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-amber-300" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label ?? t("up.video")}>
            <div className="h-full rounded-full bg-amber-700 transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <button type="button" onClick={() => running.current?.abort()} className="h-10 rounded-full px-3.5 text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            {t("common.cancel")}
          </button>
        </div>
      ) : value ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink">
          {video?.kind === "file" && <video src={video.src} poster={poster || undefined} controls preload="metadata" playsInline className="h-full w-full object-contain" />}
          {video && video.kind !== "file" && <iframe src={video.embedUrl} title={label ?? t("up.video")} loading="lazy" allowFullScreen className="h-full w-full" />}
          <div className="absolute right-2 top-2 flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className="flex h-10 items-center rounded-full bg-paper px-3 text-ink">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("up.replace")}</span>
            </button>
            <button type="button" onClick={() => onChange("")} className="flex h-10 items-center rounded-full bg-ink/70 px-3 text-paper">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("up.remove")}</span>
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
          className={cn(
            "flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition-colors",
            dragging ? "border-amber-700 bg-amber-100" : "border-amber-300 bg-amber-100/50 hover:border-amber-700 hover:bg-amber-100",
          )}
        >
          <Video className="h-6 w-6 text-amber-700" aria-hidden="true" />
          <span className="text-sm font-semibold text-amber-950">{t("up.video")}</span>
        </button>
      )}

      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}

      {!busy && !value && (
        <div className="mt-2">
          {linkOpen ? (
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://youtu.be/…"
                aria-label={t("up.videoLink")}
                className="h-11 min-w-0 flex-1 rounded-xl border border-amber-300 bg-amber-100 px-3 text-amber-950 placeholder:text-amber-500 focus:border-amber-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!parseVideoUrl(link)) return setError(t("ed.videoBad"));
                  setError(null);
                  onChange(link.trim());
                  setLink("");
                  setLinkOpen(false);
                }}
                className="h-11 rounded-xl border border-amber-300 px-4 text-sm font-semibold text-amber-950 hover:border-amber-950"
              >
                {t("up.useLink")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 underline underline-offset-4 hover:text-amber-800">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {t("up.videoLink")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
