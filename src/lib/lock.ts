import { prisma } from "./prisma";

export function getLockDeadline(): Date {
  const raw = process.env.ROUND3_LOCK_DEADLINE;
  if (!raw) throw new Error("ROUND3_LOCK_DEADLINE env var is not set");
  return new Date(raw);
}

export function isLockWindowOpen(): boolean {
  return new Date() < getLockDeadline();
}

export function isAfterLockDeadline(): boolean {
  return new Date() >= getLockDeadline();
}

/**
 * Auto-select the best 6 golfers (by R1+R2 score) for a user+league
 * that hasn't locked their picks yet. Called by cron or lazily at query time.
 */
export async function autoSelectFinalSix(
  userId: string,
  leagueId: string
): Promise<string[]> {
  // Check if already locked
  const existing = await prisma.finalPick.findMany({
    where: { userId, leagueId },
  });
  if (existing.length > 0) return existing.map((p) => p.golferId);

  // Load the 8 draft picks
  const picks = await prisma.golferPick.findMany({
    where: { userId, leagueId },
    include: {
      golfer: {
        include: { scores: { where: { round: { in: [1, 2] } } } },
      },
    },
  });

  if (picks.length === 0) return [];

  // Score each golfer by R1+R2 scoreToPar (lower = better, null = worst)
  const scored = picks.map((pick) => {
    const r1 = pick.golfer.scores.find((s) => s.round === 1)?.scoreToPar ?? 999;
    const r2 = pick.golfer.scores.find((s) => s.round === 2)?.scoreToPar ?? 999;
    return { golferId: pick.golferId, total: r1 + r2 };
  });

  scored.sort((a, b) => a.total - b.total);
  const top6 = scored.slice(0, 6).map((s) => s.golferId);

  const deadline = getLockDeadline();

  for (const golferId of top6) {
    await prisma.finalPick.upsert({
      where: { userId_leagueId_golferId: { userId, leagueId, golferId } },
      update: {},
      create: { userId, leagueId, golferId, lockedAt: deadline, autoSelected: true },
    });
  }

  return top6;
}
