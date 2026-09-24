import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajında bağımsız (standalone) çıktı; yerelde "npm start" normal çalışır.
  output: process.env.STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  // Gömülü veritabanı (PGlite) WASM dosyalarıyla birlikte node_modules'tan yüklenir.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
