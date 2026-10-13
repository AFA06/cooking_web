import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, lt, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { MEDIA_RULES, fileUrl, maxMegabytes, sniffMedia, storedType, type MediaKind } from "@/lib/media";
import { hasPurchased } from "@/server/access";
import type { ObjectStorage } from "@/server/storage";

/** Who is asking. Always taken from the session, never from the request. */
export interface Actor {
  id: string;
  role: "user" | "creator" | "admin";
}

/** A refusal, as a dictionary key (and its values) for the caller to translate. */
export interface MediaError {
  error: string;
  values?: Record<string, number>;
}

const UPLOAD_LINK_SECONDS = 10 * 60;
const READ_LINK_SECONDS = 10 * 60;
/** All the files one person may keep with us. */
const MAX_BYTES_PER_PERSON = 5 * 1024 * 1024 * 1024;
/** A file nobody saved into a recipe is removed after this long. */
const UNUSED_AFTER_MS = 24 * 60 * 60_000;

type Asset = typeof schema.mediaAssets.$inferSelect;

/** Removes stored files and then their rows. A file that cannot be deleted keeps its row, so a later sweep tries again. */
export async function removeAssets(storage: ObjectStorage, assets: Pick<Asset, "id" | "objectKey">[]): Promise<void> {
  for (const asset of assets) {
    try {
      await storage.delete(asset.objectKey);
      await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, asset.id));
    } catch {
      // Left for the sweep.
    }
  }
}

/**
 * Removes one person's files that sit on no step for a day: uploaded but never saved into a recipe.
 * With `ownerId` null it does the same for files whose uploader's account is gone.
 */
export async function sweepUnusedMedia(storage: ObjectStorage, ownerId: string | null, olderThanMs = UNUSED_AFTER_MS): Promise<number> {
  const stale = await db
    .select({ id: schema.mediaAssets.id, objectKey: schema.mediaAssets.objectKey })
    .from(schema.mediaAssets)
    .where(
      and(
        ownerId ? eq(schema.mediaAssets.ownerId, ownerId) : isNull(schema.mediaAssets.ownerId),
        isNull(schema.mediaAssets.stepId),
        lt(schema.mediaAssets.updatedAt, new Date(Date.now() - olderThanMs)),
      ),
    )
    .limit(25);
  await removeAssets(storage, stale);
  return stale.length;
}

/**
 * Step one of an upload: the creator says what they are about to send, and gets a link that accepts
 * exactly that. Nothing is trusted yet; the file only counts after `completeUpload` has looked at it.
 * The file belongs to the uploader alone until a recipe they may edit is saved with it.
 */
export async function requestUpload(
  storage: ObjectStorage,
  actor: Actor,
  file: { kind: unknown; size: unknown; type: unknown },
): Promise<MediaError | { id: string; uploadUrl: string; contentType: string }> {
  if (file.kind !== "image" && file.kind !== "video") return { error: "err.mediaInvalid" };
  const kind: MediaKind = file.kind;
  const tooBig: MediaError = { error: kind === "video" ? "err.videoBig" : "err.photoBigMb", values: { mb: maxMegabytes(kind) } };
  const stored = typeof file.type === "string" ? storedType(kind, file.type) : null;
  if (!stored) return { error: kind === "video" ? "err.videoType" : "err.photoFormat" };
  if (typeof file.size !== "number" || !Number.isInteger(file.size) || file.size < 1) return { error: "err.mediaInvalid" };
  if (file.size > MEDIA_RULES[kind].maxBytes) return tooBig;

  await sweepUnusedMedia(storage, actor.id);
  const [{ used }] = await db.select({ used: sum(schema.mediaAssets.size) }).from(schema.mediaAssets).where(eq(schema.mediaAssets.ownerId, actor.id));
  if (Number(used ?? 0) + file.size > MAX_BYTES_PER_PERSON) return { error: "err.videoLimit" };

  // The address in storage is ours alone: nothing the browser sent is part of it.
  const id = randomUUID();
  const objectKey = `uploads/${actor.id}/${id}.${stored.extension}`;
  await db.insert(schema.mediaAssets).values({ id, ownerId: actor.id, kind, objectKey, contentType: stored.contentType, size: file.size });
  const uploadUrl = await storage.createUploadUrl(objectKey, { contentType: stored.contentType, size: file.size }, UPLOAD_LINK_SECONDS);
  return { id, uploadUrl, contentType: stored.contentType };
}

/**
 * Step two: the browser says the file is up. We look at what actually arrived (its size and its
 * first bytes) and only then mark it ready. Anything else is deleted on the spot.
 */
export async function completeUpload(storage: ObjectStorage, actor: Actor, id: string): Promise<MediaError | { url: string }> {
  const [asset] = await db
    .select()
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.id, id), eq(schema.mediaAssets.ownerId, actor.id)))
    .limit(1);
  if (!asset) return { error: "err.uploadMissing" };
  if (asset.status === "ready") return { url: fileUrl(asset.id) };

  const reject = async (error: MediaError): Promise<MediaError> => {
    await removeAssets(storage, [asset]);
    return error;
  };
  const stored = await storage.head(asset.objectKey);
  if (!stored) {
    await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, asset.id));
    return { error: "err.uploadMissing" };
  }
  if (stored.size !== asset.size || stored.size > MEDIA_RULES[asset.kind].maxBytes) {
    return reject({ error: asset.kind === "video" ? "err.videoBig" : "err.photoBigMb", values: { mb: maxMegabytes(asset.kind) } });
  }
  const actual = sniffMedia(await storage.readStart(asset.objectKey, 32));
  if (!actual || actual.kind !== asset.kind || actual.contentType !== asset.contentType) {
    return reject({ error: asset.kind === "video" ? "err.videoType" : "err.photoFormat" });
  }

  await db.update(schema.mediaAssets).set({ status: "ready", size: stored.size, updatedAt: new Date() }).where(eq(schema.mediaAssets.id, asset.id));
  return { url: fileUrl(asset.id) };
}

