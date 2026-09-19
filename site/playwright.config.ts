import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "npx serve out -l 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  // Two projects, not a manual theme toggle inside every test: next-themes respects
  // prefers-color-scheme when no stored preference exists (defaultTheme="system"), so a
  // fresh context with an emulated colorScheme renders that theme from first paint —
  // the same real WCAG surface a light-only run would silently never check.
  projects: [
    { name: "light", use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
  ],
});
