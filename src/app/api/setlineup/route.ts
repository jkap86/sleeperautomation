import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";
import { Matchup } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { token, league_id, roster_id, leg, round, starters } = body;

  const operationName = "update_matchup_leg";
  const query = `
    mutation update_matchup_leg(
        $league_id: String!,
        $roster_id: Int!,
        $leg: Int!,
        $round: Int!,
        $starters: [String!]!,
        $starters_games: Map
    ) {
        update_matchup_leg(
        league_id: $league_id,
        roster_id: $roster_id,
        leg: $leg,
        round: $round,
        starters: $starters,
        starters_games: $starters_games
        ) {
        league_id
        leg
        matchup_id
        roster_id
        round
        starters
        players
        player_map
        points
        starters_games
        custom_points
        proj_points
        max_points
        subs
        }
    }
    `;
  const variables = {
    league_id,
    roster_id: parseInt(roster_id),
    leg: parseInt(leg),
    round: parseInt(round),
    starters: starters.filter((x: string | null) => x),
    starter_games: {},
  };

  const res = await axios.post(
    "https://sleeper.com/graphql",
    {
      operationName,
      query,
      variables,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Pretend like a browser request so any origin/referrer checks pass
        Origin: "https://sleeper.com",
        Referer: `https://sleeper.com/leagues/${league_id}`,
        Authorization: token,
      },
    }
  );

  if (res.data.update_matchup_leg?.starters) {
    const base =
      process.env.NODE_ENV === "production"
        ? path.join(process.resourcesPath!, "app.asar.unpacked")
        : process.cwd();

    const savePath = path.join(base, "src", "data", "matchups.json");

    const matchupsSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

    const user_matchup = matchupsSavedParsed.data[league_id].find(
      (m: Matchup) => m.roster_id === roster_id
    );

    const matchupsUpdated = {
      ...matchupsSavedParsed,
      data: {
        ...matchupsSavedParsed.data,
        [league_id]: [
          ...matchupsSavedParsed[league_id].filter(
            (m: Matchup) => m.roster_id !== roster_id
          ),
          {
            ...user_matchup,
            starters: res.data.update_matchup_leg.starters.filter(
              (x: string) => x
            ),
          },
        ],
      },
    };

    fs.writeFileSync(savePath, JSON.stringify(matchupsUpdated));
  }

  return NextResponse.json(res.data);
}
