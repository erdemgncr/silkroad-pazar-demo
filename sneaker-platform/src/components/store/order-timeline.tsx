import { clsx } from "clsx";
import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STEPS } from "@/lib/order-status";

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded" || status === "pending_payment") {
    return <p className="rounded-theme bg-soft p-4 text-sm font-semibold">{ORDER_STATUS_LABEL[status]}</p>;
  }
  const idx = ORDER_STATUS_STEPS.indexOf(status as (typeof ORDER_STATUS_STEPS)[number]);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {ORDER_STATUS_STEPS.map((s, i) => (
        <li key={s} className="flex flex-col items-center text-center">
          <div className="flex w-full items-center">
            <span className={clsx("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= idx ? "bg-primary" : "bg-line")} />
            <span className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", i <= idx ? "bg-primary text-primary-fg" : "bg-soft text-muted")}>
              {i <= idx ? <Check size={15} /> : i + 1}
            </span>
            <span className={clsx("h-0.5 flex-1", i === ORDER_STATUS_STEPS.length - 1 ? "bg-transparent" : i < idx ? "bg-primary" : "bg-line")} />
          </div>
          <span className={clsx("mt-2 text-[11px] leading-tight md:text-xs", i <= idx ? "font-semibold" : "text-muted")}>{ORDER_STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}
