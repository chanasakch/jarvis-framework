import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { DOCS_SLUGS } from "../../lib/content/nav";

// Every real docs page, both locales, plus the shared chrome pages — not a sample.
// A full Lighthouse + keyboard walkthrough pass (both themes) is S7's job; this is the
// per-page axe floor that must hold from here on as content keeps changing.
const PAGES = [
  "/",
  "/th",
  "/dev/tokens",
  "/changelog",
  "/th/changelog",
  ...DOCS_SLUGS.flatMap((slug) => [`/docs/${slug}`, `/th/docs/${slug}`]),
];

for (const path of PAGES) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("command palette opens with ⌘K/Ctrl+K and is keyboard operable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.type("getting");
  await expect(dialog.getByRole("option", { name: "Getting Started" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("skip link is the first focusable element and targets main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveText("Skip to content");
  await expect(focused).toHaveAttribute("href", "#main-content");
});

// Navigates to the exact mirrored page. This is a full page navigation, not a soft
// client-side transition — see DECISIONS.md D-025 for why that's an accepted, disclosed
// deviation from SITE_SPEC.md under static export on GitHub Pages.
test("language switch navigates to the exact mirrored page", async ({ page }) => {
  await page.goto("/docs/getting-started");
  await page.getByRole("link", { name: "ไทย", exact: true }).click();
  await expect(page).toHaveURL(/\/th\/docs\/getting-started\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "th");

  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
