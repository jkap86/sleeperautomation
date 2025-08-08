import axios from "axios";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const base =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath!, "app.asar.unpacked")
      : process.cwd();

  const savePath = path.join(base, "src", "data", "allplayers.json");

  const allplayersSavedParsed = JSON.parse(fs.readFileSync(savePath, "utf-8"));

  if (
    allplayersSavedParsed.updated_at >
    new Date().getTime() - 12 * 60 * 60 * 1000
  ) {
    return NextResponse.json(allplayersSavedParsed);
  } else {
    const allplayers = await axios.get("https://sleeper.app/v1/players/nfl");

    const allplayersUpdated = {
      data: Object.values(allplayers.data),
      updated_at: new Date().getTime(),
    };

    fs.writeFileSync(savePath, JSON.stringify(allplayersUpdated));

    return NextResponse.json(allplayersUpdated);
  }
}
