"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { vynedresClientApi } from "@/lib/api";

type NewClientFormProps = {
  tenantSlug: string;
  onSuccess?: () => void;
};

export function NewClientForm({ tenantSlug, onSuccess }: NewClientFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(formElement);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    try {
      await vynedresClientApi.createClient(tenantSlug, {
        firstName,
        lastName,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(notes ? { notes } : {}),
      });

      formElement.reset();
      setOpen(false);
      setSuccess(`${firstName} ${lastName} added successfully.`);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      {success && (
        <p className="mb-3 text-sm text-green-400">{success}</p>
      )}
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
          + New client
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-vynedres-ink/10 bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg text-vynedres-golddeep">Add client</h3>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-vynedres-ink/55 hover:text-vynedres-ink"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" required />
            <Field label="Email" name="email" type="email" />
            <Field label="Phone" name="phone" type="tel" />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-vynedres-ink/55">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-ink placeholder:text-vynedres-ink/45 focus:border-vynedres-gold/50 focus:outline-none"
                placeholder="Style preferences, occasion, etc."
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-400">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-vynedres-gold px-5 py-2 text-sm font-medium text-vynedres-black transition hover:bg-vynedres-gold/90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save client"}
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="w-full rounded-lg border border-vynedres-ink/10 bg-vynedres-paper px-3 py-2 text-sm text-vynedres-ink placeholder:text-vynedres-ink/45 focus:border-vynedres-gold/50 focus:outline-none"
      />
    </div>
  );
}
