"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { dateInputToIso, ORDER_DATE_LABELS, parseOptionalMoney, todayIsoDate } from "@/lib/dates";
import { vynedresClientApi } from "@/lib/api";

type ClientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type NewOrderFormProps = {
  tenantSlug: string;
  clients: ClientOption[];
  onSuccess?: () => void;
};

export function NewOrderForm({ tenantSlug, clients, onSuccess }: NewOrderFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const today = todayIsoDate();
  const [orderDate, setOrderDate] = useState(today);
  const [completionDate, setCompletionDate] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(formElement);
    const clientId = String(formData.get("clientId") ?? "");
    const garmentType = String(formData.get("garmentType") ?? "").trim();
    const fabric = String(formData.get("fabric") ?? "").trim();
    const styleNotes = String(formData.get("styleNotes") ?? "").trim();
    const priceRaw = String(formData.get("price") ?? "").trim();
    const depositRaw = String(formData.get("deposit") ?? "").trim();
    const orderDateRaw = String(formData.get("orderDate") ?? today).trim();
    const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
    const collectionDateRaw = String(formData.get("collectionDate") ?? "").trim();

    const price = parseOptionalMoney(priceRaw);
    const deposit = parseOptionalMoney(depositRaw);

    if (dueDateRaw && orderDateRaw && dueDateRaw < orderDateRaw) {
      setError("Workshop completion cannot be before the order date.");
      setSubmitting(false);
      return;
    }

    if (collectionDateRaw && orderDateRaw && collectionDateRaw < orderDateRaw) {
      setError("Client pickup date cannot be before the order date.");
      setSubmitting(false);
      return;
    }

    if (dueDateRaw && collectionDateRaw && collectionDateRaw < dueDateRaw) {
      setError("Client pickup date is usually on or after workshop completion.");
      setSubmitting(false);
      return;
    }

    try {
      const order = await vynedresClientApi.createOrder(tenantSlug, {
        clientId,
        garmentType,
        ...(fabric ? { fabric } : {}),
        ...(styleNotes ? { styleNotes } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(deposit !== undefined ? { deposit } : {}),
        ...(orderDateRaw ? { orderDate: dateInputToIso(orderDateRaw) } : {}),
        ...(dueDateRaw ? { dueDate: dateInputToIso(dueDateRaw) } : {}),
        ...(collectionDateRaw
          ? { collectionDate: dateInputToIso(collectionDateRaw) }
          : {}),
      });

      formElement.reset();
      setCompletionDate("");
      setOpen(false);
      setSuccess(`Order ${order.orderNumber} created.`);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (clients.length === 0) {
    return (
      <p className="mb-4 text-sm text-vynedres-ink/55">
        Add a client first before creating an order.
      </p>
    );
  }

  return (
    <div className="mb-6">
      {success && <p className="mb-3 text-sm text-green-400">{success}</p>}
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSuccess(null);
            setError(null);
          }}
          className="rounded-lg border border-vynedres-gold/40 bg-vynedres-gold/10 px-4 py-2 text-sm text-vynedres-golddeep transition hover:border-vynedres-gold hover:bg-vynedres-gold/20"
        >
          + New order
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-vynedres-ink/10 bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg text-vynedres-golddeep">New bespoke order</h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="text-sm text-vynedres-ink/55 hover:text-vynedres-ink"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-vynedres-ink/55">
                Client <span className="text-vynedres-golddeep"> *</span>
              </label>
              <select
                name="clientId"
                required
                className="w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-ink focus:border-vynedres-gold/50 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Select client…
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Garment type" name="garmentType" required placeholder="e.g. Bespoke suit" />
            <Field label="Fabric" name="fabric" placeholder="e.g. Italian wool" />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-vynedres-ink/55">
                Style notes
              </label>
              <textarea
                name="styleNotes"
                rows={2}
                className="w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-ink placeholder:text-vynedres-ink/45 focus:border-vynedres-gold/50 focus:outline-none"
                placeholder="Cut, lining, special requests…"
              />
            </div>
            <Field label="Price (£)" name="price" type="number" min="0" step="0.01" />
            <Field label="Deposit (£)" name="deposit" type="number" min="0" step="0.01" />

            <div className="sm:col-span-2 mt-2 border-t border-vynedres-ink/10 pt-4">
              <h4 className="mb-2 font-display text-sm text-vynedres-golddeep">Order schedule</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePickerField
                  name="orderDate"
                  label={ORDER_DATE_LABELS.orderPlaced.label}
                  hint={ORDER_DATE_LABELS.orderPlaced.hint}
                  defaultValue={today}
                  onChange={setOrderDate}
                />
                <DatePickerField
                  name="dueDate"
                  label={ORDER_DATE_LABELS.completion.label}
                  hint={ORDER_DATE_LABELS.completion.hint}
                  min={orderDate}
                  onChange={setCompletionDate}
                />
                <DatePickerField
                  name="collectionDate"
                  label={ORDER_DATE_LABELS.pickup.label}
                  hint={ORDER_DATE_LABELS.pickup.hint}
                  min={completionDate || orderDate}
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-vynedres-gold px-5 py-2 text-sm font-medium text-vynedres-black transition hover:bg-vynedres-gold/90 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create order"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-vynedres-ink/55">
        {label}
        {required && <span className="text-vynedres-golddeep"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-ink placeholder:text-vynedres-ink/45 focus:border-vynedres-gold/50 focus:outline-none"
      />
    </div>
  );
}
