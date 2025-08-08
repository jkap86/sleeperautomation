import axios from "axios";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week");

  const base =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath!, "app.asar.unpacked")
      : process.cwd();

  const savePath = path.join(base, "src", "data", "schedule.json");

  const scheduleSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

  if (
    scheduleSavedParsed.updated_at >
      new Date().getTime() - 12 * 60 * 60 * 1000 &&
    scheduleSavedParsed.week === week
  ) {
    return NextResponse.json(scheduleSavedParsed);
  } else {
    const graphqlQuery = {
      query: `
        query batch_scores {
            scores(
                sport: "nfl"
                season_type: "regular"
                season: "${process.env.SEASON}"
                week: ${week}
            ) {
                game_id
                metadata 
                status
                start_time
            }
        }
    `,
    };

    const schedule_week = await axios.post(
      "https://sleeper.com/graphql",
      graphqlQuery
    );

    const schedule_obj: { [team: string]: { kickoff: number; opp: string } } =
      {};

    schedule_week.data.data.scores.forEach(
      (game: {
        start_time: number;
        metadata: { away_team: string; home_team: string };
      }) => {
        schedule_obj[game.metadata.away_team] = {
          kickoff: game.start_time,
          opp: "@ " + game.metadata.home_team,
        };

        schedule_obj[game.metadata.home_team] = {
          kickoff: game.start_time,
          opp: "vs " + game.metadata.away_team,
        };
      }
    );

    const scheduleUpdated = {
      data: schedule_obj,
      week,
      updated_at: new Date().getTime(),
    };

    fs.writeFileSync(savePath, JSON.stringify(scheduleUpdated));

    return NextResponse.json(scheduleUpdated);
  }
}
