import { z } from "zod";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { completeUpload, createViewUrl, discardUpload } from "@/server/media";
import { getStorage } from "@/server/storage";

type Context = { params: Promise<{ id: string }> };

const validId = (id: string) => z.string().uuid().safeParse(id).success;

/**
 * Shows a stored photo or clip to someone allowed to see it, by sending their browser to a link
 * that works for a few minutes. Who may see it is decided on every request (server/media), and
 * the answer is never cached, so signing out or losing access takes effect at once.
 * "Not found" covers both a missing file and one the visitor may not see.
 */
export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const storage = getStorage();
  const url = storage && validId(id) ? await createViewUrl(storage, await getCurrentUser(), id) : null;
  if (!url) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}

/** The browser reports its upload done; the file is checked and, if it is what was announced, becomes usable. */
export async function POST(_: Request, { params }: Context) {
  const t = await getT();
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: t("err.signInFirst") }, { status: 401 });
  const storage = getStorage();
  if (!storage || !validId(id)) return Response.json({ error: t("err.uploadMissing") }, { status: 404 });
  const result = await completeUpload(storage, user, id);
  if ("error" in result) return Response.json({ error: t(result.error, result.values) }, { status: 400 });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

/** The uploader drops a file they never saved into a recipe. Files in use are only removed by saving the recipe without them. */
export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params;
  const user = await getCurrentUser();
  const storage = getStorage();
  if (user && storage && validId(id)) await discardUpload(storage, user, id);
  return new Response(null, { status: 204 });
}
