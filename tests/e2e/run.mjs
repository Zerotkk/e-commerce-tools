import { spawn } from "node:child_process";

const server = spawn(
  process.execPath,
  ["../../apps/web/node_modules/next/dist/bin/next", "dev", "../../apps/web"],
  { cwd: import.meta.dirname, stdio: "ignore", windowsHide: true },
);

function stopServer() {
  if (server.exitCode !== null) return;

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    killer.unref();
  } else {
    server.kill("SIGTERM");
  }
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://localhost:3000");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("The web server did not become ready within 30 seconds.");
}

let exitCode = 1;

try {
  await waitForServer();
  const playwright = spawn(
    process.execPath,
    ["./node_modules/@playwright/test/cli.js", "test", "--config=playwright.config.ts"],
    { cwd: import.meta.dirname, stdio: "inherit", env: { ...process.env, E2E_EXTERNAL_SERVER: "1" } },
  );
  exitCode = await new Promise((resolve) => playwright.on("exit", (code) => resolve(code ?? 1)));
} finally {
  stopServer();
  server.unref();
}

process.exit(exitCode);
