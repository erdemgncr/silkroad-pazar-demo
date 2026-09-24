// Tek komutla kurulum: .env yoksa oluşturur, veritabanını hazırlar ve demo verisini yükler.
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import crypto from "crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  let text = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  text = text.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${crypto.randomBytes(32).toString("hex")}`);
  fs.writeFileSync(envPath, text);
  console.log("→ .env oluşturuldu");
}
await import("./load-env.mjs");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
console.log("→ Veritabanı hazırlanıyor");
run(process.execPath, ["scripts/migrate.mjs"]);
console.log("→ Demo verisi yükleniyor");
run(process.execPath, [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "scripts/seed.ts"]);
