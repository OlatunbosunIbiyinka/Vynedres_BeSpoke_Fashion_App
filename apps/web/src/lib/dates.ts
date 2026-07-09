/** UK date display: dd/mm/yyyy */
export function formatDateGB(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** Convert YYYY-MM-DD from date input to ISO (noon UTC avoids UK day-shift) */
export function dateInputToIso(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

export function parseOptionalMoney(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const num = Number(raw);
  if (Number.isNaN(num) || num < 0) return undefined;
  return num;
}

export const ORDER_DATE_LABELS = {
  orderPlaced: {
    label: "Order date",
    hint: "When the order was taken — adjust if you are logging it after the fact.",
  },
  completion: {
    label: "Workshop completion date",
    hint: "When you aim to finish sewing — internal deadline for your team.",
  },
  pickup: {
    label: "Client pickup date",
    hint: "When the client comes to collect their finished garment.",
  },
} as const;
