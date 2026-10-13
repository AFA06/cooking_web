import "server-only";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Where uploaded files live. Everything else in the app talks to this interface, so moving from
 * Cloudflare R2 to another S3-compatible store is a change to this file and the environment only.
 * The bucket is private: files leave it only through the short-lived links made here.
 */
export interface ObjectStorage {
  /** A link the browser can PUT exactly this file to: this type, this many bytes, for a few minutes. */
  createUploadUrl(key: string, file: { contentType: string; size: number }, expiresInSeconds: number): Promise<string>;
  /** Size and type of a stored object, or null when it is not there. */
  head(key: string): Promise<{ size: number; contentType: string | null } | null>;
  /** The first bytes of an object, to check what it really is. */
  readStart(key: string, bytes: number): Promise<Uint8Array>;
  /** A link that reads the object for a short while. Anyone holding the link can use it until it expires. */
  createReadUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

/** Read links are cut to this grid, so one visitor gets the same link for a while and their browser can reuse what it loaded. */
const READ_LINK_GRID_MS = 5 * 60_000;

export function createS3Storage(config: { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string }): ObjectStorage {
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    // Newer SDKs add checksum headers a browser upload cannot send; R2 does not need them.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const Bucket = config.bucket;
  const missing = (error: unknown) =>
    typeof error === "object" && error !== null && "$metadata" in error && (error as { $metadata: { httpStatusCode?: number } }).$metadata.httpStatusCode === 404;

  return {
    createUploadUrl(key, file, expiresInSeconds) {
      // Type and length are part of the signature: the link accepts this file and nothing bigger.
      return getSignedUrl(client, new PutObjectCommand({ Bucket, Key: key, ContentType: file.contentType, ContentLength: file.size }), {
        expiresIn: expiresInSeconds,
        signableHeaders: new Set(["content-type", "content-length"]),
        unhoistableHeaders: new Set(["content-type", "content-length"]),
      });
    },
    async head(key) {
      try {
        const object = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
        return { size: object.ContentLength ?? 0, contentType: object.ContentType ?? null };
      } catch (error) {
        if (missing(error)) return null;
        throw error;
      }
    },
    async readStart(key, bytes) {
      const object = await client.send(new GetObjectCommand({ Bucket, Key: key, Range: `bytes=0-${bytes - 1}` }));
      return object.Body ? object.Body.transformToByteArray() : new Uint8Array();
    },
    createReadUrl(key, expiresInSeconds) {
      const signingDate = new Date(Math.floor(Date.now() / READ_LINK_GRID_MS) * READ_LINK_GRID_MS);
      return getSignedUrl(client, new GetObjectCommand({ Bucket, Key: key, ResponseCacheControl: "private, max-age=300" }), {
        expiresIn: expiresInSeconds + READ_LINK_GRID_MS / 1000,
        signingDate,
      });
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },
  };
}

/** The storage origin the browser uploads to, for the content security policy. Empty when storage is not set up. */
export function storageEndpoint(env: NodeJS.ProcessEnv = process.env): string {
  return env.R2_ENDPOINT?.trim() || (env.R2_ACCOUNT_ID?.trim() ? `https://${env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com` : "");
}

let cached: ObjectStorage | null | undefined;

/** The configured storage, or null when its environment variables are missing. */
export function getStorage(): ObjectStorage | null {
  if (cached !== undefined) return cached;
  const endpoint = storageEndpoint();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  cached = endpoint && bucket && accessKeyId && secretAccessKey ? createS3Storage({ endpoint, bucket, accessKeyId, secretAccessKey }) : null;
  return cached;
}
