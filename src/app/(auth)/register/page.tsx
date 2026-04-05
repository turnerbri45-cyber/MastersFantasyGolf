"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg width="40" height="46" viewBox="0 0 40 46" fill="none" className="mx-auto mb-3 opacity-80">
            <rect x="2" y="0" width="3.5" height="46" fill="#d4af37"/>
            <polygon points="5.5,3 37,12 5.5,21" fill="#1a5c38" stroke="#d4af37" strokeWidth="1"/>
          </svg>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">Join the Competition</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(212,175,55,0.5)" }}>Masters Fantasy 2026</p>
        </div>

        <div className="card">
          {error && (
            <div className="rounded px-3 py-2 mb-4 text-sm" style={{ background: "rgba(127,29,29,0.5)", border: "1px solid rgba(252,165,165,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Name</label>
              <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Password</label>
              <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-serif text-base mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm mt-5" style={{ color: "rgba(212,175,55,0.4)" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-masters-yellow hover:text-masters-yellow-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
