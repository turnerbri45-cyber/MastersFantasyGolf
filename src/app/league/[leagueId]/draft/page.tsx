"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  worldRank: number | null;
  odds: number | null;
  oddsRank: number | null;
  imageUrl: string | null;
  isMadeCut: boolean;
}

interface Pick {
  golferId: string;
  name: string;
  imageUrl: string | null;
  worldRank: number | null;
  odds?: number | null;
}

const MAX_PICKS = 8;

function formatOdds(odds: number | null): string {
  if (!odds) return "";
  return `+${odds.toLocaleString()}`;
}

function oddsColor(oddsRank: number | null): string {
  if (!oddsRank) return "rgba(212,175,55,0.4)";
  if (oddsRank <= 5) return "#f0c04e";
  if (oddsRank <= 15) return "#c8b882";
  if (oddsRank <= 30) return "#a09070";
  return "rgba(160,144,112,0.6)";
}

export default function DraftPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();

  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [golfersRes, picksRes] = await Promise.all([
      fetch("/api/golfers"),
      fetch(`/api/draft/${leagueId}`),
    ]);
    if (golfersRes.ok) setGolfers(await golfersRes.json());
    if (picksRes.ok) setPicks(await picksRes.json());
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadData(); }, [loadData]);

  const pickedIds = new Set(picks.map((p) => p.golferId));
  const filtered = golfers.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  async function togglePick(golfer: Golfer) {
    setActionLoading(golfer.id);
    setError("");
    const isPicked = pickedIds.has(golfer.id);
    const res = await fetch(`/api/draft/${leagueId}`, {
      method: isPicked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ golferId: golfer.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Action failed");
    } else {
      await loadData();
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: "rgba(212,175,55,0.6)" }} className="font-serif text-lg">Loading field...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">Draft Your Team</h1>
          <p className="text-sm mt-1" style={{ color: "#a09070" }}>
            Select {MAX_PICKS} golfers · Listed by win odds (favorite → longshot)
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-serif font-bold text-masters-yellow">{picks.length}<span style={{ color: "rgba(240,192,78,0.4)" }}>/{MAX_PICKS}</span></div>
          <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.45)" }}>picks</div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 text-sm" style={{ background: "rgba(127,29,29,0.5)", border: "1px solid rgba(252,165,165,0.3)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Your team */}
      {picks.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-serif text-masters-yellow text-sm tracking-widest uppercase mb-3" style={{ opacity: 0.8 }}>
            Your Team — {picks.length}/{MAX_PICKS}
          </h2>
          <div className="flex flex-wrap gap-2">
            {picks.map((p) => (
              <button
                key={p.golferId}
                onClick={() => togglePick({ id: p.golferId, name: p.name, country: null, worldRank: p.worldRank, odds: p.odds ?? null, oddsRank: null, imageUrl: p.imageUrl, isMadeCut: true })}
                disabled={actionLoading === p.golferId}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded transition-all group"
                style={{
                  background: "rgba(26,92,56,0.35)",
                  border: "1px solid rgba(26,92,56,0.8)",
                  color: "#d4c9b0",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(127,29,29,0.35)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(252,165,165,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(26,92,56,0.35)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,92,56,0.8)"; }}
              >
                <span>{p.name}</span>
                <span style={{ color: "rgba(252,165,165,0.5)" }} className="text-xs">✕</span>
              </button>
            ))}
          </div>
          {picks.length === MAX_PICKS && (
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(212,175,55,0.15)" }}>
              <p className="text-sm text-masters-yellow font-serif">
                Team complete — now lock your final 6 before Round 3
              </p>
              <button
                onClick={() => router.push(`/league/${leagueId}/lock`)}
                className="btn-gold text-sm py-1.5 px-4 rounded font-serif"
              >
                Lock Picks →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          className="input text-sm"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Field */}
      {golfers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-masters-yellow text-4xl font-serif mb-4">⛳</div>
          <h2 className="text-xl font-serif text-masters-yellow-light mb-2">Field not loaded yet</h2>
          <p className="text-sm" style={{ color: "#a09070" }}>The Masters field will appear here before tournament week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filtered.map((golfer, idx) => {
            const isPicked = pickedIds.has(golfer.id);
            const isFull = picks.length >= MAX_PICKS && !isPicked;

            return (
              <button
                key={golfer.id}
                onClick={() => !isFull && togglePick(golfer)}
                disabled={isFull || actionLoading === golfer.id}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: isPicked
                    ? "rgba(26,92,56,0.5)"
                    : isFull
                    ? "rgba(8,24,14,0.4)"
                    : "rgba(15,61,36,0.35)",
                  border: isPicked
                    ? "1px solid rgba(212,175,55,0.5)"
                    : isFull
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "1px solid rgba(212,175,55,0.12)",
                  opacity: isFull ? 0.4 : 1,
                  cursor: isFull ? "not-allowed" : "pointer",
                }}
              >
                {/* Rank number */}
                <div className="text-right shrink-0 w-7">
                  <div className="text-xs font-serif" style={{ color: oddsColor(golfer.oddsRank) }}>
                    {golfer.oddsRank ?? idx + 1}
                  </div>
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  {golfer.imageUrl ? (
                    <Image src={golfer.imageUrl} alt={golfer.name} width={36} height={36} className="object-cover" />
                  ) : (
                    <span className="text-base">🏌️</span>
                  )}
                </div>

                {/* Name + odds */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: isPicked ? "#f0ede6" : isFull ? "#555" : "#d4c9b0" }}>
                    {golfer.name}
                  </div>
                  {golfer.odds && (
                    <div className="text-xs" style={{ color: oddsColor(golfer.oddsRank) }}>
                      {formatOdds(golfer.odds)}
                    </div>
                  )}
                </div>

                {isPicked && (
                  <div className="text-masters-yellow text-sm shrink-0">✓</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
