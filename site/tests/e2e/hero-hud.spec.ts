import { expect, test } from "@playwright/test";

// The hero's HUD backdrop is the one animation on the site that loops forever (D-059). That is
// only acceptable while the reader can stop it (WCAG 2.2.2) and while it costs nothing when
// nobody is looking, so both are asserted here, in both languages.
const CASES = [
  {
    path: "/",
    pause: "Pause background animation",
    play: "Play background animation",
  },
  {
    path: "/th",
    pause: "หยุดแอนิเมชันพื้นหลัง",
    play: "เล่นแอนิเมชันพื้นหลัง",
  },
];

const hudStates = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      // CSSAnimation only: the pause button's own hover transition is not the backdrop.
      .filter((a) => a instanceof CSSAnimation)
      .filter((a) =>
        String(
          (a.effect as KeyframeEffect).target?.getAttribute("class") ?? "",
        ).includes("hud-"),
      )
      .map((a) => a.playState),
  );

for (const { path, pause, play } of CASES) {
  test.describe(path, () => {
    test("HUD is decorative: hidden from assistive tech and not clickable", async ({
      page,
    }) => {
      await page.goto(path);
      const hud = page.getByTestId("hero-hud");
      await expect(hud).toHaveAttribute("aria-hidden", "true");
      await expect(hud).toHaveCSS("pointer-events", "none");
    });

    test("runs, then the pause button stops it and the choice survives a reload", async ({
      page,
    }) => {
      await page.goto(path);
      const hud = page.getByTestId("hero-hud");
      await expect(hud).toHaveAttribute("data-hud-running", "true");
      await expect
        .poll(async () => (await hudStates(page)).includes("running"))
        .toBe(true);

      await page.getByRole("button", { name: pause }).click();
      await expect(hud).toHaveAttribute("data-hud-running", "false");
      expect((await hudStates(page)).filter((s) => s === "running")).toEqual(
        [],
      );
      await expect(page.getByRole("button", { name: play })).toBeVisible();

      await page.reload();
      await expect(page.getByRole("button", { name: play })).toBeVisible();
      await expect(page.getByTestId("hero-hud")).toHaveAttribute(
        "data-hud-running",
        "false",
      );

      await page.getByRole("button", { name: play }).click();
      await expect(page.getByTestId("hero-hud")).toHaveAttribute(
        "data-hud-running",
        "true",
      );
    });

    test("stops while scrolled out of view", async ({ page }) => {
      await page.goto(path);
      const hud = page.getByTestId("hero-hud");
      await expect(hud).toHaveAttribute("data-hud-running", "true");
      await page.evaluate(() => window.scrollTo(0, 2500));
      await expect(hud).toHaveAttribute("data-hud-running", "false");
    });

    test("pause button is reachable by keyboard", async ({ page }) => {
      await page.goto(path);
      const button = page.getByRole("button", { name: pause });
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: play })).toBeFocused();
    });

    test("Reduce Motion leaves a still drawing and no pause button", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForTimeout(500);
      expect(
        await page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations === Infinity)
              .length,
        ),
      ).toBe(0);
      await expect(page.getByRole("button", { name: pause })).toBeHidden();
    });
  });
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("only the simplified drawing is shown", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hud-detail")).toBeHidden();
    // Rings and the scan line remain.
    await expect(page.locator("[data-testid=hero-hud] .hud-scan")).toHaveCount(
      1,
    );
  });
});

test("the full drawing is shown on a desktop", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hud-detail")).toBeVisible();
});
