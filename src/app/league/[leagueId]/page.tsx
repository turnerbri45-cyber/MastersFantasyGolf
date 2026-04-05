"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useSWR from "swr";

interface GolferResult {
  golferId: string;
  name: string;
  isMadeCut: boolean;
  position: string | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  totalToPar: number;
  bonusPoints: number;
  fantasyScore: number;
  autoSelected: boolean;
}

interface RankedUser {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  golfers: GolferResult[];
  hasFinalPicks: boolean;
}

interface LeaderboardData {
  leagueId: string;
  leagueName: string;
  lockDeadline: string;
  isLocked: boolean;
  rankings: RankedUser[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatScore(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

function scoreColor(n: number): string {
  if (n < 0) return "#f87171";
  if (n === 0) return "#f0ede6";
  return "#a09070";
}

function ScoreCell({ val }: { val: number | null }) {
  if (val === null) return <td className="px-2 py-1.5 text-center text-sm" style={{ color: "rgba(160,144,112,0.3)" }}>—</td>;
  return <td className="px-2 py-1.5 text-center text-sm font-mono" style={{ color: scoreColor(val) }}>{formatScore(val)}</td>;
}

const RANK_MEDAL = ["🏆", "🥈", "🥉"];

export default function LeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error } = useSWR<LeaderboardData>(
    `/api/leagues/${leagueId}/leaderboard`,
    fetcher,
    { refreshInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-serif text-lg" style={{ color: "rgba(212,175,55,0.6)" }}>Loading leaderboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: "#fca5a5" }}>Failed to load leaderboard</div>
      </div>
    );
  }

  const myRank = data.rankings.find((r) => r.userId === session?.user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs tracking-widest uppercase font-serif mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
            Leaderboard
          </p>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">{data.leagueName}</h1>
        </div>
        <div className="flex gap-2 items-end">
          {myRank && !myRank.hasFinalPicks && !data.isLocked && (
            <Link href={`/league/${leagueId}/lock`} className="btn-gold text-sm py-1.5 px-3 rounded font-serif">
              Lock Picks
            </Link>
          )}
          <Link href={`/league/${leagueId}/members`} className="btn-secondary text-sm py-1.5 px-3 rounded font-serif">
            Members
          </Link>
          <Link href="/dashboard" className="btn-secondary text-sm py-1.5 px-3 rounded font-serif">
            Dashboard
          </Link>
        </div>
      </div>

      <p className="text-xs mb-6" style={{ color: "rgba(212,175,55,0.4)" }}>
        {data.isLocked ? "Picks locked · Scores update every minute" : "Pre-lock preview · Scores update every minute"}
        {" · "}Bonuses: 1st −50 · 2nd −40 · 3rd −30 · 4th −20 · 5th −10
      </p>

      {/* Rankings */}
      <div className="space-y-3">
        {data.rankings.map((user) => {
          const isMe = user.userId === session?.user?.id;
          const isExpanded = expanded === user.userId;

          return (
            <div key={user.userId} className="card transition-all"
              style={{ borderColor: isMe ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.15)" }}>
              <button
                className="w-full flex items-center gap-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : user.userId)}
              >
                {/* Rank */}
                <div className="text-2xl w-10 shrink-0 text-center">
                  {user.rank <= 3 ? RANK_MEDAL[user.rank - 1] : (
                    <span className="font-serif text-lg" style={{ color: "rgba(212,175,55,0.4)" }}>#{user.rank}</span>
                  )}
                </div>

                {/* Name + golfers */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-semibold text-masters-yellow-light">{user.userName}</span>
                    {isMe && <span className="badge-green text-xs">You</span>}
                    {!user.hasFinalPicks && !data.isLocked && <span className="badge-yellow text-xs">No lock yet</span>}
                    {user.golfers.some((g) => g.autoSelected) && <span className="badge-yellow text-xs">Auto-picked</span>}
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(160,144,112,0.7)" }}>
                    {user.golfers.map((g) => g.name).join(" · ")}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className="text-2xl font-serif font-bold" style={{ color: scoreColor(user.totalScore) }}>
                    {formatScore(user.totalScore)}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(212,175,55,0.35)" }}>fantasy total</div>
                </div>

                <div className="text-xs shrink-0" style={{ color: "rgba(212,175,55,0.35)" }}>
                  {isExpanded ? "▲" : "▼"}
                </div>
              </button>

              {/* Expanded breakdown */}
              {isExpanded && (
                <div className="mt-4 pt-4 overflow-x-auto" style={{ borderTop: "1px solid rgba(212,175,55,0.12)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-serif" style={{ color: "rgba(212,175,55,0.45)" }}>
                        <th className="text-left px-2 pb-2">Golfer</th>
                        <th className="px-2 pb-2">Pos</th>
                        <th className="px-2 pb-2">R1</th>
                        <th className="px-2 pb-2">R2</th>
                        <th className="px-2 pb-2">R3</th>
                        <th className="px-2 pb-2">R4</th>
                        <th className="px-2 pb-2">Total</th>
                        <th className="px-2 pb-2">Bonus</th>
                        <th className="px-2 pb-2">Fantasy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.golfers.map((g) => (
                        <tr key={g.golferId} className="transition-colors"
                          style={{
                            borderTop: "1px solid rgba(212,175,55,0.06)",
                            opacity: g.isMadeCut ? 1 : 0.45,
                          }}>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span style={{ color: "#d4c9b0" }} className="font-serif">{g.name}</span>
                              {!g.isMadeCut && <span className="badge-red text-xs">MC</span>}
                              {g.autoSelected && <span className="badge-yellow text-xs">Auto</span>}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center text-sm font-serif" style={{ color: "#c8b882" }}>
                            {g.position ?? "—"}
                          </td>
                          <ScoreCell val={g.r1} />
                          <ScoreCell val={g.r2} />
                          <ScoreCell val={g.r3} />
                          <ScoreCell val={g.r4} />
                          <td className="px-2 py-1.5 text-center text-sm font-mono font-semibold" style={{ color: scoreColor(g.totalToPar) }}>
                            {formatScore(g.totalToPar)}
                          </td>
                          <td className="px-2 py-1.5 text-center text-sm font-mono" style={{ color: "#f0c04e" }}>
                            {g.bonusPoints > 0 ? `−${g.bonusPoints}` : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center text-sm font-mono font-bold" style={{ color: scoreColor(g.fantasyScore) }}>
                            {formatScore(g.fantasyScore)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
