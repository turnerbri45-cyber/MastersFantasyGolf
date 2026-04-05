import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMastersField } from "@/lib/espn";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const golfers = await getMastersField();

  return NextResponse.json(
    golfers.map((g) => ({
      id: g.id,
      name: g.name,
      country: g.country,
      worldRank: g.worldRank,
      odds: g.odds,
      oddsRank: g.oddsRank,
      imageUrl: g.imageUrl,
      isMadeCut: g.isMadeCut,
    }))
  );
}
