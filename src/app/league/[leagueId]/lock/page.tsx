"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface DraftPick {
  golferId: string;
  name: string;
  imageUrl: string | null;
  worldRank: number | null;
}

interface FinalPick {
  golferId: string;
  name: string;
  imageUrl: string | null;
  autoSelected: boolean;
  lockedAt: string;
}

interface LockStatus {
  deadline: string;
  isLockOpen: boolean;
  isAfterDeadline: boolean;
  hasFinalPicks: boolean;
  finalPicks: FinalPick[];
  draftPicks: DraftPick[];
}

const REQUIRED_FINAL = 6;

export default function LockPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<LockStatus | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/lock/${leagueId}`);
    if (res.ok) {
      const data: LockStatus = await res.json();
      setStatus(data);
      if (data.hasFinalPicks) {
        setSelected(new Set(data.finalPicks.map((p) => p.golferId)));
      }
    }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (!status?.deadline) return;
    const update = () => {
      const diff = new Date(status.deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Deadline passed"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status?.deadline]);

  function toggleSelect(golferId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(golferId)) { next.delete(golferId); }
      else if (next.size < REQUIRED_FINAL) { next.add(golferId); }
      return next;
    });
  }

  async function handleLock() {
    if (selected.size !== REQUIRED_FINAL) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/lock/${leagueId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ golferIds: [...selected] }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to lock picks");
    } else {
      await loadStatus();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-serif text-lg" style={{ color: "rgba(212,175,55,0.6)" }}>Loading...</div>
      </div>
    );
  }

  if (!status) return null;

  const deadline = new Date(status.deadline);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-serif font-bold text-masters-yellow mb-2">Lock Your Final 6</h1>
      <p className="text-sm mb-6" style={{ color: "#a09070" }}>
        Select 6 of your 8 golfers to count for scoring
      </p>

      {/* Deadline card */}
      <div className="card mb-8" style={{ borderColor: status.isAfterDeadline ? "rgba(252,165,165,0.25)" : "rgba(212,175,55,0.3)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase font-serif mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
              Round 3 Lock Deadline
            </p>
            <p style={{ color: "#d4c9b0" }} className="font-serif">
              {deadline.toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
                hour: "numeric", minute: "2-digit", timeZoneName: "short",
              })}
            </p>
          </div>
          {status.isAfterDeadline ? (
            <span className="badge-red text-sm px-3 py-1">Closed</span>
          ) : (
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-masters-yellow">{timeLeft}</div>
              <div className="text-xs" style={{ color: "rgba(212,175,55,0.45)" }}>remaining</div>
            </div>
          )}
        </div>
      </div>

      {/* Already locked */}
      {status.hasFinalPicks ? (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="badge-green text-sm px-3 py-1">Locked ✓</span>
            <span className="font-serif" style={{ color: "#a09070" }}>Your final 6 are confirmed</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {status.finalPicks.map((p) => (
              <div key={p.golferId} className="card flex items-center gap-3" style={{ borderColor: "rgba(212,175,55,0.3)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} width={40} height={40} className="object-cover" />
                  ) : <span className="text-lg">🏌️</span>}
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-sm text-masters-yellow-light truncate">{p.name}</div>
                  {p.autoSelected && <span className="badge-yellow text-xs">Auto</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <button onClick={() => router.push(`/league/${leagueId}`)} className="btn-primary font-serif">
              View Leaderboard →
            </button>
          </div>
        </div>
      ) : status.isAfterDeadline ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">⏰</div>
          <p className="font-serif text-masters-yellow-light font-semibold mb-1">Deadline has passed</p>
          <p className="text-sm" style={{ color: "#a09070" }}>
            Your best 6 from Rounds 1 & 2 will be auto-selected shortly.
          </p>
        </div>
      ) : status.draftPicks.length < 8 ? (
        <div className="card text-center py-10">
          <p className="font-serif text-masters-yellow-light font-semibold mb-1">
            Complete your draft first ({status.draftPicks.length}/8 picks)
          </p>
          <button onClick={() => router.push(`/league/${leagueId}/draft`)} className="btn-primary font-serif mt-4">
            Go to Draft
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-5" style={{ color: "#a09070" }}>
            Tap a golfer to select or deselect ·{" "}
            <span className="text-masters-yellow font-serif">{selected.size}/{REQUIRED_FINAL} selected</span>
          </p>

          {error && (
            <div className="rounded px-3 py-2 mb-4 text-sm" style={{ background: "rgba(127,29,29,0.5)", border: "1px solid rgba(252,165,165,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {status.draftPicks.map((p) => {
              const isSelected = selected.has(p.golferId);
              const isFull = selected.size >= REQUIRED_FINAL && !isSelected;
              return (
                <button
                  key={p.golferId}
                  onClick={() => toggleSelect(p.golferId)}
                  disabled={isFull}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "rgba(26,92,56,0.5)" : "rgba(15,61,36,0.35)",
                    border: isSelected ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(212,175,55,0.1)",
                    opacity: isFull ? 0.3 : 1,
                    cursor: isFull ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(212,175,55,0.15)" }}>
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} width={48} height={48} className="object-cover" />
                    ) : <span className="text-xl">🏌️</span>}
                  </div>
                  <div className="text-xs font-serif text-masters-yellow-light text-center leading-tight">{p.name}</div>
                  {isSelected && <div className="text-masters-yellow text-sm">✓</div>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleLock}
            disabled={selected.size !== REQUIRED_FINAL || submitting}
            className="btn-gold w-full py-3 text-lg font-serif rounded disabled:opacity-40"
          >
            {submitting
              ? "Locking..."
              : selected.size === REQUIRED_FINAL
              ? "Lock My Final 6 🔒"
              : `Select ${REQUIRED_FINAL - selected.size} more golfer${REQUIRED_FINAL - selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
