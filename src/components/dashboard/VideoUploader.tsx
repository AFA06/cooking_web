"use client";

import * as React from "react";
import { Link2, RefreshCw, RotateCw, Trash2, Video } from "lucide-react";
import { FileVideo } from "@/components/recipe/FileVideo";
import { useT } from "@/i18n/client";
import { MEDIA_RULES, maxMegabytes } from "@/lib/media";
import { UploadError, discardMedia, uploadMedia } from "@/lib/media-upload";
import { parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Told when an upload starts and ends, so the form can wait for it. */
  onBusy?: (busy: boolean) => void;
}

type Upload = { file: File; state: "sending" | "checking" | "failed"; progress: number; error?: string };

/**
 * Pick or drop a short clip, or paste a link to one. The file goes straight from the browser to
 * file storage; the creator sees how far along it is, can cancel, and can try again without picking
 * the file a second time. It only counts once the server has checked what arrived.
 */
export function VideoUploader({ value, onChange, label, onBusy }: Props) {
  const t = useT();
  const input = React.useRef<HTMLInputElement>(null);
  const running = React.useRef<AbortController | null>(null);
  const [upload, setUpload] = React.useState<Upload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [link, setLink] = React.useState("");

  React.useEffect(() => () => running.current?.abort(), []);

  // The clip being replaced or removed is dropped from storage, unless a saved recipe still shows it.
  const replace = (url: string) => {
    if (value && value !== url) discardMedia(value);
    onChange(url);
  };

  const send = async (file: File) => {
    const abort = new AbortController();
    running.current = abort;
    setError(null);
    setUpload({ file, state: "sending", progress: 0 });
    onBusy?.(true);
    try {
      const url = await uploadMedia("video", file, {
        signal: abort.signal,
        onProgress: (progress) => setUpload({ file, state: "sending", progress }),
        onChecking: () => setUpload({ file, state: "checking", progress: 1 }),
      });
      setUpload(null);
      replace(url);
    } catch (problem) {
      if (abort.signal.aborted) setUpload(null);
      // What the server refused will be refused again; anything else is worth another try with the same file.
      else if (problem instanceof UploadError) {
        setUpload(null);
        setError(problem.message);
      } else setUpload({ file, state: "failed", progress: 0, error: t("up.videoFail") });
    } finally {
      if (running.current === abort) running.current = null;
      onBusy?.(false);
    }
  };

  const take = (file: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!file || upload?.state === "sending" || upload?.state === "checking") return;
    if (!MEDIA_RULES.video.types.includes(file.type)) return setError(t("err.videoType"));
    if (file.size > MEDIA_RULES.video.maxBytes) return setError(t("err.videoBig", { mb: maxMegabytes("video") }));
    void send(file);
  };

  const video = value ? parseVideoUrl(value) : null;
  const percent = Math.round((upload?.progress ?? 0) * 100);
  const box = "flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 px-4 text-center";
  const textButton = "h-10 rounded-full px-3.5 text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800";

  return (
    <div>
      <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" tabIndex={-1} aria-label={label ?? t("up.video")} onChange={(e) => take(e.target.files?.[0])} />
      {upload?.state === "failed" ? (
        <div className={cn(box, "border-red-300 bg-amber-100")}>
          <p role="alert" className="text-sm font-medium text-red-700">{upload.error}</p>
          <div className="flex flex-wrap justify-center gap-1">
            <button type="button" onClick={() => void send(upload.file)} className="flex h-10 items-center gap-1.5 rounded-full bg-amber-700 px-4 text-sm font-semibold text-amber-50">
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              {t("up.retry")}
            </button>
            <button type="button" onClick={() => setUpload(null)} className={textButton}>{t("common.cancel")}</button>
          </div>
        </div>
      ) : upload ? (
        <div className={cn(box, "border-amber-300 bg-amber-100")}>
          <p className="text-sm font-semibold text-amber-950 tabular-nums" role="status">
            {upload.state === "checking" ? t("up.checking") : `${t("dialog.loading")} ${percent}%`}
          </p>
          <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-amber-300" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label ?? t("up.video")}>
            <div className="h-full rounded-full bg-amber-700 transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <button type="button" onClick={() => running.current?.abort()} className={textButton}>{t("common.cancel")}</button>
        </div>
      ) : value ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink">
          {video?.kind === "file" && <FileVideo src={video.src} label={label ?? t("up.video")} className="h-full w-full object-contain" />}
          {video && video.kind !== "file" && <iframe src={video.embedUrl} title={label ?? t("up.video")} loading="lazy" allowFullScreen className="h-full w-full" />}
          <div className="absolute right-2 top-2 flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className="flex h-10 items-center rounded-full bg-paper px-3 text-ink">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("up.replace")}</span>
            </button>
            <button type="button" onClick={() => replace("")} className="flex h-10 items-center rounded-full bg-ink/70 px-3 text-paper">
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
            take(e.dataTransfer.files?.[0]);
          }}
          className={cn(box, "gap-2 border-dashed transition-colors", dragging ? "border-amber-700 bg-amber-100" : "border-amber-300 bg-amber-100/50 hover:border-amber-700 hover:bg-amber-100")}
        >
          <Video className="h-6 w-6 text-amber-700" aria-hidden="true" />
          <span className="text-sm font-semibold text-amber-950">{t("up.video")}</span>
        </button>
      )}

      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}

      {!upload && !value && (
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
                  if (!/^https:\/\//i.test(link.trim()) || !parseVideoUrl(link)) return setError(t("ed.videoBad"));
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
