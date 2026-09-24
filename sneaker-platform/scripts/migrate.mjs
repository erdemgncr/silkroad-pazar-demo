// Veritabanı şemasını günceller. DATABASE_URL boşsa gömülü veritabanı (.data/db) kullanılır.
import "./load-env.mjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(root, "drizzle");
const url = (process.env.DATABASE_URL ?? "").trim();

if (!url || url.startsWith("pglite:")) {
  const dir = path.resolve(process.cwd(), url.slice("pglite:".length) || process.env.PGLITE_DIR || ".data/db");
  fs.mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(dir);
  await migrate(drizzle(client), { migrationsFolder });
  await client.close();
  console.log(`Veritabanı güncel (gömülü: ${path.relative(process.cwd(), dir)}).`);
} else {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await migrate(drizzle(sql), { migrationsFolder });
  await sql.end();
  console.log("Veritabanı güncel (PostgreSQL).");
}
