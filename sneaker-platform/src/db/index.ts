import path from "path";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Veritabanı bağlantısı.
 *  - DATABASE_URL tanımlıysa PostgreSQL'e bağlanılır (üretim).
 *  - Boşsa ya da "pglite:" ile başlıyorsa proje içindeki gömülü veritabanı (PGlite) kullanılır;
 *    Docker veya ayrı bir PostgreSQL kurulumu gerekmez (yerelde deneme için).
 * Bağlantı ilk sorguda açılır; derleme sırasında veritabanına dokunulmaz.
 */
type DB = PostgresJsDatabase<typeof schema>;

const url = (process.env.DATABASE_URL ?? "").trim();
export const isEmbeddedDb = !url || url.startsWith("pglite:");

export function embeddedDbDir() {
  const p = url.startsWith("pglite:") ? url.slice("pglite:".length) : "";
  return path.resolve(process.cwd(), p || process.env.PGLITE_DIR || ".data/db");
}

const g = globalThis as unknown as { __db?: DB; __pglite?: PGlite; __pg?: ReturnType<typeof postgres> };

function instance(): DB {
  if (g.__db) return g.__db;
  if (isEmbeddedDb) {
    g.__pglite = new PGlite(embeddedDbDir());
    g.__db = drizzlePglite(g.__pglite, { schema }) as unknown as DB;
  } else {
    g.__pg = postgres(url, { max: 10, idle_timeout: 30 });
    g.__db = drizzlePostgres(g.__pg, { schema });
  }
  return g.__db;
}

export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const d = instance();
    const v = Reflect.get(d, prop, d);
    return typeof v === "function" ? v.bind(d) : v;
  },
});

/** Betiklerin (seed, migrate) sonunda bağlantıyı düzgün kapatmak için. */
export async function closeDb() {
  await g.__pglite?.close();
  await g.__pg?.end();
  g.__db = undefined;
  g.__pglite = undefined;
  g.__pg = undefined;
}

export { schema };
