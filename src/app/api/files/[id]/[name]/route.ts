// 📁 GET /api/files/[folder]/[name] — local storage provider ke uploads serve
// karta hai (immutable cache headers ke saath). S3-family providers par files
// unke CDN URLs se directly milti hain.
// Range requests supported (audio/video seek ke liye 206 Partial Content).
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { localUploadDir, sanitizeKey } from "@/lib/storage";
import { parseRangeHeader } from "@/lib/upload-validation";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

type Ctx = { params: Promise<{ id: string; name: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id, name } = await ctx.params;
    const key = sanitizeKey(`${id}/${name}`);
    const full = path.join(localUploadDir, key);
    // path traversal double-check
    if (!full.startsWith(path.resolve(localUploadDir))) {
      return new Response("Forbidden", { status: 403 });
    }
    if (!existsSync(full) || !statSync(full).isFile()) {
      return new Response("Not found", { status: 404 });
    }
    const size = statSync(full).size;
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const type = MIME[ext] ?? "application/octet-stream";
    const fileName = key.split("/").pop() ?? "file";
    const baseHeaders = {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
    };

    // Range request (audio/video seek) → 206 Partial Content
    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      const range = parseRangeHeader(rangeHeader, size);
      if (!range) {
        return new Response("Range Not Satisfiable", {
          status: 416,
          headers: { ...baseHeaders, "Content-Range": `bytes */${size}` },
        });
      }
      const { start, end } = range;
      const chunkSize = end - start + 1;
      const stream = Readable.toWeb(
        createReadStream(full, { start, end }),
      ) as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }

    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new Response(stream, {
      headers: {
        ...baseHeaders,
        "Content-Length": String(size),
      },
    });
  } catch {
    return new Response("Bad request", { status: 400 });
  }
}
