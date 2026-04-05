import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAfterLockDeadline } from "@/lib/lock";

const MAX_PICKS = 8;

export async function GET(
  _req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const picks = await prisma.golferPick.findMany({
    where: { userId: session.user.id, leagueId: params.leagueId },
    include: { golfer: { include: { scores: true } } },
    orderBy: { pickedAt: "asc" },
  });

  return NextResponse.json(picks.map((p) => ({
    id: p.id,
    golferId: p.golferId,
    name: p.golfer.name,
    imageUrl: p.golfer.imageUrl,
    worldRank: p.golfer.worldRank,
    pickedAt: p.pickedAt,
  })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAfterLockDeadline()) {
    return NextResponse.json({ error: "Draft window is closed" }, { status: 403 });
  }

  const { golferId } = await req.json();
  if (!golferId) {
    return NextResponse.json({ error: "golferId is required" }, { status: 400 });
  }

  // Verify membership
  const membership = await prisma.leagueMember.findUnique({
    where: { userId_leagueId: { userId: session.user.id, leagueId: params.leagueId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  }

  // Check pick limit
  const currentCount = await prisma.golferPick.count({
    where: { userId: session.user.id, leagueId: params.leagueId },
  });
  if (currentCount >= MAX_PICKS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PICKS} picks allowed` },
      { status: 400 }
    );
  }

  // Check golfer exists
  const golfer = await prisma.golfer.findUnique({ where: { id: golferId } });
  if (!golfer) {
    return NextResponse.json({ error: "Golfer not found" }, { status: 404 });
  }

  try {
    const pick = await prisma.golferPick.create({
      data: { userId: session.user.id, leagueId: params.leagueId, golferId },
    });
    return NextResponse.json({ id: pick.id, golferId, name: golfer.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Golfer already picked" }, { status: 409 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAfterLockDeadline()) {
    return NextResponse.json({ error: "Draft window is closed" }, { status: 403 });
  }

  const { golferId } = await req.json();

  await prisma.golferPick.deleteMany({
    where: { userId: session.user.id, leagueId: params.leagueId, golferId },
  });

  return NextResponse.json({ ok: true });
}
