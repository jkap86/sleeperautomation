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

  const savePath = path.join(base, "src", "data", "projections.json");

  const projectionsSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

  if (
    projectionsSavedParsed.updated_at > new Date().getTime() - 5 * 60 * 1000 &&
    projectionsSavedParsed.week === week
  ) {
    return NextResponse.json(projectionsSavedParsed);
  } else {
    const projections: {
      data: { player_id: string; stats: { [cat: string]: number } }[];
    } = await axios.get(
      `https://api.sleeper.com/projections/nfl/${process.env.SEASON}/${week}?season_type=regular`
    );

    const projections_obj: { [player_id: string]: { [cat: string]: number } } =
      {};

    projections.data
      .filter((p) => p.stats.pts_ppr)
      .forEach((p) => {
        projections_obj[p.player_id] = p.stats;
      });

    const projectionsUpdated = {
      data: projections_obj,
      week,
      updated_at: new Date().getTime(),
    };

    fs.writeFileSync(savePath, JSON.stringify(projectionsUpdated));

    return NextResponse.json(projectionsUpdated);
  }
}
