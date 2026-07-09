"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStatus, vynedresClientApi } from "@/lib/api";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "FITTING", label: "Fitting" },
  { value: "READY", label: "Ready" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? status.replace(/_/g, " ");
}

type OrderStatusSelectProps = {
  tenantSlug: string;
  orderId: string;
  currentStatus: string;
  onSuccess?: () => void;
};

export function OrderStatusSelect({
  tenantSlug,
  orderId,
  currentStatus,
  onSuccess,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus, orderId]);

  async function handleChange(nextStatus: string) {
    if (nextStatus === status) return;

    const previous = status;
    setStatus(nextStatus);
    setUpdating(true);
    setError(null);

    try {
      await vynedresClientApi.updateOrderStatus(
        tenantSlug,
        orderId,
        nextStatus as OrderStatus,
        `Status updated to ${nextStatus.replace(/_/g, " ").toLowerCase()}`,
      );
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <label className="text-[10px] uppercase tracking-wider text-vynedres-ink/50">
        Order status
      </label>
      <select
        value={status}
        disabled={updating}
        onChange={(e) => void handleChange(e.target.value)}
        className="min-w-[8.5rem] rounded-lg border border-vynedres-gold/40 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-golddeep focus:border-vynedres-gold focus:outline-none focus:ring-2 focus:ring-vynedres-gold/30 disabled:opacity-50"
        aria-label={`Order status — currently ${statusLabel(status)}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-vynedres-ink">
            {opt.label}
          </option>
        ))}
      </select>
      {updating && <span className="text-xs text-vynedres-ink/50">Saving…</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
