import { prisma } from "./prisma";
import { isAfterLockDeadline, autoSelectFinalSix } from "./lock";

const POSITION_BONUS: Record<number, number> = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 10,
};

function parsePosition(pos: string | null | undefined): number | null {
  if (!pos || pos === "CUT" || pos === "WD" || pos === "DQ") return null;
  return parseInt(pos.replace("T", ""), 10);
}

/**
 * Calculates bonus points for a given position string.
 * Handles ties by averaging applicable bonuses (e.g., T2 with 2 players = (40+30)/2 = 35).
 * We approximate by just using the stated position's bonus — ESPN reports individual position.
 */
function getBonusPoints(position: string | null | undefined): number {
  const pos = parsePosition(position);
  if (pos === null) return 0;
  return POSITION_BONUS[pos] ?? 0;
}

export interface GolferResult {
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
  fantasyScore: number; // totalToPar - bonusPoints (lower = better)
  autoSelected: boolean;
}

export interface UserTeamScore {
  userId: string;
  userName: string;
  totalScore: number;
  golfers: GolferResult[];
  hasFinalPicks: boolean;
}

export async function calculateUserScore(
  userId: string,
  leagueId: string
): Promise<UserTeamScore> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // If past lock deadline and no final picks, auto-select
  let finalPickIds: string[] = [];
  let autoSelectedIds = new Set<string>();
  let hasFinalPicks = false;

  if (isAfterLockDeadline()) {
    const finalPicks = await prisma.finalPick.findMany({
      where: { userId, leagueId },
    });

    if (finalPicks.length === 0) {
      finalPickIds = await autoSelectFinalSix(userId, leagueId);
      autoSelectedIds = new Set(finalPickIds);
    } else {
      finalPickIds = finalPicks.map((p) => p.golferId);
      autoSelectedIds = new Set(
        finalPicks.filter((p) => p.autoSelected).map((p) => p.golferId)
      );
      hasFinalPicks = true;
    }
  } else {
    // Before lock: use draft picks (show live preview with all 8 or best 6)
    const draftPicks = await prisma.golferPick.findMany({
      where: { userId, leagueId },
    });
    finalPickIds = draftPicks.map((p) => p.golferId);
  }

  if (finalPickIds.length === 0) {
    return { userId, userName: user.name, totalScore: 0, golfers: [], hasFinalPicks };
  }

  // Load golfers with scores
  const golfers = await prisma.golfer.findMany({
    where: { id: { in: finalPickIds } },
    include: { scores: true },
  });

  const results: GolferResult[] = golfers.map((g) => {
    const r1 = g.scores.find((s) => s.round === 1)?.scoreToPar ?? null;
    const r2 = g.scores.find((s) => s.round === 2)?.scoreToPar ?? null;
    const r3 = g.scores.find((s) => s.round === 3)?.scoreToPar ?? null;
    const r4 = g.scores.find((s) => s.round === 4)?.scoreToPar ?? null;

    // Latest position from highest completed round
    const latestScore = [...g.scores].sort((a, b) => b.round - a.round)[0];
    const position = latestScore?.position ?? null;

    let totalToPar = 0;
    if (!g.isMadeCut) {
      // Missed cut: R1+R2 only
      totalToPar = (r1 ?? 0) + (r2 ?? 0);
    } else {
      totalToPar = (r1 ?? 0) + (r2 ?? 0) + (r3 ?? 0) + (r4 ?? 0);
    }

    const bonusPoints = g.isMadeCut ? getBonusPoints(position) : 0;
    const fantasyScore = totalToPar - bonusPoints;

    return {
      golferId: g.id,
      name: g.name,
      isMadeCut: g.isMadeCut,
      position,
      r1,
      r2,
      r3,
      r4,
      totalToPar,
      bonusPoints,
      fantasyScore,
      autoSelected: autoSelectedIds.has(g.id),
    };
  });

  const totalScore = results.reduce((sum, r) => sum + r.fantasyScore, 0);

  return { userId, userName: user.name, totalScore, golfers: results, hasFinalPicks };
}

export async function getLeagueLeaderboard(leagueId: string) {
  const members = await prisma.leagueMember.findMany({
    where: { leagueId },
    include: { user: true },
  });

  const scores = await Promise.all(
    members.map((m) => calculateUserScore(m.userId, leagueId))
  );

  // Lower score = better (golf convention)
  scores.sort((a, b) => a.totalScore - b.totalScore);

  return scores.map((s, i) => ({ rank: i + 1, ...s }));
}
