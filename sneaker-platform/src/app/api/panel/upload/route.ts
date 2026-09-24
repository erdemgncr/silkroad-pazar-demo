import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX = 8 * 1024 * 1024;

/** Panelden görsel yükleme (logo, banner, ürün görselleri). Dosyalar /uploads altında sunulur. */
export async function POST(req: Request) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Dosya seçilmedi" }, { status: 400 });
  const folder = `${s.mid ? `m${s.mid}` : "platform"}/${new Date().toISOString().slice(0, 7)}`;
  await mkdir(path.join(UPLOAD_DIR, folder), { recursive: true });
  const urls: string[] = [];
  for (const f of files.slice(0, 12)) {
    const ext = TYPES[f.type];
    if (!ext) return NextResponse.json({ error: `${f.name}: yalnızca JPG, PNG, WEBP, GIF, AVIF yüklenebilir` }, { status: 400 });
    if (f.size > MAX) return NextResponse.json({ error: `${f.name}: dosya 8 MB'tan büyük` }, { status: 400 });
    const name = `${randomBytes(10).toString("hex")}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, folder, name), Buffer.from(await f.arrayBuffer()));
    urls.push(`/uploads/${folder}/${name}`);
  }
  return NextResponse.json({ urls });
}
