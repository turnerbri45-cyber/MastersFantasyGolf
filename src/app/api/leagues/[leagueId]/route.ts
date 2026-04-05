import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const league = await prisma.league.findUnique({
    where: { id: params.leagueId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  const isMember = league.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  }

  return NextResponse.json({
    id: league.id,
    name: league.name,
    inviteCode: league.inviteCode,
    ownerId: league.ownerId,
    isOwner: league.ownerId === session.user.id,
    members: league.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.joinedAt,
    })),
  });
}