/** The uploader throws away a file they never saved into a recipe (cancelled, replaced or removed before saving). */
export async function discardUpload(storage: ObjectStorage, actor: Actor, id: string): Promise<void> {
  const [asset] = await db
    .select({ id: schema.mediaAssets.id, objectKey: schema.mediaAssets.objectKey })
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.id, id), eq(schema.mediaAssets.ownerId, actor.id), isNull(schema.mediaAssets.recipeId)))
    .limit(1);
  if (asset) await removeAssets(storage, [asset]);
}

/**
 * May this visitor see the file? Decided here from the database, for every request:
 *   - whoever uploaded it, the recipe's creator and admins always may;
 *   - everyone may once it sits on a published recipe that is free, or on a step its creator opened;
 *   - a premium step's file needs a paid purchase.
 * Returns where the file is, or null (the caller answers "not found" either way, so nothing leaks).
 */
export async function authorizeView(actor: Actor | null, id: string): Promise<{ objectKey: string } | null> {
  const [row] = await db
    .select({
      objectKey: schema.mediaAssets.objectKey,
      ownerId: schema.mediaAssets.ownerId,
      recipeId: schema.recipes.id,
      recipeStatus: schema.recipes.status,
      isPremium: schema.recipes.isPremium,
      creatorUserId: schema.creators.userId,
      stepIsFree: schema.recipeSteps.isFree,
    })
    .from(schema.mediaAssets)
    .leftJoin(schema.recipeSteps, eq(schema.mediaAssets.stepId, schema.recipeSteps.id))
    .leftJoin(schema.recipes, eq(schema.recipeSteps.recipeId, schema.recipes.id))
    .leftJoin(schema.creators, eq(schema.recipes.creatorId, schema.creators.id))
    .where(and(eq(schema.mediaAssets.id, id), eq(schema.mediaAssets.status, "ready")))
    .limit(1);
  if (!row) return null;
  const allowed = { objectKey: row.objectKey };

  if (actor && (actor.role === "admin" || actor.id === row.ownerId || actor.id === row.creatorUserId)) return allowed;
  if (!row.recipeId || row.recipeStatus !== "published") return null;
  if (!row.isPremium || row.stepIsFree) return allowed;
  if (actor && (await hasPurchased(actor.id, row.recipeId))) return allowed;
  return null;
}

/** A short-lived link to a file the visitor may see, or null. */
export async function createViewUrl(storage: ObjectStorage, actor: Actor | null, id: string): Promise<string | null> {
  const allowed = await authorizeView(actor, id);
  return allowed ? storage.createReadUrl(allowed.objectKey, READ_LINK_SECONDS) : null;
}

export interface StepMediaRef {
  stepId: string;
  kind: MediaKind;
  assetId: string;
}

/**
 * Checks, before a recipe is written, that every uploaded file its steps name may be used there:
 * it is ready, it is the right kind, it is used once, and it is either already on this recipe or
 * still unclaimed and uploaded by the person saving.
 */
export async function checkStepMedia(actor: Actor, recipeId: string | null, wanted: { kind: MediaKind; assetId: string }[]): Promise<boolean> {
  if (wanted.length === 0) return true;
  const ids = wanted.map((w) => w.assetId);
  if (new Set(ids).size !== ids.length) return false;
  const assets = await db.select().from(schema.mediaAssets).where(inArray(schema.mediaAssets.id, ids));
  const byId = new Map(assets.map((a) => [a.id, a]));
  return wanted.every(({ kind, assetId }) => {
    const asset = byId.get(assetId);
    if (!asset || asset.status !== "ready" || asset.kind !== kind) return false;
    return asset.recipeId ? asset.recipeId === recipeId : asset.ownerId === actor.id;
  });
}

/**
 * After a recipe is written: ties each file to its step by id, and removes the files the recipe
 * no longer uses. The old file goes only now, once the recipe that replaced it is safely saved.
 */
export async function attachStepMedia(storage: ObjectStorage | null, recipeId: string, refs: StepMediaRef[]): Promise<void> {
  const current = await db
    .select({ id: schema.mediaAssets.id, objectKey: schema.mediaAssets.objectKey })
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.recipeId, recipeId));
  const keep = new Set(refs.map((r) => r.assetId));
  const dropped = current.filter((a) => !keep.has(a.id));
  const now = new Date();

  if (current.length > 0) await db.update(schema.mediaAssets).set({ stepId: null, updatedAt: now }).where(eq(schema.mediaAssets.recipeId, recipeId));
  if (dropped.length > 0) {
    await db.update(schema.mediaAssets).set({ recipeId: null }).where(inArray(schema.mediaAssets.id, dropped.map((a) => a.id)));
    if (storage) await removeAssets(storage, dropped);
  }
  const [first, ...rest] = refs.map((ref) => db.update(schema.mediaAssets).set({ recipeId, stepId: ref.stepId, updatedAt: now }).where(eq(schema.mediaAssets.id, ref.assetId)));
  if (first) await db.batch([first, ...rest]);
}

/** Called before a recipe is deleted: its files, to be removed from storage once the recipe is gone. */
export async function listRecipeMedia(recipeId: string): Promise<Pick<Asset, "id" | "objectKey">[]> {
  return db.select({ id: schema.mediaAssets.id, objectKey: schema.mediaAssets.objectKey }).from(schema.mediaAssets).where(eq(schema.mediaAssets.recipeId, recipeId));
}
