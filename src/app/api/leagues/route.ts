import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: { league: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => ({
    id: m.league.id,
    name: m.league.name,
    inviteCode: m.league.inviteCode,
    isOwner: m.league.ownerId === session.user.id,
    memberCount: m.league._count.members,
    joinedAt: m.joinedAt,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "League name is required" }, { status: 400 });
  }

  // Verify user still exists (guards against stale JWTs after DB reset)
  const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!userExists) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const inviteCode = generateInviteCode();

  try {
    const league = await prisma.league.create({
      data: {
        name: name.trim(),
        inviteCode,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id },
        },
      },
    });

    return NextResponse.json(
      { id: league.id, name: league.name, inviteCode: league.inviteCode },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/leagues] Prisma error:", err);
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
