import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  // A dedicated port, never 3000: `next dev` owns 3000, and with `reuseExistingServer`
  // a running dev server would silently be tested instead of the static export — a dev
  // build hydrates differently, redirects `/docs/workflows` to a trailing slash, and
  // serves whatever was compiled when it started, so the suite would report on code that
  // is not the artifact being shipped. This suite exists to test the built `out/`
  // directory that goes to GitHub Pages, so it always starts its own server for it.
  use: { baseURL: "http://127.0.0.1:4321" },
  webServer: {
    command: "npx serve out -l 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
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
