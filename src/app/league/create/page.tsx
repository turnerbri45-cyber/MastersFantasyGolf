"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; inviteCode: string; name: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-[85vh]">
        <div className="font-serif text-lg" style={{ color: "rgba(212,175,55,0.6)" }}>Loading...</div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        let msg = "Failed to create league";
        try { msg = (await res.json()).error ?? msg; } catch {}
        setError(msg);
        return;
      }
      const data = await res.json();
      setCreated({ id: data.id, inviteCode: data.inviteCode, name: data.name });
    } catch (err) {
      console.error("Create league error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] px-4">
        <div className="card w-full max-w-md text-center">
          <div className="text-masters-yellow text-4xl font-serif mb-2">✦</div>
          <h1 className="text-2xl font-serif font-bold text-masters-yellow mb-1">{created.name}</h1>
          <p className="text-sm mb-6" style={{ color: "#a09070" }}>Share this invite code with your group:</p>
          <div className="rounded-xl py-6 px-4 mb-6" style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,175,55,0.3)" }}>
            <p className="text-4xl font-mono font-bold text-masters-yellow tracking-widest">
              {created.inviteCode}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href={`/league/${created.id}/draft`} className="btn-primary font-serif">Draft Golfers</Link>
            <Link href="/dashboard" className="btn-secondary font-serif">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">Create a League</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(212,175,55,0.5)" }}>Invite friends with a code</p>
        </div>
        <div className="card">
          {error && (
            <div className="rounded px-3 py-2 mb-4 text-sm" style={{ background: "rgba(127,29,29,0.5)", border: "1px solid rgba(252,165,165,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>League Name</label>
              <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Friday Group" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-serif text-base">
              {loading ? "Creating..." : "Create League"}
            </button>
          </form>
          <p className="text-center text-sm mt-5" style={{ color: "rgba(212,175,55,0.4)" }}>
            <Link href="/league/join" className="text-masters-yellow hover:text-masters-yellow-light transition-colors">
              Have an invite code? Join instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
