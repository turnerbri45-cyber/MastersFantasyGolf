import { NextRequest, NextResponse } from "next/server";
import { fetchAndSyncScores } from "@/lib/espn";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndSyncScores();

  return NextResponse.json({
    ok: true,
    synced: result.synced,
    eventName: result.eventName,
    timestamp: new Date().toISOString(),
  });
}

// Allow manual GET trigger in development
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const result = await fetchAndSyncScores();

  return NextResponse.json({
    ok: true,
    synced: result.synced,
    eventName: result.eventName,
    timestamp: new Date().toISOString(),
  });
}
