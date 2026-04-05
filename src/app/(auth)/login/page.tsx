"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg width="40" height="46" viewBox="0 0 40 46" fill="none" className="mx-auto mb-3 opacity-80">
            <rect x="2" y="0" width="3.5" height="46" fill="#d4af37"/>
            <polygon points="5.5,3 37,12 5.5,21" fill="#1a5c38" stroke="#d4af37" strokeWidth="1"/>
          </svg>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">Welcome Back</h1>
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
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5 font-serif" style={{ color: "rgba(212,175,55,0.6)" }}>Password</label>
              <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-serif text-base mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm mt-5" style={{ color: "rgba(212,175,55,0.4)" }}>
            No account?{" "}
            <Link href="/register" className="text-masters-yellow hover:text-masters-yellow-light transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
