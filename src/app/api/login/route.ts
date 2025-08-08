import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "os";

export const runtime = "nodejs";

export async function POST() {
  const userDataDir =
    (process.env.ELECTRON_USER_DATA as string) ??
    path.join(os.homedir(), ".local-bot");

  console.log("userDataDir is", userDataDir);

  const profileDir = path.join(userDataDir, "playwright-profile");

  const base =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath!, "app.asar.unpacked")
      : process.cwd();
  const script = path.join(base, "src", "tasks", "login.mjs");
  // Fire-and-forget detached child so the request returns immediately

  const child = spawn(process.execPath, [script], {
    env: { ...process.env, PROFILE_DIR: profileDir, ELECTRON_RUN_AS_NODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    //detached: true,
  });

  let out = "";
  let err = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (c) => (out += c));
  child.stderr.on("data", (c) => (err += c));

  const code: number = await new Promise((res) => child.on("close", res));

  const data = JSON.parse(out);

  return NextResponse.json({
    token: JSON.parse(data.token),
    user_id: JSON.parse(data.user_id),
    code,
  });
}
