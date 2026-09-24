export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödeme alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

export const ORDER_STATUS_STEPS = ["paid", "preparing", "shipped", "delivered"] as const;

export const ORDER_STATUS_TONE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-sky-100 text-sky-800",
  preparing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  refunded: "bg-zinc-200 text-zinc-800",
};
