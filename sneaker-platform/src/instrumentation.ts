/**
 * Sunucu açılırken zamanlanmış işleri başlatır (günlük özet, deneme uyarıları, Shopier sipariş yedeği).
 * JOBS=off ile kapatılabilir (örn. birden fazla uygulama kopyası çalışıyorsa yalnızca birinde açık bırakın).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.JOBS === "off") return;
  const { runScheduledJobs } = await import("./lib/jobs");
  const tick = () => runScheduledJobs().catch((e) => console.error("[jobs]", e));
  setTimeout(tick, 30_000);
  setInterval(tick, 10 * 60_000);
}
