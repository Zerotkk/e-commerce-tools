import { defineConfig } from "@playwright/test";

const webServer = process.env.E2E_EXTERNAL_SERVER
  ? {}
  : {
      webServer: {
        command: "node ../../apps/web/node_modules/next/dist/bin/next dev ../../apps/web",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
      },
    };

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:3000" },
  ...webServer,
});
