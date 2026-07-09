"use client";

import { useEffect, useState } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { ORDER_DATE_LABELS, toDateInputValue, dateInputToIso } from "@/lib/dates";
import { vynedresClientApi } from "@/lib/api";

type OrderDatesEditorProps = {
  tenantSlug: string;
  orderId: string;
  createdAt: string;
  dueDate: string | null;
  collectionDate: string | null;
  onSuccess?: () => void;
};

type DateField = "orderDate" | "dueDate" | "collectionDate";

export function OrderDatesEditor({
  tenantSlug,
  orderId,
  createdAt,
  dueDate,
  collectionDate,
  onSuccess,
}: OrderDatesEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [orderDay, setOrderDay] = useState(toDateInputValue(createdAt));
  const [completionDay, setCompletionDay] = useState(toDateInputValue(dueDate));
  const [pickupDay, setPickupDay] = useState(toDateInputValue(collectionDate));

  useEffect(() => {
    setOrderDay(toDateInputValue(createdAt));
    setCompletionDay(toDateInputValue(dueDate));
    setPickupDay(toDateInputValue(collectionDate));
  }, [orderId, createdAt, dueDate, collectionDate]);

  const pickupMin = completionDay || orderDay;

  function validateDates(field: DateField, value: string): string | null {
    const nextCompletion = field === "dueDate" ? value : completionDay;
    const nextPickup = field === "collectionDate" ? value : pickupDay;
    const nextOrder = field === "orderDate" ? value : orderDay;

    if (field === "dueDate" && value && nextOrder && value < nextOrder) {
      return "Completion date cannot be before the order date.";
    }
    if (field === "collectionDate" && value && nextOrder && value < nextOrder) {
      return "Pickup date cannot be before the order date.";
    }
    if (field === "orderDate" && value && nextCompletion && nextCompletion < value) {
      return "Move the completion date first, or set it after the new order date.";
    }
    if (field === "orderDate" && value && nextPickup && nextPickup < value) {
      return "Move the pickup date first, or set it after the new order date.";
    }
    if (field === "collectionDate" && value && nextCompletion && value < nextCompletion) {
      return "Pickup date is usually on or after workshop completion.";
    }
    return null;
  }

  async function saveField(field: DateField, value: string) {
    const current =
      field === "orderDate"
        ? orderDay
        : field === "dueDate"
          ? completionDay
          : pickupDay;
    if (value === current) return;

    const validationError = validateDates(field, value);
    if (validationError) {
      setError(validationError);
      setSaved(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(null);

    try {
      const payload =
        field === "orderDate"
          ? { orderDate: dateInputToIso(value) }
          : { [field]: value ? dateInputToIso(value) : null };

      await vynedresClientApi.updateOrder(tenantSlug, orderId, payload);

      if (field === "orderDate") setOrderDay(value);
      if (field === "dueDate") setCompletionDay(value);
      if (field === "collectionDate") setPickupDay(value);

      setSaved(
        field === "orderDate"
          ? "Order date saved"
          : field === "dueDate"
            ? "Workshop completion saved"
            : "Client pickup saved",
      );
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save date");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-vynedres-ink/10 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-vynedres-ink/50">Schedule</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <DatePickerField
          label={ORDER_DATE_LABELS.orderPlaced.label}
          hint={ORDER_DATE_LABELS.orderPlaced.hint}
          name={`order-date-${orderId}`}
          value={orderDay}
          disabled={saving}
          onSave={(value) => void saveField("orderDate", value)}
        />
        <DatePickerField
          label={ORDER_DATE_LABELS.completion.label}
          hint={ORDER_DATE_LABELS.completion.hint}
          name={`completion-${orderId}`}
          value={completionDay}
          min={orderDay}
          disabled={saving}
          onSave={(value) => void saveField("dueDate", value)}
        />
        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.375rem)]">
          <DatePickerField
            label={ORDER_DATE_LABELS.pickup.label}
            hint={ORDER_DATE_LABELS.pickup.hint}
            name={`pickup-${orderId}`}
            value={pickupDay}
            min={pickupMin}
            disabled={saving}
            onSave={(value) => void saveField("collectionDate", value)}
          />
        </div>
      </div>
      {saving && <p className="text-xs text-vynedres-ink/55">Saving…</p>}
      {saved && !error && <p className="text-xs text-emerald-600">{saved}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
