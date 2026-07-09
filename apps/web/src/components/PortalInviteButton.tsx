"use client";

import { useState } from "react";
import { vynedresClientApi } from "@/lib/api";

type PortalInviteButtonProps = {
  tenantSlug: string;
  clientId: string;
  clientName: string;
  hasEmail: boolean;
};

export function PortalInviteButton({
  tenantSlug,
  clientId,
  clientName,
  hasEmail,
}: PortalInviteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createInvite() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const result = await vynedresClientApi.createPortalInvite(tenantSlug, clientId);
      setInviteUrl(result.inviteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setError("Could not copy — select the link manually");
    }
  }

  if (!hasEmail) {
    return (
      <p className="mt-2 text-xs text-vynedres-ink/45">
        Add an email to issue a portal invite for {clientName}.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={createInvite}
        disabled={loading}
        className="text-xs text-vynedres-golddeep hover:underline disabled:opacity-50"
      >
        {loading
          ? "Creating invite…"
          : inviteUrl
            ? "Create new portal invite"
            : "Create portal invite"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {inviteUrl && (
        <div className="rounded-lg border border-vynedres-ink/10 bg-vynedres-ink/[0.02] p-3">
          <p className="text-[10px] uppercase tracking-wide text-vynedres-ink/45">
            Private link for {clientName}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-vynedres-ink/75">
            {inviteUrl}
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-2 text-xs text-vynedres-golddeep hover:underline"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <p className="mt-2 text-[10px] text-vynedres-ink/45">
            Share by WhatsApp or email. The raw token is shown only once — copy it now.
          </p>
        </div>
      )}
    </div>
  );
}
