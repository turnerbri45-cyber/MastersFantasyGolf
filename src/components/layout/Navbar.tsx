"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav
      className="px-4 py-3 border-b"
      style={{
        background: "linear-gradient(90deg, rgba(10,31,19,0.97) 0%, rgba(15,61,36,0.97) 50%, rgba(10,31,19,0.97) 100%)",
        borderColor: "rgba(212,175,55,0.3)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Masters-style flag icon */}
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none" className="shrink-0">
            <rect x="2" y="0" width="2.5" height="32" fill="#d4af37" opacity="0.8"/>
            <polygon points="4.5,2 24,8 4.5,14" fill="#1a5c38" stroke="#d4af37" strokeWidth="0.8"/>
          </svg>
          <div>
            <div className="text-masters-yellow font-serif font-bold text-lg leading-tight group-hover:text-masters-yellow-light transition-colors">
              The Masters
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.55)", letterSpacing: "0.2em" }}>
              Fantasy · 2026
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm transition-colors hover:text-masters-yellow" style={{ color: "#c8b882" }}>
                My Leagues
              </Link>
              <span className="text-sm" style={{ color: "rgba(212,175,55,0.45)" }}>
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm transition-colors hover:text-masters-yellow"
                style={{ color: "rgba(212,175,55,0.45)" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm transition-colors hover:text-masters-yellow" style={{ color: "#c8b882" }}>
                Sign in
              </Link>
              <Link href="/register" className="btn-gold text-sm py-1.5 px-4 rounded">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
