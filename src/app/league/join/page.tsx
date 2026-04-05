"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function JoinLeaguePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to join league");
        return;
      }
      router.push(`/league/${data.id}/draft`);
    } catch (err) {
      console.error("Join league error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">Join a League</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(212,175,55,0.5)" }}>Enter your invite code</p>
        </div>
        <div className="card">
          {error && (
            <div className="rounded px-3 py-2 mb-4 text-sm" style={{ background: "rgba(127,29,29,0.5)", border: "1px solid rgba(252,165,165,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Invite Code</label>
              <input
                type="text"
                required
                className="input font-mono text-2xl tracking-widest text-center uppercase"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                style={{ letterSpacing: "0.3em" }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-serif text-base">
              {loading ? "Joining..." : "Join League"}
            </button>
          </form>
          <p className="text-center text-sm mt-5" style={{ color: "rgba(212,175,55,0.4)" }}>
            <Link href="/league/create" className="text-masters-yellow hover:text-masters-yellow-light transition-colors">
              Create your own league instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
