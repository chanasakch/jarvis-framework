import { expect, test } from "@playwright/test";

test("the SDLC pipeline is keyboard operable: arrow keys move between phases", async ({ page }) => {
  await page.goto("/");
  // The default work-type tab is alphabetically first (bugfix), not "feature" — select
  // it explicitly so the phase list this test asserts on is the one it expects.
  await page.getByRole("tab", { name: "feature", exact: true }).click();
  const firstPhaseTab = page.getByRole("tab", { name: "intake" });
  await firstPhaseTab.focus();
  await expect(firstPhaseTab).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowRight");
  const secondPhaseTab = page.getByRole("tab", { name: "brief" });
  await expect(secondPhaseTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("jarvis-analyst")).toBeVisible();
});

test("switching work-type tabs updates the visible phase list", async ({ page }) => {
  await page.goto("/");
  // The default work-type tab is alphabetically first (bugfix, not "feature") — select
  // "feature" explicitly to establish a known baseline before switching away from it.
  await page.getByRole("tab", { name: "feature", exact: true }).click();
  await expect(page.getByRole("tab", { name: "requirements" })).toBeVisible();
  await page.getByRole("tab", { name: "hotfix", exact: true }).click();
  await expect(page.getByRole("tab", { name: "postmortem" })).toBeVisible();
});

test("reduced motion renders the terminal replay's final frame statically, with no play controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // The last frame's content (the forced-gate output) should already be visible with no interaction.
  await expect(page.getByText("follow-up: CHR-004")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Play" })).toHaveCount(0);
});

test("the terminal replay does not shift layout as frames reveal", async ({ page }) => {
  await page.goto("/");
  const terminal = page.locator("text=jarvis — session").locator("..").locator("..");
  const initialBox = await terminal.boundingBox();
  await page.waitForTimeout(2500); // one frame tick
  const laterBox = await terminal.boundingBox();
  expect(initialBox?.x).toBe(laterBox?.x);
  expect(initialBox?.width).toBe(laterBox?.width);
});

test("copying the install command shows a toast", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy install command" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
});
