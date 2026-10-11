"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getBrowserClient } from "@/lib/supabase";

export default function AdminPage() {
  const state = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "signed-out") router.replace("/admin/login");
  }, [state.status, router]);

  if (state.status === "ready") return <AdminDashboard side={state.side} email={state.session.user.email ?? ""} />;

  if (state.status === "not-admin") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg">This account isn&apos;t set up as an admin yet.</p>
        <button className="underline" onClick={() => getBrowserClient().auth.signOut()}>
          Sign out
        </button>
        <Link href="/" className="underline">Back to the site</Link>
      </main>
    );
  }

  return <main className="flex min-h-svh items-center justify-center text-stone-500">Loading…</main>;
}
