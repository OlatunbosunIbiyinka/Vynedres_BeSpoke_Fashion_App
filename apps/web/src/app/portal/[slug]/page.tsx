import { PortalClient } from "@/components/PortalClient";
import { vynedresApi } from "@/lib/api";
import Link from "next/link";

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  let tenant;
  let error: string | null = null;

  try {
    tenant = await vynedresApi.getTenant(slug);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load portal";
  }

  if (error || !tenant) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-red-600">{error ?? "Portal not found"}</p>
        <Link href="/" className="mt-4 inline-block text-vynedres-golddeep">
          ← Back home
        </Link>
      </main>
    );
  }

  return (
    <PortalClient slug={slug} tenant={tenant} initialToken={token?.trim() || null} />
  );
}
