import { formatDateGB, ORDER_DATE_LABELS } from "@/lib/dates";

type OrderDateTimelineProps = {
  createdAt: string;
  dueDate: string | null;
  collectionDate: string | null;
  variant?: "studio" | "portal";
};

export function OrderDateTimeline({
  createdAt,
  dueDate,
  collectionDate,
  variant = "studio",
}: OrderDateTimelineProps) {
  const items = [
    {
      key: "order",
      label: ORDER_DATE_LABELS.orderPlaced.label,
      value: formatDateGB(createdAt),
      always: true,
    },
    {
      key: "completion",
      label: ORDER_DATE_LABELS.completion.label,
      value: formatDateGB(dueDate),
      always: false,
    },
    {
      key: "pickup",
      label: ORDER_DATE_LABELS.pickup.label,
      value: formatDateGB(collectionDate),
      always: false,
      highlight: variant === "portal",
    },
  ];

  return (
    <ul className="mt-3 space-y-2 border-t border-vynedres-ink/10 pt-3">
      {items.map((item) => {
        if (!item.always && item.value === "—") return null;
        return (
          <li key={item.key} className="flex items-start justify-between gap-3 text-xs">
            <span className="text-vynedres-ink/55">{item.label}</span>
            <span
              className={
                item.highlight && item.value !== "—"
                  ? "font-medium text-vynedres-golddeep"
                  : "text-vynedres-ink/75"
              }
            >
              {item.value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
