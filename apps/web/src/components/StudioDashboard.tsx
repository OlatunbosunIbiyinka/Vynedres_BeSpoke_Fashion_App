"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ClientMeasurementsPanel } from "@/components/ClientMeasurementsPanel";
import { NewClientForm } from "@/components/NewClientForm";
import { NewOrderForm } from "@/components/NewOrderForm";
import { OrderDatesEditor } from "@/components/OrderDatesEditor";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";
import { FitGraphPanel } from "@/components/FitGraphPanel";
import { PortalInviteButton } from "@/components/PortalInviteButton";
import { FitConfidenceBadge } from "@/components/FitConfidenceBadge";
import { FittingTimeline } from "@/components/FittingTimeline";
import { StudioInsights } from "@/components/StudioInsights";
import { StudioAssistant } from "@/components/StudioAssistant";
import {
  vynedresClientApi,
  type AuthUser,
  type Client,
  type FitSummary,
  type Order,
  type Tenant,
} from "@/lib/api";
import { clearSession, getStoredUser, getToken } from "@/lib/auth-storage";

export function StudioDashboard({ slug }: { slug: string }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fitSummaries, setFitSummaries] = useState<Record<string, FitSummary>>({});
  const [insightsRefresh, setInsightsRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace(`/studio/${slug}/login`);
      return;
    }

    try {
      setError(null);
      const [tenantData, clientsData, ordersData, summariesData] = await Promise.all([
        vynedresClientApi.getTenant(slug),
        vynedresClientApi.getClients(slug),
        vynedresClientApi.getOrders(slug),
        vynedresClientApi.getFitSummaries(slug),
      ]);

      const stored = getStoredUser();
      if (stored && stored.tenantId !== tenantData.id) {
        clearSession();
        router.replace(`/studio/${slug}/login`);
        return;
      }

      setTenant(tenantData);
      setUser(stored);
      setClients(clientsData);
      setOrders(ordersData);
      setFitSummaries(
        Object.fromEntries(summariesData.map((summary) => [summary.orderId, summary])),
      );
      setInsightsRefresh((n) => n + 1);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load studio";
      if (
        message.toLowerCase().includes("authentication") ||
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("access")
      ) {
        clearSession();
        router.replace(`/studio/${slug}/login`);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  function logout() {
    clearSession();
    router.replace(`/studio/${slug}/login`);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-vynedres-ink/55">Loading studio…</p>
      </main>
    );
  }

  if (error || !tenant) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-red-600">{error ?? "Studio not found"}</p>
        <Link href="/" className="mt-4 inline-block text-vynedres-golddeep">
          ← Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-vynedres-ink/10 pb-6">
        <div>
          <p className="eyebrow">Studio Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight">{tenant.name}</h1>
          <p className="mt-1 text-sm text-vynedres-ink/55">/{tenant.slug}</p>
          {user && (
            <p className="mt-2 text-xs text-vynedres-ink/50">
              Signed in as {user.name} ({user.role.toLowerCase()})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={logout}
            className="text-vynedres-ink/55 hover:text-vynedres-golddeep"
          >
            Sign out
          </button>
          <Link href="/" className="text-vynedres-ink/55 hover:text-vynedres-golddeep">
            ← Home
          </Link>
        </div>
      </header>

      <StudioAssistant tenantSlug={slug} />

      <StudioInsights tenantSlug={slug} refreshKey={insightsRefresh} />

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4">
            <p className="eyebrow">Atelier</p>
            <h2 className="font-display text-xl font-light leading-tight text-vynedres-ink">
              Clients
            </h2>
          </div>
          <NewClientForm tenantSlug={slug} onSuccess={load} />
          <ul className="mt-4 space-y-4">
            {clients.map((client) => (
              <li
                key={client.id}
                className="atelier-card-sm px-4 py-4 transition-colors hover:border-vynedres-gold/40"
              >
                <p className="text-sm font-medium">
                  {client.firstName} {client.lastName}
                </p>
                <p className="text-sm text-vynedres-ink/55">
                  {client._count?.orders ?? 0} orders ·{" "}
                  {client._count?.measurements ?? 0} measurement profiles
                </p>
                <ClientMeasurementsPanel
                  tenantSlug={slug}
                  clientId={client.id}
                  clientName={`${client.firstName} ${client.lastName}`}
                  measurementCount={client._count?.measurements ?? 0}
                  onSuccess={load}
                />
                <PortalInviteButton
                  tenantSlug={slug}
                  clientId={client.id}
                  clientName={`${client.firstName} ${client.lastName}`}
                  hasEmail={Boolean(client.email)}
                />
              </li>
            ))}
            {clients.length === 0 && (
              <p className="text-vynedres-ink/55">No clients yet.</p>
            )}
          </ul>
        </div>

        <div>
          <div className="mb-4">
            <p className="eyebrow">Workshop</p>
            <h2 className="font-display text-xl font-light leading-tight text-vynedres-ink">
              Production Pipeline
            </h2>
          </div>
          <NewOrderForm
            tenantSlug={slug}
            clients={clients.map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
            }))}
            onSuccess={load}
          />
          <ul className="mt-4 space-y-4">
            {orders.map((order) => {
              const fitSummary = fitSummaries[order.id];
              return (
              <li
                key={order.id}
                className="atelier-card-sm px-4 py-5 transition-colors hover:border-vynedres-gold/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{order.garmentType}</p>
                      <FitConfidenceBadge summary={fitSummary} />
                    </div>
                    <p className="text-sm text-vynedres-ink/55">
                      {order.orderNumber} · {order.client.firstName}{" "}
                      {order.client.lastName}
                    </p>
                    {fitSummary && (
                      <FittingTimeline summary={fitSummary} compact />
                    )}
                    {order.fabric && (
                      <p className="mt-1 text-xs text-vynedres-ink/50">Fabric: {order.fabric}</p>
                    )}
                    <OrderDatesEditor
                      tenantSlug={slug}
                      orderId={order.id}
                      createdAt={order.createdAt}
                      dueDate={order.dueDate}
                      collectionDate={order.collectionDate}
                      onSuccess={load}
                    />
                  </div>
                  <OrderStatusSelect
                    tenantSlug={slug}
                    orderId={order.id}
                    currentStatus={order.status}
                    onSuccess={load}
                  />
                </div>
                <FitGraphPanel
                  tenantSlug={slug}
                  orderId={order.id}
                  orderStatus={order.status}
                  onGraphChange={load}
                />
              </li>
            );
            })}
            {orders.length === 0 && (
              <p className="text-vynedres-ink/55">No orders yet.</p>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
