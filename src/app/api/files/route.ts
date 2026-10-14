import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { requestUpload, sweepUnusedMedia } from "@/server/media";
import { WINDOW, allow } from "@/server/rate-limit";
import { keyedHash } from "@/server/security";
import { getStorage } from "@/server/storage";

/**
 * Opens an upload: a creator says what file they are about to send and gets a link that takes
 * exactly that file, straight from their browser to storage. See server/media for the rules.
 */
export async function POST(request: Request) {
  const t = await getT();
  const fail = (error: string, status: number, code?: string) => Response.json({ error, code }, { status });

  const user = await getCurrentUser();
  if (!user) return fail(t("err.signInFirst"), 401);
  const isCreator = user.role === "admin" || !!(await getCreatorForUser(user.id));
  if (!isCreator) return fail(t("err.needCreator"), 403);
  const storage = getStorage();
  if (!storage) return fail(t("err.storageOff"), 503, "storage_off");
  if (!(await allow("file-upload", keyedHash("user", user.id), 80, WINDOW.hour))) return fail(t("auth.a.tooMany"), 429);

  const body: unknown = await request.json().catch(() => null);
  const file = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  await sweepUnusedMedia(storage, null);
  const result = await requestUpload(storage, user, { kind: file.kind, size: file.size, type: file.type });
  if ("error" in result) return fail(t(result.error, result.values), 400);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
