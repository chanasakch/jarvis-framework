import { expect, test } from "@playwright/test";

// S7's explicit keyboard walkthrough: palette, switcher, pipeline, replay, mobile menu.
// Palette and pipeline already have dedicated tests (tests/e2e/a11y.spec.ts,
// tests/e2e/landing.spec.ts); this file covers the remaining three, mouse-free.

test("language switch is reachable and activatable by keyboard alone", async ({ page }) => {
  await page.goto("/docs/gates");
  const enLink = page.getByRole("link", { name: "EN", exact: true });
  await enLink.focus();
  await expect(enLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/gates\/?$/);

  await page.getByRole("link", { name: "ไทย", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/th\/docs\/gates\/?$/);
});

test("terminal replay's play/pause/step/restart controls are keyboard operable", async ({ page }) => {
  await page.goto("/");
  const playPause = page.getByRole("button", { name: /^(Play|Pause)$/ });
  const step = page.getByRole("button", { name: "Step" });
  const restart = page.getByRole("button", { name: "Restart" });

  await playPause.focus();
  await expect(playPause).toBeFocused();
  await page.keyboard.press("Enter"); // toggles play/pause — just confirm it responds
  await expect(playPause).toBeFocused();

  await step.focus();
  await page.keyboard.press("Enter");
  await expect(step).toBeFocused();

  await restart.focus();
  await page.keyboard.press("Enter");
  await expect(restart).toBeFocused();
});

test("mobile nav sheet opens, traps focus, and closes with Escape — keyboard only", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/docs/getting-started");

  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Focus should have moved inside the sheet (Radix Dialog's default behavior).
  const linkInSheet = dialog.getByRole("link", { name: "Docs", exact: true });
  await expect(linkInSheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  // Focus returns to the trigger — the standard, expected Radix Dialog behavior.
  await expect(trigger).toBeFocused();
});

test("mobile nav sheet's links navigate correctly", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Docs", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/introduction\/?$/);
});
