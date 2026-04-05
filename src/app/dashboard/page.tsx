import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.leagueMember.findMany({
    where: { userId: session.user.id },
    include: { league: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const draftCounts = await prisma.golferPick.groupBy({
    by: ["leagueId"],
    where: { userId: session.user.id, leagueId: { in: memberships.map((m) => m.leagueId) } },
    _count: true,
  });
  const draftCountMap = Object.fromEntries(draftCounts.map((d) => [d.leagueId, d._count]));

  const finalPicks = await prisma.finalPick.findMany({
    where: { userId: session.user.id, leagueId: { in: memberships.map((m) => m.leagueId) } },
    select: { leagueId: true },
  });
  const lockStatusMap: Record<string, boolean> = {};
  for (const fp of finalPicks) lockStatusMap[fp.leagueId] = true;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1 font-serif" style={{ color: "rgba(212,175,55,0.5)" }}>
            Masters Fantasy 2026
          </p>
          <h1 className="text-3xl font-serif font-bold text-masters-yellow">
            {session.user.name}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/league/join" className="btn-secondary text-sm py-1.5 px-4 rounded font-serif">
            Join League
          </Link>
          <Link href="/league/create" className="btn-primary text-sm py-1.5 px-4 rounded font-serif">
            + New League
          </Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="card text-center py-16">
          <svg width="48" height="56" viewBox="0 0 48 56" fill="none" className="mx-auto mb-5 opacity-40">
            <rect x="2" y="0" width="4" height="56" fill="#d4af37"/>
            <polygon points="6,4 44,16 6,28" fill="#1a5c38" stroke="#d4af37" strokeWidth="1.5"/>
          </svg>
          <h2 className="text-xl font-serif text-masters-yellow-light mb-2">No leagues yet</h2>
          <p className="text-sm mb-8" style={{ color: "#a09070" }}>Create a league or join one with an invite code to get started.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/league/join" className="btn-secondary font-serif">Join with Code</Link>
            <Link href="/league/create" className="btn-gold font-serif">Create League</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map((m) => {
            const picks = draftCountMap[m.leagueId] ?? 0;
            const locked = lockStatusMap[m.leagueId] ?? false;

            return (
              <div key={m.leagueId} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-serif font-semibold text-masters-yellow-light">{m.league.name}</h2>
                    {m.league.ownerId === session.user.id && (
                      <span className="badge-yellow text-xs">Commissioner</span>
                    )}
                    {locked && <span className="badge-green text-xs">Locked ✓</span>}
                  </div>
                  <p className="text-sm" style={{ color: "#a09070" }}>
                    {m.league._count.members} member{m.league._count.members !== 1 ? "s" : ""} ·{" "}
                    {picks}/8 picks · Code:{" "}
                    <span className="font-mono tracking-widest text-masters-yellow" style={{ opacity: 0.8 }}>{m.league.inviteCode}</span>
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  {picks < 8 && (
                    <Link href={`/league/${m.leagueId}/draft`} className="btn-primary text-sm py-1.5 px-3 rounded font-serif">
                      Draft
                    </Link>
                  )}
                  {picks === 8 && !locked && (
                    <Link href={`/league/${m.leagueId}/lock`} className="btn-gold text-sm py-1.5 px-3 rounded font-serif">
                      Lock Picks
                    </Link>
                  )}
                  <Link href={`/league/${m.leagueId}`} className="btn-secondary text-sm py-1.5 px-3 rounded font-serif">
                    Leaderboard
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
