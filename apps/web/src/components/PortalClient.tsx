"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { OrderDateTimeline } from "@/components/OrderDateTimeline";
import {
  vynedresClientApi,
  type PortalLookupOrder,
  type PortalLookupResponse,
  type Tenant,
} from "@/lib/api";
import { MEASUREMENT_FIELDS } from "@/lib/measurements";

type WizardStep = "access" | "orders" | "measure" | "done";

type PortalClientProps = {
  slug: string;
  tenant: Tenant;
  /** Invite token from ?token=… (studio-issued link). */
  initialToken?: string | null;
};

const MEASURE_TIPS: Record<string, string> = {
  chest: "Around the fullest part of the chest, tape parallel to the floor.",
  waist: "Around the natural waist, not too tight.",
  hips: "Around the fullest part of the hips.",
  shoulder: "Across the back from shoulder point to shoulder point.",
  sleeve: "From shoulder point to wrist with arm slightly bent.",
  inseam: "From crotch to ankle along the inside leg.",
};

export function PortalClient({
  slug,
  tenant,
  initialToken = null,
}: PortalClientProps) {
  const [step, setStep] = useState<WizardStep>("access");
  const [token, setToken] = useState(initialToken ?? "");
  const [lookup, setLookup] = useState<PortalLookupResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PortalLookupOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(initialToken));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialToken) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void vynedresClientApi
      .portalSession(slug, initialToken)
      .then((result) => {
        if (cancelled) return;
        setLookup(result);
        setToken(initialToken);
        setStep("orders");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Invalid or expired invite link");
        setStep("access");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, initialToken]);

  async function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const nextToken = token.trim();
      const result = await vynedresClientApi.portalSession(slug, nextToken);
      setLookup(result);
      setToken(nextToken);
      setStep("orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access failed");
    } finally {
      setLoading(false);
    }
  }

  function startMeasurement(order: PortalLookupOrder | null) {
    setSelectedOrder(order);
    setStep("measure");
    setError(null);
  }

  async function handleMeasurementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lookup || !token) return;

    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data: Record<string, number | string> = { unit: "cm" };

    for (const { key, label } of MEASUREMENT_FIELDS) {
      const raw = String(formData.get(key) ?? "").trim();
      if (!raw) continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num <= 0) {
        setError(`${label} must be a positive number`);
        setSubmitting(false);
        return;
      }
      data[key] = num;
    }

    if (Object.keys(data).length <= 1) {
      setError("Enter at least one measurement");
      setSubmitting(false);
      return;
    }

    try {
      const result = await vynedresClientApi.portalSubmitMeasurements(slug, {
        token: token.trim(),
        orderId: selectedOrder?.id,
        label: selectedOrder
          ? `Self-measurement — ${selectedOrder.orderNumber}`
          : "General profile (portal)",
        data,
      });
      setSuccessMessage(result.message);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit measurements");
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setStep("access");
    setLookup(null);
    setSelectedOrder(null);
    setToken("");
    setError(null);
    setSuccessMessage(null);
  }

  const activeOrders = lookup?.orders.filter((o) => o.canSubmitMeasurements) ?? [];
  const readonlyOrders = lookup?.orders.filter((o) => !o.canSubmitMeasurements) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <header className="mb-10 text-center">
        <p className="eyebrow">Client Portal</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight">{tenant.name}</h1>
        <div className="rule-gold mx-auto mt-5 max-w-[10rem]" />
        <p className="mt-5 text-sm font-light text-vynedres-ink/65">
          Track orders and submit your measurements with a studio invite link
        </p>
      </header>

      {step === "access" && (
        <section className="atelier-card overflow-hidden">
          <div className="rule-gold" />
          <div className="p-6">
            <p className="eyebrow">Secure access</p>
            <h2 className="font-display text-xl font-light text-vynedres-ink">
              Open your invite
            </h2>
            <p className="mt-2 text-sm text-vynedres-ink/55">
              Use the private link from your studio, or paste the invite token below.
              Email alone is no longer enough.
            </p>
            {loading && initialToken ? (
              <p className="mt-6 text-sm text-vynedres-ink/55">Checking invite…</p>
            ) : (
              <form onSubmit={handleAccessSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs text-vynedres-ink/55">Invite token</span>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste invite token"
                    className="mt-1 w-full rounded-xl border border-vynedres-ink/15 bg-white px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-vynedres-gold/40"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-vynedres-gold py-3 text-sm font-medium text-black disabled:opacity-50"
                >
                  {loading ? "Opening…" : "Continue"}
                </button>
              </form>
            )}
            <p className="mt-4 text-center text-xs text-vynedres-ink/45">
              Demo: ask the studio for Amara&apos;s invite, or open the seeded link from
              Getting Started.
            </p>
          </div>
        </section>
      )}

      {step === "orders" && lookup && (
        <section className="space-y-6">
          <div className="atelier-card p-6">
            <p className="eyebrow">Welcome back</p>
            <h2 className="mt-1 font-display text-2xl font-light">
              {lookup.client.firstName} {lookup.client.lastName}
            </h2>
            <button
              type="button"
              onClick={resetWizard}
              className="mt-3 text-xs text-vynedres-ink/50 hover:text-vynedres-golddeep"
            >
              Use a different invite
            </button>
          </div>

          {lookup.orders.length === 0 ? (
            <p className="text-center text-vynedres-ink/55">No orders on file yet.</p>
          ) : (
            <>
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-light text-vynedres-ink">Your orders</h3>
                  {activeOrders.map((order) => (
                    <article
                      key={order.id}
                      className="atelier-card-sm p-5 transition-colors hover:border-vynedres-gold/40"
                    >
                      <p className="font-medium">{order.garmentType}</p>
                      <p className="mt-1 text-sm text-vynedres-ink/55">{order.orderNumber}</p>
                      {order.fabric && (
                        <p className="mt-1 text-xs text-vynedres-ink/50">Fabric: {order.fabric}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-vynedres-gold/20 px-3 py-1 text-xs text-vynedres-golddeep">
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {order.hasMeasurements && (
                          <span className="text-xs text-emerald-600">
                            Measurements on file
                          </span>
                        )}
                      </div>
                      <OrderDateTimeline
                        variant="portal"
                        createdAt={order.createdAt}
                        dueDate={order.dueDate}
                        collectionDate={order.collectionDate}
                      />
                      <button
                        type="button"
                        onClick={() => startMeasurement(order)}
                        className="mt-4 w-full rounded-xl border border-vynedres-gold/40 py-2.5 text-sm text-vynedres-golddeep hover:bg-vynedres-gold/10"
                      >
                        {order.hasMeasurements
                          ? "Update measurements for this order"
                          : "Submit measurements for this order"}
                      </button>
                    </article>
                  ))}
                </div>
              )}

              {readonlyOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm text-vynedres-ink/55">Completed / archived</h3>
                  {readonlyOrders.map((order) => (
                    <article key={order.id} className="atelier-card-sm p-4 opacity-80">
                      <p className="text-sm font-medium">{order.garmentType}</p>
                      <p className="text-xs text-vynedres-ink/50">
                        {order.orderNumber} · {order.status.replace(/_/g, " ")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => startMeasurement(null)}
            className="w-full rounded-xl border border-vynedres-ink/15 py-3 text-sm text-vynedres-ink/75 hover:bg-vynedres-ink/[0.04]"
          >
            Save general measurement profile (not linked to an order)
          </button>
        </section>
      )}

      {step === "measure" && (
        <section className="atelier-card overflow-hidden">
          <div className="rule-gold" />
          <div className="p-6">
            <button
              type="button"
              onClick={() => setStep("orders")}
              className="text-xs text-vynedres-ink/50 hover:text-vynedres-golddeep"
            >
              ← Back to orders
            </button>
            <p className="mt-4 eyebrow">Fit Graph baseline</p>
            <h2 className="font-display text-xl font-light text-vynedres-ink">
              Measurement wizard
            </h2>
            {selectedOrder ? (
              <p className="mt-2 text-sm text-vynedres-ink/55">
                For <span className="text-vynedres-ink/75">{selectedOrder.garmentType}</span> (
                {selectedOrder.orderNumber}). Your studio uses these as the Fit Graph
                baseline before your first fitting.
              </p>
            ) : (
              <p className="mt-2 text-sm text-vynedres-ink/55">
                General profile for your account — not tied to a specific order.
              </p>
            )}

            <form onSubmit={handleMeasurementSubmit} className="mt-6 space-y-4">
              <div className="rounded-lg bg-vynedres-ink/[0.03] p-4 text-xs text-vynedres-ink/55">
                <p className="font-medium text-vynedres-ink/75">How to measure</p>
                <ul className="mt-2 space-y-1">
                  {MEASUREMENT_FIELDS.map(({ key, label }) => (
                    <li key={key}>
                      <span className="text-vynedres-ink/65">{label}:</span> {MEASURE_TIPS[key]}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">All values in centimetres (cm).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MEASUREMENT_FIELDS.map(({ key, label }) => (
                  <label key={key} className="text-xs">
                    <span className="text-vynedres-ink/55">{label} (cm)</span>
                    <input
                      name={key}
                      type="number"
                      step="0.1"
                      min="0"
                      className="mt-1 w-full rounded-lg border border-vynedres-ink/15 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-vynedres-gold py-3 text-sm font-medium text-black disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit measurements"}
              </button>
            </form>
          </div>
        </section>
      )}

      {step === "done" && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-2xl">✓</p>
          <h2 className="mt-3 font-display text-xl text-emerald-600">Submitted</h2>
          <p className="mt-2 text-sm text-vynedres-ink/75">{successMessage}</p>
          <button
            type="button"
            onClick={() => {
              setStep("orders");
              if (token) {
                void vynedresClientApi.portalSession(slug, token.trim()).then(setLookup);
              }
            }}
            className="mt-6 rounded-xl bg-vynedres-gold px-6 py-2.5 text-sm font-medium text-black"
          >
            Back to my orders
          </button>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="text-sm text-vynedres-golddeep hover:underline">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
