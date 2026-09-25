import { expect, test } from "@playwright/test";

// A page must open at the top. The SDLC pipeline ("How it works") used to call scrollIntoView
// from an effect to keep its selected phase in view, and that scrolls the whole page, not just
// the phase strip: the landing page opened 1500px down and /docs/workflows 430px down.
//
// It only showed for some readers, which is why nothing caught it: React runs effects twice in
// development, and in production the effect re-ran for anyone with "reduce motion" turned on,
// because that preference is read after mount and sat in the effect's dependencies. The suite
// runs the production build, so the reduced-motion case is the one that reproduces it here.
const PAGES = ["/", "/th", "/docs/workflows", "/th/docs/workflows"];

/** Waits for every finite animation to finish. Playwright retries a click on an element that is
 *  still moving, and on a retry it scrolls the page to a different alignment, which shows up as
 *  a 230px jump that a reader never sees (their click lands first time). The entrance stagger of
 *  the phase strip is exactly that, so a test that measures the page's scroll around a click
 *  must let it settle first, or it measures Playwright and not the page. */
const settle = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );


for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`opens at the top (reduced motion: ${reducedMotion})`, () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const url of PAGES) {
      test(`${url}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await page.goto(url);
        await page.waitForLoadState("networkidle");
        // Let every mount effect and media-query subscription settle, then check.
        await page.waitForTimeout(1200);
        expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
      });
    }
  });
}

test("picking a phase never scrolls the page, only the phase strip", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/workflows");
  const phase = page.getByRole("tab", { name: "review", exact: true }).first();
  await phase.scrollIntoViewIfNeeded();
  await settle(page);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await phase.click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => Math.round(window.scrollY));
  // Clicking a visible tab must not move the page (a few px of layout slack aside).
  expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
});

test("on a narrow screen, picking a far phase scrolls the phase strip sideways and leaves the page alone", async ({ page }) => {
  // 800px is wide enough for the horizontal strip but too narrow for all its phases at once.
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/docs/workflows");
  await page.getByRole("tab", { name: "feature", exact: true }).click();
  const strip = page.locator('[role="tablist"][aria-label]').filter({ has: page.getByRole("tab", { name: "release", exact: true }) });
  const scroller = strip.locator("..");
  await strip.scrollIntoViewIfNeeded();
  expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth), "the strip should overflow at this width").toBe(true);

  await settle(page);
  const pageBefore = await page.evaluate(() => Math.round(window.scrollY));
  expect(await scroller.evaluate((el) => Math.round(el.scrollLeft))).toBe(0);

  await page.getByRole("tab", { name: "release", exact: true }).click();
  await page.waitForTimeout(900);

  expect(await scroller.evaluate((el) => Math.round(el.scrollLeft)), "the strip should follow the picked phase").toBeGreaterThan(0);
  expect(Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - pageBefore)).toBeLessThanOrEqual(4);
});
