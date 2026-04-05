import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoSelectFinalSix } from "@/lib/lock";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all league members who haven't locked yet
  const allMembers = await prisma.leagueMember.findMany();
  const finalPicks = await prisma.finalPick.findMany({
    select: { userId: true, leagueId: true },
  });

  const lockedSet = new Set(finalPicks.map((p) => `${p.userId}:${p.leagueId}`));
  const pending = allMembers.filter(
    (m) => !lockedSet.has(`${m.userId}:${m.leagueId}`)
  );

  let autoSelected = 0;
  for (const member of pending) {
    const picks = await autoSelectFinalSix(member.userId, member.leagueId);
    if (picks.length > 0) autoSelected++;
  }

  return NextResponse.json({ processed: pending.length, autoSelected });
}
