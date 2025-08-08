import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { token, league_id, player_id } = body;

  console.log({ token, league_id, player_id });

  const operationName = "add_league_player_trade_block";
  const query = `
        mutation add_league_player_trade_block($league_id: String!, $player_id: String!) {
        add_league_player_trade_block(league_id: $league_id, player_id: $player_id) {
            player_id
            league_id
            metadata
            settings
        }
        }`;

  const variables = { league_id, player_id };

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

  return NextResponse.json(res.data);
}
