import { prisma } from "./prisma";

const ESPN_LEADERBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga";

interface EspnLinescore {
  period: number;
  value?: number;
  displayValue?: string;
}

interface EspnStatusType {
  name: string;   // e.g. "STATUS_IN_PROGRESS", "STATUS_CUT"
  state: string;  // "in", "pre", "post"
}

interface EspnStatus {
  type?: EspnStatusType;
  period?: number; // current round number (when in progress)
  position?: { displayName: string; isTie: boolean };
}

interface EspnCompetitor {
  id: string;
  status: EspnStatus;
  score?: { value: number; displayValue: string };
  linescores?: EspnLinescore[];
  athlete: {
    id: string;
    displayName: string;
    flag?: { href: string };
    headshot?: { href: string };
    rankings?: { current: number };
  };
  statistics?: Array<{ name: string; value?: number; displayValue: string }>;
}

interface EspnCompetition {
  competitors: EspnCompetitor[];
}

interface EspnEvent {
  id: string;
  name: string;
  competitions: EspnCompetition[];
}

interface EspnLeaderboardResponse {
  events: EspnEvent[];
}

function parseScoreToPar(displayValue: string | undefined): number | null {
  if (!displayValue) return null;
  if (displayValue === "E") return 0;
  if (displayValue === "--" || displayValue === "MC" || displayValue === "CUT") return null;
  const parsed = parseInt(displayValue, 10);
  return isNaN(parsed) ? null : parsed;
}

export async function fetchAndSyncScores(): Promise<{
  synced: number;
  eventName: string | null;
}> {
  const res = await fetch(ESPN_LEADERBOARD_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`ESPN API returned ${res.status}`);
  }

  const data: EspnLeaderboardResponse = await res.json();

  if (!data.events?.length) return { synced: 0, eventName: null };

  // Prefer Masters; fall back to first event (for testing before tournament week)
  const event =
    data.events.find(
      (e) =>
        e.name?.toLowerCase().includes("masters") ||
        e.name?.toLowerCase().includes("augusta")
    ) ?? data.events[0];

  return syncEvent(event);
}

async function syncEvent(
  event: EspnEvent
): Promise<{ synced: number; eventName: string }> {
  const competition = event.competitions?.[0];
  if (!competition) return { synced: 0, eventName: event.name };

  let synced = 0;

  for (const competitor of competition.competitors) {
    const athleteId = competitor.athlete?.id ?? competitor.id;
    if (!athleteId) continue;

    // status.type.name is "STATUS_CUT", "STATUS_WD", "STATUS_IN_PROGRESS", etc.
    const statusName = competitor.status?.type?.name ?? "";
    const isMadeCut = !statusName.includes("CUT") && !statusName.includes("WD");

    // Position is on status.position.displayName (e.g. "T3", "1")
    const positionDisplay = isMadeCut
      ? competitor.status?.position?.displayName ?? null
      : "CUT";

    // Which round is currently in progress (so we can skip partial scores)
    const inProgressRound =
      competitor.status?.type?.state === "in"
        ? competitor.status?.period ?? null
        : null;

    // Upsert golfer
    await prisma.golfer.upsert({
      where: { id: athleteId },
      update: {
        name: competitor.athlete.displayName,
        imageUrl: competitor.athlete.headshot?.href ?? null,
        isMadeCut,
      },
      create: {
        id: athleteId,
        name: competitor.athlete.displayName,
        country: competitor.athlete.flag?.href
          ? extractCountry(competitor.athlete.flag.href)
          : null,
        imageUrl: competitor.athlete.headshot?.href ?? null,
        worldRank: competitor.athlete.rankings?.current ?? null,
        isMadeCut,
      },
    });

    // Upsert per-round scores
    if (competitor.linescores && competitor.linescores.length > 0) {
      for (const linescore of competitor.linescores) {
        const round = linescore.period;
        if (round < 1 || round > 4) continue;

        // Skip the round that is currently in progress (partial hole count)
        if (round === inProgressRound) continue;

        // value is raw strokes for the completed round
        const strokes =
          typeof linescore.value === "number" && linescore.value > 0
            ? Math.round(linescore.value)
            : null;

        // displayValue is score to par for that round ("-4", "E", "+2")
        const scoreToPar = parseScoreToPar(linescore.displayValue);

        // Only store if we have actual data for this round
        if (strokes === null && scoreToPar === null) continue;

        const isLatestRound = round === (competitor.linescores?.length ?? 0) ||
          (inProgressRound !== null && round === inProgressRound - 1);

        await prisma.tournamentScore.upsert({
          where: { golferId_round: { golferId: athleteId, round } },
          update: {
            strokes,
            scoreToPar,
            position: isLatestRound ? positionDisplay : null,
          },
          create: {
            golferId: athleteId,
            round,
            strokes,
            scoreToPar,
            position: isLatestRound ? positionDisplay : null,
          },
        });
      }
    }

    synced++;
  }

  return { synced, eventName: event.name };
}

function extractCountry(flagHref: string): string | null {
  const match = flagHref.match(/\/([a-z]{2,3})\.png/i);
  return match ? match[1].toUpperCase() : null;
}

export async function getMastersField() {
  return prisma.golfer.findMany({
    orderBy: [{ oddsRank: "asc" }, { odds: "asc" }, { name: "asc" }],
    include: { scores: true },
  });
}
