"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError("That email and password didn't match. Please try again.");
    else router.replace("/admin");
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-[linear-gradient(110deg,#fff4e6_0_50%,#3d2412_50%_100%)] p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="text-center">
          <h1 className="font-display text-3xl font-black italic">Welcome back</h1>
          <p className="mt-1 text-stone-500">Sign in to update your gallery.</p>
        </div>

        {!isSupabaseConfigured && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Supabase isn&apos;t connected yet. Add the keys to <code>.env.local</code> (see the README).
          </p>
        )}

        <label className="block">
          <span className="text-lg font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-lg outline-none focus:border-stone-800"
          />
        </label>
        <label className="block">
          <span className="text-lg font-medium">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-lg outline-none focus:border-stone-800"
          />
        </label>

        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}

        <button
          disabled={busy || !isSupabaseConfigured}
          className="w-full rounded-xl bg-stone-900 py-4 text-lg font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
