/**
 * Where uploaded files go.
 *
 * Two drivers out of the box:
 *   local  — writes under ./storage/uploads (default; good for a VPS, Docker,
 *            or `next start` on a box with a disk)
 *   blob   — Vercel Blob, for serverless deploys where the disk is ephemeral
 *
 * Add your own by implementing `saveUpload`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeToken } from "./reference";

export interface StoredFile {
  originalName: string;
  /** Path or key the file lives at */
  location: string;
  /** A link the shop can click to download it */
  url: string;
  sizeBytes: number;
  token: string;
}

const DRIVER = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

/** Strip anything that could escape the upload directory. */
export function safeFilename(name: string): string {
  const base = path.basename(name).replace(/[\u0000-\u001f]/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^\.+/, "");
  const trimmed = cleaned.slice(0, 120);
  return trimmed || "upload.bin";
}

export async function saveUpload(file: File, baseUrl: string): Promise<StoredFile> {
  const token = makeToken();
  const filename = safeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (DRIVER === "blob") {
    // Vercel Blob. Install @vercel/blob and set BLOB_READ_WRITE_TOKEN.
    const { put } = (await import("@vercel/blob")) as typeof import("@vercel/blob");
    const result = await put(`quotes/${token}/${filename}`, bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    });
    return { originalName: file.name, location: result.pathname, url: result.url, sizeBytes: bytes.length, token };
  }

  const dir = path.join(UPLOAD_ROOT, token);
  await mkdir(dir, { recursive: true });
  const location = path.join(dir, filename);
  await writeFile(location, bytes);

  return {
    originalName: file.name,
    location,
    url: `${baseUrl}/api/files/${token}/${encodeURIComponent(filename)}`,
    sizeBytes: bytes.length,
    token,
  };
}

export function uploadDirFor(token: string): string {
  return path.join(UPLOAD_ROOT, token);
}
