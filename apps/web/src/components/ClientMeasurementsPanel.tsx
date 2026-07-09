"use client";

import { FormEvent, useState } from "react";
import {
  vynedresClientApi,
  type ClientDetail,
  type MeasurementProfile,
} from "@/lib/api";
import { MEASUREMENT_FIELDS, formatMeasurementValue } from "@/lib/measurements";

type ClientMeasurementsPanelProps = {
  tenantSlug: string;
  clientId: string;
  clientName: string;
  measurementCount: number;
  onSuccess?: () => void;
};

export function ClientMeasurementsPanel({
  tenantSlug,
  clientId,
  clientName,
  measurementCount,
  onSuccess,
}: ClientMeasurementsPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError(null);
    try {
      const data = await vynedresClientApi.getClient(tenantSlug, clientId);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load measurements");
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    setSuccess(null);
    if (next && !detail) {
      await loadDetail();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(formElement);
    const label = String(formData.get("label") ?? "Initial fitting").trim() || "Initial fitting";

    const data: Record<string, number | string> = { unit: "cm" };
    for (const field of MEASUREMENT_FIELDS) {
      const raw = String(formData.get(field.key) ?? "").trim();
      if (raw) {
        const num = Number(raw);
        if (Number.isNaN(num) || num <= 0) {
          setError(`${field.label} must be a positive number`);
          setSubmitting(false);
          return;
        }
        data[field.key] = num;
      }
    }

    if (Object.keys(data).length <= 1) {
      setError("Enter at least one measurement");
      setSubmitting(false);
      return;
    }

    try {
      await vynedresClientApi.createMeasurement(tenantSlug, clientId, { label, data });
      formElement.reset();
      setShowForm(false);
      setSuccess("Measurement profile saved.");
      await loadDetail();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save measurements");
    } finally {
      setSubmitting(false);
    }
  }

  const profiles = detail?.measurements ?? [];

  return (
    <div className="mt-3 border-t border-vynedres-ink/10 pt-3">
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className="text-xs text-vynedres-golddeep hover:underline"
      >
        {open ? "Hide measurements" : `View / add measurements (${measurementCount})`}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-vynedres-ink/10 bg-white p-4">
          <p className="text-xs text-vynedres-ink/55">
            Fit profile for <span className="text-vynedres-ink/75">{clientName}</span>
          </p>

          {loading && <p className="text-sm text-vynedres-ink/55">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}

          {!loading && profiles.length === 0 && (
            <p className="text-sm text-vynedres-ink/55">No measurement profiles yet.</p>
          )}

          {!loading &&
            profiles.map((profile) => (
              <MeasurementCard key={profile.id} profile={profile} />
            ))}

          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-xs text-vynedres-golddeep hover:underline"
            >
              + Add measurement profile
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-vynedres-ink/10 pt-3">
              <p className="text-xs uppercase tracking-wider text-vynedres-ink/50">New profile</p>
              <label className="block">
                <span className="text-xs text-vynedres-ink/55">Label</span>
                <input
                  name="label"
                  defaultValue="Initial fitting"
                  className="mt-1 w-full rounded-lg border border-vynedres-ink/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-vynedres-gold/40"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-xs text-vynedres-ink/55">
                      {field.label} <span className="text-vynedres-ink/45">(cm)</span>
                    </span>
                    <input
                      name={field.key}
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="—"
                      className="mt-1 w-full rounded-lg border border-vynedres-ink/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-vynedres-gold/40"
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-vynedres-gold px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save profile"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-vynedres-ink/15 px-4 py-2 text-xs text-vynedres-ink/65"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function MeasurementCard({ profile }: { profile: MeasurementProfile }) {
  const data = profile.data as Record<string, unknown>;
  const recorded = new Date(profile.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border border-vynedres-ink/10 bg-white/80 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-vynedres-golddeep">{profile.label}</p>
        <p className="text-xs text-vynedres-ink/50">{recorded}</p>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {MEASUREMENT_FIELDS.map((field) => (
          <div key={field.key}>
            <dt className="text-[10px] uppercase tracking-wider text-vynedres-ink/50">
              {field.label}
            </dt>
            <dd className="text-sm text-vynedres-ink/75">
              {formatMeasurementValue(data[field.key])}
              {data[field.key] != null && data[field.key] !== "" ? " cm" : ""}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
