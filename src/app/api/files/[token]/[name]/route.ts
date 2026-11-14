import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { uploadDirFor } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a stored upload back to the shop.
 *
 * The token is 128 bits of randomness generated when the file was saved, so
 * the link is unguessable; it is only ever sent in the notification email.
 * Both path segments are validated before they touch the filesystem.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; name: string }> },
) {
  const { token, name } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const decoded = decodeURIComponent(name);
  // basename() alone would allow "..", so reject anything that is not a plain name
  if (decoded !== path.basename(decoded) || decoded.includes("..") || decoded.startsWith(".")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dir = uploadDirFor(token);
  const filePath = path.join(dir, decoded);

  // Final guard: the resolved path must still sit inside the token directory
  if (!path.resolve(filePath).startsWith(path.resolve(dir) + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let info;
  try {
    info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(decoded)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
