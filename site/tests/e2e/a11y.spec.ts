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
    // Check the settled page: an element mid fade-in (e.g. the pipeline's staggered
    // entrance) has partial opacity and would report a transient contrast failure.
    //
    // Some sections only start animating once an IntersectionObserver reports them on
    // screen (the SDLC explainer's reveals), which happens a frame or two AFTER load. A
    // single snapshot of getAnimations() taken straight away misses those, so give the
    // observers a moment to fire, then wait until nothing finite is still running. This
    // does not hide a real contrast problem: axe then measures the final colours a reader
    // actually sees.
    //
    // Content that plays itself is the other source. The landing page's terminal replay swaps
    // in a new frame every 2.2s and fades it in, and text caught mid-fade is half transparent:
    // axe read one line as #959595 on #f5f5f5, 2.74:1, on a slower CI runner (a 200ms window
    // that a fast laptop rarely lands in, so it passed locally). Freezing a frame mid-fade
    // reproduces the same class of violation on demand; pausing the replay first, as a reader
    // can with its pause control, and then settling is clean even when begun at the worst moment.
    const pauses = page.getByRole("button", { name: /^(Pause|หยุด)/ });
    for (let n = 0; n < 5 && (await pauses.count()) > 0; n++)
      await pauses.first().click();
    await page.waitForTimeout(300);
    await page.waitForFunction(
      () =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.effect?.getTiming().iterations === Infinity ||
              a.playState === "finished",
          ),
      undefined,
      { polling: 100, timeout: 10_000 },
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
}

test("command palette opens with ⌘K/Ctrl+K and is keyboard operable", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.type("getting");
  await expect(
    dialog.getByRole("option", { name: "Getting Started" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("skip link is the first focusable element and targets main content", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveText("Skip to content");
  await expect(focused).toHaveAttribute("href", "#main-content");
});

// Navigates to the exact mirrored page. This is a full page navigation, not a soft
// client-side transition — see DECISIONS.md D-025 for why that's an accepted, disclosed
// deviation from SITE_SPEC.md under static export on GitHub Pages.
test("language switch navigates to the exact mirrored page", async ({
  page,
}) => {
  await page.goto("/docs/getting-started");
  await page.getByRole("link", { name: "ไทย", exact: true }).click();
  await expect(page).toHaveURL(/\/th\/docs\/getting-started\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "th");

  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
