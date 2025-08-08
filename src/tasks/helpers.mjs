import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import os from "os";

let app;

try {
  // only succeeds when run under electron (not pure node)
  app = await import("electron").then((m) => m.app);
} catch {
  app = null;
}

export function resolveProfileDir() {
  const base =
    app && app.isPackaged
      ? app.getPath("userData")
      : process.env.PROFILE_DIR || path.join(os.homedir(), ".local-bot");
  const dir = path.join(base, "playwright-profile");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function launchPersistant() {
  try {
    if (!process.env.PW_CHANNEL && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
      process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
    }

    const PROFILE_DIR = resolveProfileDir();

    const channelEnv = process.env.PW_CHANNEL;
    const channel = channelEnv || "chrome";

    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel,
      headless: false,
      viewport: null,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=BlockThirdPartyCookies",
      ],
    });

    const LOGIN_URL = process.env.LOGIN_URL ?? "https://sleeper.com/login";

    const page = await context.newPage();

    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

    return page;
  } catch (e) {
    console.error(e?.stack || e?.message || e);
  }
}
