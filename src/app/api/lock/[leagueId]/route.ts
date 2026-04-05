import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLockDeadline, isLockWindowOpen, isAfterLockDeadline } from "@/lib/lock";

const FINAL_PICK_COUNT = 6;

export async function GET(
  _req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const finalPicks = await prisma.finalPick.findMany({
    where: { userId: session.user.id, leagueId: params.leagueId },
    include: { golfer: true },
  });

  const draftPicks = await prisma.golferPick.findMany({
    where: { userId: session.user.id, leagueId: params.leagueId },
    include: { golfer: { include: { scores: true } } },
    orderBy: { pickedAt: "asc" },
  });

  return NextResponse.json({
    deadline: getLockDeadline().toISOString(),
    isLockOpen: isLockWindowOpen(),
    isAfterDeadline: isAfterLockDeadline(),
    hasFinalPicks: finalPicks.length > 0,
    finalPicks: finalPicks.map((p) => ({
      golferId: p.golferId,
      name: p.golfer.name,
      imageUrl: p.golfer.imageUrl,
      autoSelected: p.autoSelected,
      lockedAt: p.lockedAt,
    })),
    draftPicks: draftPicks.map((p) => ({
      golferId: p.golferId,
      name: p.golfer.name,
      imageUrl: p.golfer.imageUrl,
      worldRank: p.golfer.worldRank,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLockWindowOpen()) {
    return NextResponse.json({ error: "Lock window has closed" }, { status: 403 });
  }

  const { golferIds } = await req.json();

  if (!Array.isArray(golferIds) || golferIds.length !== FINAL_PICK_COUNT) {
    return NextResponse.json(
      { error: `Exactly ${FINAL_PICK_COUNT} golfers required` },
      { status: 400 }
    );
  }

  // Verify membership
  const membership = await prisma.leagueMember.findUnique({
    where: { userId_leagueId: { userId: session.user.id, leagueId: params.leagueId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  }

  // Verify all 6 are in the user's 8 draft picks
  const draftPicks = await prisma.golferPick.findMany({
    where: { userId: session.user.id, leagueId: params.leagueId },
  });
  const draftIds = new Set(draftPicks.map((p) => p.golferId));

  for (const id of golferIds) {
    if (!draftIds.has(id)) {
      return NextResponse.json(
        { error: `Golfer ${id} is not in your draft picks` },
        { status: 400 }
      );
    }
  }

  // Remove any existing final picks and replace
  await prisma.finalPick.deleteMany({
    where: { userId: session.user.id, leagueId: params.leagueId },
  });

  await prisma.finalPick.createMany({
    data: golferIds.map((golferId: string) => ({
      userId: session.user.id,
      leagueId: params.leagueId,
      golferId,
      autoSelected: false,
    })),
  });

  return NextResponse.json({ ok: true, locked: golferIds });
}
