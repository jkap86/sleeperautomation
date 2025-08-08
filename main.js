const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const next = require("next");
const { once } = require("events");
const fs = require("fs");
const loadEnv = require("dotenv").config;

loadEnv({ path: path.join(__dirname, "..", ".env") });

process.env.ELECTRON_USER_DATA = app.getPath("userData");

if (app.isPackaged) {
  // path where electron-builder unpacks node_modules
  const pwPath = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "playwright-core",
    ".local-browsers"
  );
  if (fs.existsSync(pwPath)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = pwPath;
    console.log("[main] PLAYWRIGHT_BROWSERS_PATH set to", pwPath);
  } else {
    console.warn("[main] Playwright browsers folder not found at", pwPath);
  }
}

const dev = !app.isPackaged;
let nextServerPort = Number(process.env.PORT || 3000);

async function startNextServer() {
  // 1) Configure Next to use your project root
  const projectRoot = path.join(__dirname);
  const nxt = next({ dev: false, dir: projectRoot });
  const handle = nxt.getRequestHandler();

  // 2) Prepare and start the HTTP server
  await nxt.prepare();
  const server = http.createServer((req, res) => handle(req, res));

  // 3) Allow port-retry if 3000 is in use
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      server.listen(0, "127.0.0.1");
    } else {
      console.error("Next server error:", err);
    }
  });

  // 4) Wait until the server is listening and capture the actual port
  server.listen(nextServerPort, "127.0.0.1");
  await once(server, "listening");
  const addr = server.address();
  nextServerPort = typeof addr === "object" ? addr.port : nextServerPort;
  console.log(`[Embedded Next] listening on port ${nextServerPort}`);
}

async function createWindow() {
  await startNextServer();

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const url = dev
    ? process.env.ELECTRON_START_URL || `http://localhost:3000`
    : `http://127.0.0.1:${nextServerPort}`;

  win.loadURL(url);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
