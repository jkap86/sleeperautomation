import { launchPersistant } from "./helpers.mjs";

const page = await launchPersistant();

await page.waitForURL("**/leagues/**", { timeout: 0 });

const token = await page.evaluate(() => localStorage.getItem("token"));
const user_id = await page.evaluate(() => localStorage.getItem("user_id"));

process.stdout.write(JSON.stringify({ token, user_id }));

page.context().close();
