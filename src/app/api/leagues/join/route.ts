import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({
    where: { inviteCode: inviteCode.trim().toUpperCase() },
  });

  if (!league) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existing = await prisma.leagueMember.findUnique({
    where: { userId_leagueId: { userId: session.user.id, leagueId: league.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member of this league" }, { status: 409 });
  }

  await prisma.leagueMember.create({
    data: { userId: session.user.id, leagueId: league.id },
  });

  return NextResponse.json({ id: league.id, name: league.name });
}
