import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const lockDate = new Date(process.env.ROUND3_LOCK_DEADLINE ?? "2026-04-11T10:00:00-04:00");

  return (
    <div className="flex flex-col items-center justify-center min-h-[88vh] px-4 text-center">
      <div className="max-w-2xl w-full">

        {/* Crest / logo area */}
        <div className="mb-8 flex flex-col items-center">
          <svg width="64" height="72" viewBox="0 0 64 72" fill="none" className="mb-4 opacity-90">
            <rect x="4" y="0" width="5" height="72" fill="#d4af37"/>
            <polygon points="9,4 58,18 9,32" fill="#1a5c38" stroke="#d4af37" strokeWidth="1.5"/>
          </svg>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-masters-yellow tracking-tight">
            The Masters
          </h1>
          <p className="text-masters-yellow-light font-serif text-xl mt-1 tracking-widest uppercase" style={{ letterSpacing: "0.3em", opacity: 0.7 }}>
            Fantasy · 2026
          </p>
        </div>

        <p className="text-lg mb-1" style={{ color: "#c8b882" }}>
          Pick 8 golfers. Lock your best 6 before Round 3.
        </p>
        <p className="text-sm mb-8" style={{ color: "rgba(212,175,55,0.5)" }}>
          Augusta National · April 9–12, 2026 ·{" "}
          Round 3 lock:{" "}
          <span style={{ color: "rgba(212,175,55,0.8)" }}>
            {lockDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </span>
        </p>

        <div className="flex gap-4 justify-center mb-14">
          <Link href="/register" className="btn-gold text-base px-8 py-3 rounded font-serif">
            Create Account
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3 rounded font-serif">
            Sign In
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5 text-left">
          <div className="card">
            <div className="text-masters-yellow text-2xl mb-3 font-serif">I.</div>
            <h3 className="font-serif font-semibold text-masters-yellow-light mb-1">Draft Your Team</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a09070" }}>
              Select 8 golfers from the Masters field, sorted by betting odds.
            </p>
          </div>
          <div className="card">
            <div className="text-masters-yellow text-2xl mb-3 font-serif">II.</div>
            <h3 className="font-serif font-semibold text-masters-yellow-light mb-1">Lock Before Round 3</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a09070" }}>
              Choose your final 6 on Saturday morning. Miss the deadline and we&apos;ll auto-select your top performers.
            </p>
          </div>
          <div className="card">
            <div className="text-masters-yellow text-2xl mb-3 font-serif">III.</div>
            <h3 className="font-serif font-semibold text-masters-yellow-light mb-1">Compete Live</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a09070" }}>
              Scores update every 5 minutes. Lowest strokes plus position bonuses wins the jacket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
