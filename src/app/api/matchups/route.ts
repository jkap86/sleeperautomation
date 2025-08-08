import { Matchup } from "@/lib/types";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { league_ids, week } = body;

  const base =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath!, "app.asar.unpacked")
      : process.cwd();

  const savePath = path.join(base, "src", "data", "matchups.json");

  const matchupsSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

  if (
    matchupsSavedParsed.updated_at > new Date().getTime() - 1 * 60 * 1000 &&
    matchupsSavedParsed.week === week
  ) {
    return NextResponse.json(matchupsSavedParsed);
  } else {
    const BATCH_SIZE = 25;

    const matchups: { [league_id: string]: Matchup[] } = {};

    for (let i = 0; i < league_ids.length; i += BATCH_SIZE) {
      await Promise.all(
        league_ids.slice(i, i + BATCH_SIZE).map(async (league_id: string) => {
          const matchups_league = await axios.get(
            `https://api.sleeper.app/v1/league/${league_id}/matchups/${week}`
          );

          matchups[league_id] = matchups_league.data;
        })
      );
    }

    const matchupsUpdated = {
      data: matchups,
      week,
      updated_at: new Date().getTime(),
    };

    fs.writeFileSync(savePath, JSON.stringify(matchupsUpdated));

    return NextResponse.json(matchupsUpdated);
  }
}
