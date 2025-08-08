import { getLeagueDetails } from "@/utils/getLeagueDetails";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { League } from "@/lib/types";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id") as string;

  const base =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath!, "app.asar.unpacked")
      : process.cwd();

  const savePath = path.join(base, "src", "data", "leagues.json");

  const leaguesSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

  if (leaguesSavedParsed.updated_at > new Date().getTime() - 15 * 60 * 1000) {
    return NextResponse.json(leaguesSavedParsed);
  } else {
    const leagues = await axios.get(
      `https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/${process.env.SEASON}`
    );

    const leaguesDetailed = [];

    const BATCH_SIZE = 15;

    for (let i = 0; i < leagues.data.length; i += BATCH_SIZE) {
      const batchLeagues = await getLeagueDetails({
        leagues: leagues.data.slice(i, i + BATCH_SIZE),
        user_id: user_id,
      });

      leaguesDetailed.push(...batchLeagues);
    }

    const leaguesUpdated = {
      data: Object.fromEntries(
        leaguesDetailed
          .filter((l) => l.user_roster?.players?.length > 0)
          .map((l) => [
            l.league_id,
            {
              ...l,
              index: leagues.data.findIndex(
                (l2: League) => l.league_id === l2.league_id
              ),
            },
          ])
      ),
      updated_at: new Date().getTime(),
    };

    fs.writeFileSync(savePath, JSON.stringify(leaguesUpdated));

    return NextResponse.json(leaguesUpdated);
  }
}
