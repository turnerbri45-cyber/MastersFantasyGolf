import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MembersPage({ params }: { params: { leagueId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const league = await prisma.league.findUnique({
    where: { id: params.leagueId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!league) notFound();
  if (!league.members.some((m) => m.userId === session.user.id)) redirect("/dashboard");

  const pickCounts = await prisma.golferPick.groupBy({
    by: ["userId"],
    where: { leagueId: params.leagueId, userId: { in: league.members.map((m) => m.userId) } },
    _count: true,
  });
  const pickMap = Object.fromEntries(pickCounts.map((p) => [p.userId, p._count]));

  const finalPickCounts = await prisma.finalPick.groupBy({
    by: ["userId"],
    where: { leagueId: params.leagueId, userId: { in: league.members.map((m) => m.userId) } },
    _count: true,
  });
  const finalPickMap = Object.fromEntries(finalPickCounts.map((p) => [p.userId, p._count]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase font-serif mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Members</p>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">{league.name}</h1>
        </div>
        <Link href={`/league/${params.leagueId}`} className="btn-secondary text-sm py-1.5 px-3 rounded font-serif">
          Leaderboard
        </Link>
      </div>

      {/* Invite code */}
      <div className="card mb-6" style={{ borderColor: "rgba(212,175,55,0.3)" }}>
        <p className="text-xs tracking-widest uppercase font-serif mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Invite Code</p>
        <p className="font-mono text-3xl font-bold text-masters-yellow tracking-widest">{league.inviteCode}</p>
        <p className="text-xs mt-1" style={{ color: "#a09070" }}>Share this code so friends can join</p>
      </div>

      <div className="space-y-3">
        {league.members.map((m) => {
          const picks = pickMap[m.userId] ?? 0;
          const locked = (finalPickMap[m.userId] ?? 0) > 0;
          const isMe = m.userId === session.user.id;

          return (
            <div key={m.userId} className="card flex items-center justify-between"
              style={{ borderColor: isMe ? "rgba(212,175,55,0.35)" : "rgba(212,175,55,0.12)" }}>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-semibold text-masters-yellow-light">{m.user.name}</span>
                  {m.userId === league.ownerId && <span className="badge-green text-xs">Commissioner</span>}
                  {isMe && <span className="badge-yellow text-xs">You</span>}
                </div>
                <p className="text-sm mt-0.5" style={{ color: "#a09070" }}>{picks}/8 draft picks</p>
              </div>
              <div>
                {locked ? (
                  <span className="badge-green">Locked ✓</span>
                ) : picks === 8 ? (
                  <span className="badge-yellow">Not locked</span>
                ) : (
                  <span className="text-xs" style={{ color: "rgba(160,144,112,0.5)" }}>Drafting</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
