import { config } from "dotenv";
config({ path: ".env.local" });
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { ObjectStorage } from "../src/server/storage";

/**
 * Exercises uploaded step photos and clips end to end against the real database, with file storage
 * replaced by an in-memory stand-in: upload rules, who may attach a file to which step, that files
 * stay with their step through edits, clean-up, and who may view what. Everything it creates is
 * removed again. Run with: npm run test:media
 *
 * When the R2_* variables are set it also makes one round trip to the real bucket (see `live`).
 */
class FakeStorage implements ObjectStorage {
  objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  uploadLinks = 0;
  async createUploadUrl(key: string, file: { contentType: string; size: number }) {
    this.uploadLinks++;
    return `https://storage.invalid/${key}?size=${file.size}`;
  }
  /** What the browser does with an upload link. */
  put(url: string, bytes: Uint8Array, contentType: string) {
    this.objects.set(new URL(url).pathname.slice(1), { bytes, contentType });
  }
  async head(key: string) {
    const object = this.objects.get(key);
    return object ? { size: object.bytes.length, contentType: object.contentType } : null;
  }
  async readStart(key: string, bytes: number) {
    return this.objects.get(key)!.bytes.subarray(0, bytes);
  }
  async createReadUrl(key: string) {
    return `https://storage.invalid/read/${key}`;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
}

const pad = (head: number[], length: number) => {
  const bytes = new Uint8Array(length);
  bytes.set(head);
  return bytes;
};
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0], 2048);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 2048);
const MP4 = pad([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], 4096);
const HEIC = pad([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 4096);
const JUNK = pad([1, 2, 3, 4, 5, 6, 7, 8], 4096);
const MB = 1024 * 1024;

async function main() {
  const { db, schema } = await import("../src/db");
  const { eq, inArray, like } = await import("drizzle-orm");
  const media = await import("../src/server/media");
  const { persistRecipe, loadRecipeForEdit } = await import("../src/server/recipe-write");
  const { recipeInputSchema } = await import("../src/lib/recipe-schema");
  const { fileIdFromUrl, sniffMedia } = await import("../src/lib/media");
  const { createS3Storage, getStorage } = await import("../src/server/storage");

  const tag = `media-test-${Date.now()}`;
  const storage = new FakeStorage();
  const ok = (text: string) => console.log("  ✓", text);

  const person = async (name: string, role: "user" | "creator" | "admin" = "user") => {
    const [u] = await db.insert(schema.users).values({ email: `${tag}-${name}@example.com`, name: `${tag} ${name}`, passwordHash: "x", role }).returning({ id: schema.users.id });
    return { id: u.id, role };
  };
  const chefA = await person("chef-a", "creator");
  const chefB = await person("chef-b", "creator");
  const buyer = await person("buyer");
  const stranger = await person("stranger");
  const admin = await person("admin", "admin");
  const [creatorA] = await db.insert(schema.creators).values({ userId: chefA.id, slug: `${tag}-a`, name: "A" }).returning({ id: schema.creators.id });
  const [creatorB] = await db.insert(schema.creators).values({ userId: chefB.id, slug: `${tag}-b`, name: "B" }).returning({ id: schema.creators.id });

  /** The whole browser flow for one file: ask, send, confirm. */
  const upload = async (actor: typeof chefA, kind: "image" | "video", bytes: Uint8Array, type: string, sent: Uint8Array = bytes) => {
    const opened = await media.requestUpload(storage, actor, { kind, size: bytes.length, type });
    if ("error" in opened) return opened;
    storage.put(opened.uploadUrl, sent, opened.contentType);
    return media.completeUpload(storage, actor, opened.id);
  };
  const uploaded = async (...args: Parameters<typeof upload>) => {
    const result = await upload(...args);
    assert.ok("url" in result, `upload accepted, got ${JSON.stringify(result)}`);
    return result.url;
  };
  type StepIn = { id?: string; title: string; mediaUrl?: string; videoUrl?: string; isFree?: boolean };
  const recipe = (title: string, steps: StepIn[], premium = false) =>
    recipeInputSchema.parse({
      title, description: "A recipe made by the media test.", coverUrl: "https://example.com/cover.jpg", videoUrl: "", galleryUrls: [],
      servings: 2, prepTimeMinutes: 5, cookTimeMinutes: 5, difficulty: "easy", category: "main",
      calories: null, proteinGrams: null, fatGrams: null, carbGrams: null,
      isPremium: premium, priceAmount: premium ? 10000 : null, secretNotes: "", tags: [],
      ingredients: [{ name: "salt", quantity: "1", unit: "g" }],
      steps: steps.map((s) => ({ id: s.id, title: s.title, instruction: "Do it.", isFree: s.isFree ?? false, mediaUrl: s.mediaUrl ?? "", videoUrl: s.videoUrl ?? "", timerMinutes: 0, temperatureCelsius: 0, tip: "", ingredientPositions: [] })),
    });
  const save = (actor: typeof chefA, creatorId: string, recipeId: string | null, data: ReturnType<typeof recipe>, publish = true) =>
    persistRecipe({ recipeId, creatorId, ownerOnly: true, data, publish, actor, storage });
  const saved = async (...args: Parameters<typeof save>) => {
    const result = await save(...args);
    assert.ok("id" in result, `recipe saved, got ${JSON.stringify(result)}`);
    return result;
  };
  const asset = async (url: string) => (await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, fileIdFromUrl(url)!)))[0];
  const key = async (url: string) => (await asset(url)).objectKey;

  try {
    /* ── uploading ── */
    const photo = await uploaded(chefA, "image", JPEG, "image/jpeg");
    const clip = await uploaded(chefA, "video", MP4, "video/mp4");
    assert.equal((await asset(photo)).status, "ready");
    assert.match(await key(clip), new RegExp(`^uploads/${chefA.id}/[0-9a-f-]{36}\\.mp4$`));
    ok("a creator uploads a valid photo and a valid clip; the storage address is made by the server");
    assert.equal((await asset(await uploaded(chefA, "video", MP4, "video/quicktime"))).contentType, "video/mp4");
    ok("a phone's .mov is taken and served as MP4");

    const links = storage.uploadLinks;
    assert.deepEqual(await media.requestUpload(storage, chefA, { kind: "video", size: 100 * MB + 1, type: "video/mp4" }), { error: "err.videoBig", values: { mb: 100 } });
    assert.ok("uploadUrl" in (await media.requestUpload(storage, chefA, { kind: "video", size: 100 * MB, type: "video/mp4" })));
    assert.deepEqual(await media.requestUpload(storage, chefA, { kind: "image", size: 10 * MB + 1, type: "image/jpeg" }), { error: "err.photoBigMb", values: { mb: 10 } });
    assert.equal(storage.uploadLinks, links + 1);
    ok("a clip over 100 MB and a photo over 10 MB get no upload link; exactly 100 MB does");

    for (const [kind, type] of [["image", "image/svg+xml"], ["image", "image/gif"], ["video", "video/x-msvideo"], ["image", "video/mp4"], ["file", "image/jpeg"]] as const) {
      assert.ok("error" in (await media.requestUpload(storage, chefA, { kind, size: 1000, type })), `${kind} ${type} refused`);
    }
    for (const size of [0, -5, 1.5, "100", null]) assert.ok("error" in (await media.requestUpload(storage, chefA, { kind: "image", size, type: "image/jpeg" })));
    ok("SVG, GIF, AVI, mismatched kinds and empty or malformed sizes are refused");

    const before = storage.objects.size;
    assert.deepEqual(await upload(chefA, "video", MP4, "video/mp4", JUNK), { error: "err.videoType" });
    assert.deepEqual(await upload(chefA, "image", JPEG, "image/jpeg", PNG), { error: "err.photoFormat" });
    assert.deepEqual(await upload(chefA, "video", MP4, "video/mp4", HEIC), { error: "err.videoType" });
    assert.deepEqual(await upload(chefA, "image", JPEG, "image/jpeg", pad([0xff, 0xd8, 0xff], 9000)), { error: "err.photoBigMb", values: { mb: 10 } });
    assert.equal(storage.objects.size, before);
    assert.equal(sniffMedia(new Uint8Array()), null);
    ok("a file whose real content or size is not what was announced is rejected and deleted from storage");

    /* ── an upload that never arrives, and trying again ── */
    const lost = await media.requestUpload(storage, chefA, { kind: "video", size: MP4.length, type: "video/mp4" });
    assert.ok("id" in lost);
    assert.deepEqual(await media.completeUpload(storage, chefA, lost.id), { error: "err.uploadMissing" });
    assert.equal((await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, lost.id))).length, 0);
    assert.equal(await media.createViewUrl(storage, chefA, lost.id), null);
    ok("an upload whose link expired before the file arrived leaves nothing behind and is never viewable");

    /* ── other people's uploads ── */
    const pending = await media.requestUpload(storage, chefA, { kind: "image", size: JPEG.length, type: "image/jpeg" });
    assert.ok("id" in pending);
    storage.put(pending.uploadUrl, JPEG, "image/jpeg");
    assert.deepEqual(await media.completeUpload(storage, chefB, pending.id), { error: "err.uploadMissing" });
    await media.discardUpload(storage, chefB, pending.id);
    assert.equal((await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, pending.id))).length, 1);
    assert.equal(await media.createViewUrl(storage, chefA, pending.id), null);
    assert.ok("url" in (await media.completeUpload(storage, chefA, pending.id)));
    const spare = `/api/files/${pending.id}`;
    ok("another creator can neither confirm nor delete someone's upload; an unchecked file is not viewable");

    /* ── saving: files land on their steps ── */
    const first = await saved(chefA, creatorA.id, null, recipe(`${tag} plov`, [{ title: "one", mediaUrl: photo, videoUrl: clip }, { title: "two" }, { title: "three", mediaUrl: spare }]));
    const [one, two, three] = first.stepIds;
    assert.equal((await asset(photo)).stepId, one);
    assert.equal((await asset(clip)).stepId, one);
    assert.equal((await asset(spare)).stepId, three);
    const reloaded = (await loadRecipeForEdit(first.id, creatorA.id))!;
    assert.deepEqual(reloaded.steps.map((s) => [s.id, s.mediaUrl, s.videoUrl]), [[one, photo, clip], [two, null, null], [three, spare, null]]);
    ok("after saving and loading again, each photo and clip is on the step it was uploaded for");

    const reordered = await saved(chefA, creatorA.id, first.id, recipe(`${tag} plov`, [{ id: three, title: "three", mediaUrl: spare }, { id: one, title: "one", mediaUrl: photo, videoUrl: clip }, { title: "new" }, { id: two, title: "two" }]));
    assert.deepEqual([reordered.stepIds[0], reordered.stepIds[1], reordered.stepIds[3]], [three, one, two]);
    assert.equal((await asset(photo)).stepId, one);
    assert.equal((await asset(spare)).stepId, three);
    const order = (await loadRecipeForEdit(first.id, creatorA.id))!.steps.map((s) => [s.title, s.mediaUrl]);
    assert.deepEqual(order, [["three", spare], ["one", photo], ["new", null], ["two", null]]);
    ok("reordering and adding steps keeps every step's id and its media");
    const [, , added] = reordered.stepIds;

    /* ── attaching files where they do not belong ── */
    const refused = { error: "err.mediaInvalid" };
    const stray = await uploaded(chefA, "image", JPEG, "image/jpeg");
    assert.deepEqual(await save(chefB, creatorB.id, null, recipe(`${tag} theft`, [{ title: "s", mediaUrl: stray }])), refused);
    assert.deepEqual(await save(chefB, creatorB.id, null, recipe(`${tag} theft`, [{ title: "s", mediaUrl: photo }])), refused);
    assert.deepEqual(await save(chefB, creatorB.id, first.id, recipe(`${tag} hijack`, [{ title: "s" }])), { error: "err.recipeNotFound" });
    ok("a creator cannot use another creator's file, nor save into another creator's recipe");
    assert.deepEqual(await save(chefA, creatorA.id, null, recipe(`${tag} second`, [{ title: "s", mediaUrl: photo }])), refused);
    assert.deepEqual(await save(chefA, creatorA.id, null, recipe(`${tag} second`, [{ title: "a", mediaUrl: stray }, { title: "b", mediaUrl: stray }])), refused);
    assert.deepEqual(await save(chefA, creatorA.id, null, recipe(`${tag} second`, [{ title: "a", videoUrl: stray }])), refused);
    assert.deepEqual(await save(chefA, creatorA.id, null, recipe(`${tag} second`, [{ title: "a", mediaUrl: `/api/files/${randomUUID()}` }])), refused);
    assert.equal((await db.select().from(schema.recipes).where(like(schema.recipes.title, `${tag} second`))).length, 0);
    ok("a file already on one recipe, used twice, of the wrong kind, or unknown is refused, and nothing is written");
    const foreign = await saved(chefB, creatorB.id, null, recipe(`${tag} b`, [{ title: "b" }]));
    const borrowed = await saved(chefA, creatorA.id, first.id, recipe(`${tag} plov`, [{ id: three, title: "three", mediaUrl: spare }, { id: one, title: "one", mediaUrl: photo, videoUrl: clip }, { id: added, title: "new" }, { id: foreign.stepIds[0], title: "two" }]));
    assert.notEqual(borrowed.stepIds[3], foreign.stepIds[0]);
    assert.equal((await loadRecipeForEdit(foreign.id, creatorB.id))!.steps[0].title, "b");
    ok("a step id from someone else's recipe is not believed: that recipe is untouched");

    /* ── replacing and removing ── */
    const oldKey = await key(photo);
    const better = await uploaded(chefA, "image", PNG, "image/png");
    assert.ok(storage.objects.has(oldKey));
    const failed = await save(chefA, creatorA.id, first.id, recipe(`${tag} plov`, [{ id: one, title: "one", mediaUrl: better, videoUrl: photo }]));
    assert.deepEqual(failed, refused);
    assert.ok(storage.objects.has(oldKey) && (await asset(photo)).stepId === one);
    ok("a save that fails leaves the recipe and its current files as they were, so it can simply be retried");
    await saved(chefA, creatorA.id, first.id, recipe(`${tag} plov`, [{ id: three, title: "three", mediaUrl: spare }, { id: one, title: "one", mediaUrl: better, videoUrl: clip }]));
    assert.equal(await asset(photo), undefined);
    assert.ok(!storage.objects.has(oldKey));
    assert.equal((await asset(better)).stepId, one);
    ok("replacing a photo removes the old file only once the recipe is saved with the new one");

    const spareKey = await key(spare);
    await saved(chefA, creatorA.id, first.id, recipe(`${tag} plov`, [{ id: one, title: "one", mediaUrl: better, videoUrl: clip }]));
    assert.ok(!storage.objects.has(spareKey));
    assert.equal(await asset(spare), undefined);
    ok("deleting a step removes its files from storage");

    await media.discardUpload(storage, chefA, fileIdFromUrl(better)!);
    assert.ok(await asset(better));
    await media.discardUpload(storage, chefA, fileIdFromUrl(stray)!);
    assert.equal(await asset(stray), undefined);
    ok("the delete call only removes a file no saved recipe uses");

    const forgotten = await uploaded(chefA, "image", JPEG, "image/jpeg");
    const forgottenKey = await key(forgotten);
    assert.equal(await media.sweepUnusedMedia(storage, chefA.id), 0);
    await db.update(schema.mediaAssets).set({ updatedAt: new Date(Date.now() - 25 * 3600_000) }).where(eq(schema.mediaAssets.id, fileIdFromUrl(forgotten)!));
    assert.equal(await media.sweepUnusedMedia(storage, chefA.id), 1);
    assert.ok(!storage.objects.has(forgottenKey) && storage.objects.has(await key(clip)));
    ok("files uploaded but never saved are swept after a day; files in use are not");

    /* ── who may view ── */
    const id = (url: string) => fileIdFromUrl(url)!;
    const can = async (actor: typeof chefA | null, url: string) => (await media.createViewUrl(storage, actor, id(url))) !== null;
    assert.ok((await can(null, better)) && (await can(stranger, clip)));
    ok("files on a published free recipe are viewable by everyone");

    const openPhoto = await uploaded(chefA, "image", JPEG, "image/jpeg");
    const paidClip = await uploaded(chefA, "video", MP4, "video/mp4");
    const paidPhoto = await uploaded(chefA, "image", JPEG, "image/jpeg");
    assert.ok(!(await can(null, paidClip)) && !(await can(chefB, paidClip)) && (await can(chefA, paidClip)));
    ok("a file not yet in a recipe is viewable by its uploader only");
    const steps = [{ title: "open", mediaUrl: openPhoto, isFree: true }, { title: "paid", mediaUrl: paidPhoto, videoUrl: paidClip }];
    const premium = await saved(chefA, creatorA.id, null, recipe(`${tag} premium`, steps, true), false);
    for (const who of [null, stranger, chefB]) assert.ok(!(await can(who, openPhoto)) && !(await can(who, paidClip)));
    assert.ok((await can(chefA, paidClip)) && (await can(admin, paidClip)));
    ok("a draft's files are viewable by its creator and admins only");

    await saved(chefA, creatorA.id, premium.id, recipe(`${tag} premium`, steps.map((s, n) => ({ ...s, id: premium.stepIds[n] })), true), true);
    for (const who of [null, stranger, chefB, buyer]) {
      assert.ok(await can(who, openPhoto), "free step of a premium recipe is open");
      assert.ok(!(await can(who, paidClip)) && !(await can(who, paidPhoto)), "premium step is closed");
    }
    ok("on a published premium recipe, free steps' files are open and premium steps' files are refused to non-buyers");
    const [purchase] = await db.insert(schema.purchases).values({ userId: buyer.id, recipeId: premium.id, amount: 10000, currency: "UZS", status: "pending" }).returning({ id: schema.purchases.id });
    assert.ok(!(await can(buyer, paidClip)));
    await db.update(schema.purchases).set({ status: "paid" }).where(eq(schema.purchases.id, purchase.id));
    assert.ok((await can(buyer, paidClip)) && (await can(buyer, paidPhoto)) && !(await can(stranger, paidClip)));
    await db.update(schema.purchases).set({ status: "refunded" }).where(eq(schema.purchases.id, purchase.id));
    assert.ok(!(await can(buyer, paidClip)));
    ok("an unpaid or refunded purchase opens nothing; a paid one opens the premium files, for that buyer only");
    assert.ok((await can(chefA, paidClip)) && (await can(admin, paidClip)));
    assert.equal(await media.createViewUrl(storage, buyer, randomUUID()), null);
    ok("the creator and admins always see their files; an unknown id gives nothing");

    await saved(chefA, creatorA.id, premium.id, recipe(`${tag} premium`, steps.map((s, n) => ({ ...s, id: premium.stepIds[n], isFree: false })), true), true);
    assert.ok(!(await can(null, openPhoto)));
    ok("closing a step closes its files on the next request");

    /* ── deleting a recipe ── */
    const keys = await Promise.all([openPhoto, paidClip, paidPhoto].map(key));
    const gone = await media.listRecipeMedia(premium.id);
    assert.equal(gone.length, 3);
    await db.delete(schema.recipes).where(eq(schema.recipes.id, premium.id));
    assert.equal((await asset(paidClip)).stepId, null);
    assert.ok(!(await can(buyer, paidClip)));
    await media.removeAssets(storage, gone);
    assert.ok(keys.every((k) => !storage.objects.has(k)) && (await asset(paidClip)) === undefined);
    ok("deleting a recipe unlinks its files at once and removes them from storage");

    /* ── the links themselves ── */
    const s3 = createS3Storage({ endpoint: "https://0123456789abcdef.r2.cloudflarestorage.com", bucket: "recipe-media", accessKeyId: "test", secretAccessKey: "test" });
    const put = new URL(await s3.createUploadUrl("uploads/u/f.mp4", { contentType: "video/mp4", size: 1234 }, 600));
    assert.equal(put.origin + put.pathname, "https://0123456789abcdef.r2.cloudflarestorage.com/recipe-media/uploads/u/f.mp4");
    assert.equal(put.searchParams.get("X-Amz-Expires"), "600");
    assert.equal(put.searchParams.get("X-Amz-SignedHeaders"), "content-length;content-type;host");
    assert.ok(![...put.searchParams.keys()].some((k) => /checksum/i.test(k)));
    const get = new URL(await s3.createReadUrl("uploads/u/f.mp4", 600));
    assert.ok(Number(get.searchParams.get("X-Amz-Expires")) <= 900);
    assert.equal(get.href, await s3.createReadUrl("uploads/u/f.mp4", 600));
    ok("upload links last 10 minutes and are bound to the file's type and exact size; view links last at most 15");

    /* ── the real bucket, when it is configured ── */
    const live = getStorage();
    if (!live) console.log("  – real bucket not configured (R2_* variables missing): live round trip skipped");
    else {
      const liveKey = `uploads/${tag}/${randomUUID()}.jpg`;
      try {
        const target = await live.createUploadUrl(liveKey, { contentType: "image/jpeg", size: JPEG.length }, 300);
        const tooLong = await fetch(target, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: pad([0xff, 0xd8, 0xff], 5000) });
        assert.ok(!tooLong.ok, "a body of another size is refused by the link");
        const wrongType = await fetch(target, { method: "PUT", headers: { "Content-Type": "text/html" }, body: JPEG });
        assert.ok(!wrongType.ok, "another content type is refused by the link");
        assert.equal((await fetch(target, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: JPEG })).status, 200);
        assert.deepEqual(await live.head(liveKey), { size: JPEG.length, contentType: "image/jpeg" });
        assert.deepEqual([...(await live.readStart(liveKey, 4))], [0xff, 0xd8, 0xff, 0xe0]);
        const view = await live.createReadUrl(liveKey, 600);
        assert.equal((await fetch(view)).status, 200);
        const bare = view.split("?")[0];
        assert.ok([400, 401, 403].includes((await fetch(bare)).status), "the object is not readable without a signed link");
        const ranged = await fetch(view, { headers: { Range: "bytes=0-9" } });
        assert.equal(ranged.status, 206);
        assert.equal(await live.head(`${liveKey}.missing`), null);
      } finally {
        await live.delete(liveKey);
      }
      assert.equal(await live.head(liveKey), null);
      ok("REAL BUCKET: signed upload (exact size and type only), inspect, ranged signed read, no public read, delete");
    }

    console.log("\nAll media checks passed.");
  } finally {
    const people = [chefA, chefB, buyer, stranger, admin].map((p) => p.id);
    await db.delete(schema.recipes).where(inArray(schema.recipes.creatorId, [creatorA.id, creatorB.id]));
    await db.delete(schema.mediaAssets).where(inArray(schema.mediaAssets.ownerId, people));
    await db.delete(schema.creators).where(inArray(schema.creators.id, [creatorA.id, creatorB.id]));
    await db.delete(schema.users).where(inArray(schema.users.id, people));
  }
}
main().then(
  () => process.exit(0),
  (e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  },
);
