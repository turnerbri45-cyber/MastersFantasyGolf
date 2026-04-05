import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeagueLeaderboard } from "@/lib/scoring";
import { getLockDeadline, isAfterLockDeadline } from "@/lib/lock";

export async function GET(
  _req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { userId_leagueId: { userId: session.user.id, leagueId: params.leagueId } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  }

  const league = await prisma.league.findUnique({ where: { id: params.leagueId } });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  const rankings = await getLeagueLeaderboard(params.leagueId);

  return NextResponse.json({
    leagueId: league.id,
    leagueName: league.name,
    lockDeadline: getLockDeadline().toISOString(),
    isLocked: isAfterLockDeadline(),
    rankings,
  });
}
