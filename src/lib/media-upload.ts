import { fileIdFromUrl, type MediaKind } from "@/lib/media";

/** A failure the server explained in the creator's language. `code` says why, when the caller can act on it. */
export class UploadError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

async function call(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init);
  const body = ((await response.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (!response.ok) {
    if (typeof body.error === "string" && response.status < 500) throw new UploadError(body.error);
    if (typeof body.error === "string" && body.code === "storage_off") throw new UploadError(body.error, "storage_off");
    throw new Error("upload failed");
  }
  return body;
}

/** Sends the file itself to storage. XMLHttpRequest, because fetch cannot report how much has gone up. */
function put(url: string, file: Blob, contentType: string, onProgress: (fraction: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("upload failed")));
    request.onerror = () => reject(new Error("upload failed"));
    request.onabort = () => reject(new DOMException("aborted", "AbortError"));
    request.onloadend = () => signal.removeEventListener("abort", abort);
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.send(file);
  });
}

/**
 * Uploads a photo or clip straight from the browser to file storage and returns how to refer to it.
 * It only resolves once the server has looked at the stored file and accepted it; if anything
 * fails or is cancelled on the way, what was sent is thrown away again.
 */
export async function uploadMedia(
  kind: MediaKind,
  file: Blob,
  options: { signal: AbortSignal; onProgress?: (fraction: number) => void; onChecking?: () => void },
): Promise<string> {
  const { id, uploadUrl, contentType } = (await call("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, size: file.size, type: file.type }),
    signal: options.signal,
  })) as { id: string; uploadUrl: string; contentType: string };
  try {
    await put(uploadUrl, file, contentType, options.onProgress ?? (() => {}), options.signal);
    options.onChecking?.();
    const { url } = (await call(`/api/files/${id}`, { method: "POST", signal: options.signal })) as { url: string };
    return url;
  } catch (problem) {
    void fetch(`/api/files/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    throw problem;
  }
}

/** Tells the server a file is no longer wanted. It is only deleted if no saved recipe uses it. */
export function discardMedia(url: string): void {
  const id = fileIdFromUrl(url);
  if (id) void fetch(`/api/files/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
}
