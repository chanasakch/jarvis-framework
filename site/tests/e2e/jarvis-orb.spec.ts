import { expect, test, type Page } from "@playwright/test";

// The Meet Jarvis orb never stops moving on its own, which is only acceptable while the reader can
// stop it (WCAG 2.2.2) and while it costs nothing when nobody is looking (D-059). It draws to a
// canvas, so document.getAnimations() cannot see it: these tests compare actual pixels instead.
const CASES = [
  { path: "/", pause: "Pause animation", play: "Play animation" },
  { path: "/th", pause: "หยุดแอนิเมชัน", play: "เล่นแอนิเมชัน" },
];

const pixels = (page: Page) =>
  page.evaluate(() =>
    document
      .querySelector<HTMLCanvasElement>("[data-testid=jarvis-orb] canvas")!
      .toDataURL(),
  );

for (const { path, pause, play } of CASES) {
  test.describe(path, () => {
    test("is decorative: hidden from assistive tech", async ({ page }) => {
      await page.goto(path);
      await expect(
        page.locator("[data-testid=jarvis-orb] canvas"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    test("moves while running, holds still once paused, and remembers the choice", async ({
      page,
    }) => {
      await page.goto(path);
      const orb = page.getByTestId("jarvis-orb");
      await orb.scrollIntoViewIfNeeded();
      await expect(orb).toHaveAttribute("data-orb-running", "true");

      const a = await pixels(page);
      await page.waitForTimeout(400);
      expect(
        await pixels(page),
        "the drawing should change over time",
      ).not.toBe(a);

      await page.getByRole("button", { name: pause }).click();
      await expect(orb).toHaveAttribute("data-orb-running", "false");
      await page.waitForTimeout(100);
      const frozen = await pixels(page);
      await page.waitForTimeout(500);
      expect(await pixels(page), "a paused orb must not change").toBe(frozen);

      await page.reload();
      await expect(page.getByRole("button", { name: play })).toBeVisible();
      await expect(page.getByTestId("jarvis-orb")).toHaveAttribute(
        "data-orb-running",
        "false",
      );

      await page.getByRole("button", { name: play }).click();
      await expect(page.getByTestId("jarvis-orb")).toHaveAttribute(
        "data-orb-running",
        "true",
      );
    });

    test("stops while scrolled out of view", async ({ page }) => {
      await page.goto(path);
      const orb = page.getByTestId("jarvis-orb");
      await orb.scrollIntoViewIfNeeded();
      await expect(orb).toHaveAttribute("data-orb-running", "true");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(orb).toHaveAttribute("data-orb-running", "false");
    });

    test("pause button is reachable by keyboard", async ({ page }) => {
      await page.goto(path);
      await page.getByRole("button", { name: pause }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: play })).toBeFocused();
    });

    test("Reduce Motion draws one still frame and hides the pause button", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const orb = page.getByTestId("jarvis-orb");
      await orb.scrollIntoViewIfNeeded();
      await expect(orb).toHaveAttribute("data-orb-running", "false");
      const first = await pixels(page);
      await page.waitForTimeout(600);
      expect(await pixels(page)).toBe(first);
      // Drawn, not blank: the frame differs from an empty canvas of the same size.
      const blank = await page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(
          "[data-testid=jarvis-orb] canvas",
        )!;
        const e = document.createElement("canvas");
        e.width = c.width;
        e.height = c.height;
        return e.toDataURL();
      });
      expect(first).not.toBe(blank);
      await expect(page.getByRole("button", { name: pause })).toBeHidden();
    });
  });
}

test("the orb follows the theme: same shape, different colour", async ({
  browser,
}) => {
  const shot = async (colorScheme: "light" | "dark") => {
    const ctx = await browser.newContext({
      colorScheme,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByTestId("jarvis-orb").scrollIntoViewIfNeeded();
    const rgb = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[data-testid=jarvis-orb] canvas")!,
        ).color,
    );
    await ctx.close();
    return rgb;
  };
  expect(await shot("light")).not.toBe(await shot("dark"));
});
