import { and, eq, lt, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { MAX_VIDEO_BYTES } from "@/lib/video";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { WINDOW, allow } from "@/server/rate-limit";
import { keyedHash } from "@/server/security";

/** All the clips one person may keep with us. */
const MAX_BYTES_PER_PERSON = 1024 * 1024 * 1024;

/**
 * Opens an upload for a clip of the given size. The file itself then arrives in parts through
 * PUT /api/video/:id, which is where its bytes are checked.
 */
export async function POST(request: Request) {
  const t = await getT();
  const fail = (error: string, status: number) => Response.json({ error }, { status });

  const user = await getCurrentUser();
  if (!user) return fail(t("err.signInFirst"), 401);
  const isCreator = user.role === "admin" || !!(await getCreatorForUser(user.id));
  if (!isCreator) return fail(t("err.needCreator"), 403);
  if (!(await allow("video-upload", keyedHash("user", user.id), 40, WINDOW.hour))) return fail(t("auth.a.tooMany"), 429);

  const body: unknown = await request.json().catch(() => null);
  const size = typeof body === "object" && body !== null && "size" in body ? body.size : null;
  if (typeof size !== "number" || !Number.isInteger(size) || size < 1) return fail(t("err.videoType"), 400);
  if (size > MAX_VIDEO_BYTES) return fail(t("err.videoBig", { mb: MAX_VIDEO_BYTES / 1024 / 1024 }), 413);

  // Housekeeping: uploads that never finished, and clips no recipe has used a day after they arrived.
  const mine = eq(schema.videoUploads.ownerId, user.id);
  const url = sql`'/api/video/' || ${schema.videoUploads.id}::text`;
  await db.delete(schema.videoUploads).where(
    and(
      mine,
      or(
        and(eq(schema.videoUploads.ready, false), lt(schema.videoUploads.createdAt, new Date(Date.now() - WINDOW.hour))),
        and(
          lt(schema.videoUploads.createdAt, new Date(Date.now() - WINDOW.day)),
          sql`not exists (select 1 from ${schema.recipeSteps} where ${schema.recipeSteps.videoUrl} = ${url})`,
          sql`not exists (select 1 from ${schema.recipes} where ${schema.recipes.videoUrl} = ${url})`,
        ),
      ),
    ),
  );

  const [{ used }] = await db.select({ used: sum(schema.videoUploads.size) }).from(schema.videoUploads).where(mine);
  if (Number(used ?? 0) + size > MAX_BYTES_PER_PERSON) return fail(t("err.videoLimit"), 413);

  const [row] = await db.insert(schema.videoUploads).values({ ownerId: user.id, size }).returning({ id: schema.videoUploads.id });
  return Response.json({ id: row.id });
}
