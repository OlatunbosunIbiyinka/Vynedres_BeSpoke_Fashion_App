"use client";

import Link from "next/link";
import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { vynedresClientApi } from "@/lib/api";
import { setSession } from "@/lib/auth-storage";

export default function StudioLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [email, setEmail] = useState("studio@vynedres.com");
  const [password, setPassword] = useState("studio123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await vynedresClientApi.login(slug, email.trim(), password);
      if (result.tenant.slug !== slug) {
        throw new Error("This account belongs to a different studio");
      }
      setSession(result.token, result.user);
      router.replace(`/studio/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-vynedres-golddeep">
        Studio sign in
      </p>
      <h1 className="mt-2 font-display text-3xl">/{slug}</h1>
      <p className="mt-2 text-sm text-vynedres-ink/55">
        Staff only — clients use the public portal.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs text-vynedres-ink/55">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-vynedres-ink/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vynedres-gold/40"
          />
        </label>
        <label className="block">
          <span className="text-xs text-vynedres-ink/55">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-vynedres-ink/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vynedres-gold/40"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vynedres-gold py-3 text-sm font-medium text-black transition hover:bg-vynedres-gold/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-vynedres-ink/50">
        Demo: studio@vynedres.com / studio123
      </p>

      <Link
        href="/"
        className="mt-8 text-center text-sm text-vynedres-ink/55 hover:text-vynedres-golddeep"
      >
        ← Home
      </Link>
    </main>
  );
}
