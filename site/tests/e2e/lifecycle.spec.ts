import { expect, test, type Page } from "@playwright/test";

const STAGES = ["Discover", "Define", "Design", "Build", "Verify", "Ship"];
/** One autoplay step is 5.2s (AUTOPLAY_MS in components/sdlc/lifecycle-explorer.tsx). */
const ONE_STEP = 5300;

// Scoped to the lifecycle's own tablist: /docs/sdlc also has a cost chart whose tabs carry
// the same stage names, so an unscoped role query would match both.
const stage = (page: Page, name: string) =>
  page
    .getByRole("tablist", { name: /SDLC stages|ขั้นของ SDLC/ })
    .getByRole("tab", { name, exact: true });
const root = (page: Page) => page.locator("[data-playing]").first();
const selected = (page: Page, name: string) =>
  expect(stage(page, name)).toHaveAttribute("aria-selected", "true");

/** The walkthrough advances on a timer only while the diagram is on screen; a fake clock
 *  lets the test move time forward deterministically instead of sleeping. */
async function openLifecycle(page: Page, path = "/") {
  await page.clock.install();
  await page.goto(path);
  await page
    .getByRole("tablist", { name: /SDLC stages|ขั้นของ SDLC/ })
    .scrollIntoViewIfNeeded();
  // Let the IntersectionObserver report the diagram as visible.
  await page.clock.runFor(400);
}

/** Waits for the walkthrough to reach `playing` (or not), then lets the effect that owns
 *  its interval run. Moving a fake clock straight after a pointer or click event races
 *  that effect: the interval would be created after the clock had already moved on. */
async function settle(page: Page, playing: boolean) {
  await expect(root(page)).toHaveAttribute(
    "data-playing",
    playing ? "true" : "false",
  );
  await page.waitForTimeout(150);
}

test("the lifecycle shows six stages and starts on Discover", async ({
  page,
}) => {
  await openLifecycle(page);
  for (const name of STAGES) await expect(stage(page, name)).toBeVisible();
  await selected(page, "Discover");
  await expect(page.getByText("Stage 1 of 6")).toBeVisible();
});

test("picking a stage shows its agents, outputs and approval, read from the workflow", async ({
  page,
}) => {
  await openLifecycle(page);
  await stage(page, "Verify").click();
  await selected(page, "Verify");
  const verify = page.getByRole("tabpanel").filter({ hasText: "Stage 5 of 6" });
  await expect(
    verify.getByText("jarvis-tester", { exact: true }),
  ).toBeVisible();
  await expect(
    verify.getByText("jarvis-review-security", { exact: true }),
  ).toBeVisible();
  await expect(
    verify.getByText("review/{standards,performance,security,database}.md"),
  ).toBeVisible();

  await stage(page, "Design").click();
  const design = page.getByRole("tabpanel").filter({ hasText: "Stage 3 of 6" });
  // architecture is a human approval gate in the feature workflow.
  await expect(design.getByText("Human approval required")).toBeVisible();
  await expect(
    design.getByText("You approve architecture before the next stage starts."),
  ).toBeVisible();
});

test("the flag-gated devops agent is shown as conditional, not as always-on", async ({
  page,
}) => {
  await openLifecycle(page);
  await stage(page, "Design").click();
  const design = page.getByRole("tabpanel").filter({ hasText: "Stage 3 of 6" });
  await expect(
    design.getByText("jarvis-devops when has_infra_change is true"),
  ).toBeVisible();
});

test("the walkthrough advances on its own, and picking a stage stops it for good", async ({
  page,
}) => {
  await openLifecycle(page);
  await settle(page, true);
  await selected(page, "Discover");

  await page.clock.runFor(ONE_STEP);
  await selected(page, "Define");

  await stage(page, "Build").click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(30_000);
  await selected(page, "Build");
  await expect(root(page)).toHaveAttribute("data-playing", "false");
  await expect(
    page.getByRole("button", { name: "Play walkthrough" }),
  ).toBeVisible();
});

test("the pause button stops the walkthrough and play resumes it", async ({
  page,
}) => {
  await openLifecycle(page);
  const toggle = page.getByRole("button", {
    name: /^(Pause|Play) walkthrough$/,
  });
  await expect(toggle).toHaveText(/Pause walkthrough/);

  await toggle.click();
  await expect(toggle).toHaveText(/Play walkthrough/);
  await page.mouse.move(0, 0);
  await settle(page, false);
  await page.clock.runFor(20_000);
  await selected(page, "Discover");

  await toggle.click();
  await page.mouse.move(0, 0);
  await settle(page, true);
  await page.clock.runFor(ONE_STEP);
  await selected(page, "Define");
});

test("hovering the diagram pauses the walkthrough without cancelling it", async ({
  page,
}) => {
  await openLifecycle(page);
  await stage(page, "Discover").hover();
  await settle(page, false);
  await page.clock.runFor(20_000);
  await selected(page, "Discover");

  await page.mouse.move(0, 0);
  // Playwright scrolls the page to hover the tab, which can leave under a third of the
  // diagram on screen. The walkthrough correctly does not play then, so bring it back.
  await root(page).scrollIntoViewIfNeeded();
  await settle(page, true);
  await page.clock.runFor(ONE_STEP);
  await selected(page, "Define");
});

test("the walkthrough only plays while the diagram is on screen", async ({
  page,
}) => {
  await openLifecycle(page);
  await settle(page, true);

  // Scroll to the footer: the diagram is off screen, so time passing must not move it.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle(page, false);
  await page.clock.runFor(30_000);

  await root(page).scrollIntoViewIfNeeded();
  await selected(page, "Discover");
  await settle(page, true);
  await page.clock.runFor(ONE_STEP);
  await selected(page, "Define");
});

test("the stages are keyboard operable: arrow keys move between them", async ({
  page,
}) => {
  await openLifecycle(page);
  await stage(page, "Discover").focus();
  await page.keyboard.press("ArrowRight");
  await selected(page, "Define");
  await expect(stage(page, "Define")).toBeFocused();
  await page.keyboard.press("End");
  await selected(page, "Ship");
});

test("reduced motion: no autoplay and no play/pause control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLifecycle(page);
  await expect(root(page)).toHaveAttribute("data-playing", "false");
  await page.clock.runFor(30_000);
  await selected(page, "Discover");
  await expect(page.getByRole("button", { name: /walkthrough/ })).toHaveCount(
    0,
  );
  // Still fully usable by hand.
  await stage(page, "Ship").click();
  await selected(page, "Ship");
});

test("the Thai page renders the lifecycle in Thai, with the same six stages", async ({
  page,
}) => {
  await openLifecycle(page, "/th");
  for (const name of STAGES) await expect(stage(page, name)).toBeVisible();
  await expect(page.getByText("ขั้นที่ 1 จาก 6")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "หยุดตัวอย่างอัตโนมัติ" }),
  ).toBeVisible();
});

test.describe("/docs/sdlc", () => {
  test("has the lifecycle, the role map and the traceability chain", async ({
    page,
  }) => {
    await page.goto("/docs/sdlc");
    await expect(
      page.getByRole("heading", { level: 1, name: "SDLC process" }),
    ).toBeVisible();
    await expect(stage(page, "Discover")).toBeVisible();

    // Each role card names a real agent or command: the page throws at build time otherwise.
    const card = (role: string) =>
      page
        .getByRole("listitem")
        .filter({ has: page.getByRole("heading", { level: 3, name: role }) });
    await expect(
      card("Project manager").getByText("/jarvis-portfolio", { exact: true }),
    ).toBeVisible();
    await expect(
      card("Staff engineer").getByText("jarvis-staff", { exact: true }),
    ).toBeVisible();
    await expect(
      card("Full-stack developer").getByText("jarvis-dev-backend", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      card("Full-stack developer").getByText("jarvis-dev-frontend", {
        exact: true,
      }),
    ).toBeVisible();

    const chain = page.getByRole("list", { name: /Traceability chain/ });
    await expect(chain.getByRole("listitem")).toHaveCount(5);
    await expect(chain.getByText("AC-004-02")).toBeVisible();
  });

  test("sits between Introduction and Getting Started in the docs navigation, in both languages", async ({
    page,
  }) => {
    for (const [path, names] of [
      ["/docs/sdlc", ["Introduction", "SDLC process", "Getting Started"]],
      [
        "/th/docs/sdlc",
        ["ความรู้เบื้องต้น", "กระบวนการ SDLC", "เริ่มต้นใช้งาน"],
      ],
    ] as const) {
      await page.goto(path);
      const links = (await page.locator("aside a").allTextContents()).map((l) =>
        l.trim(),
      );
      const idx = names.map((n) => links.indexOf(n));
      expect(
        idx.every((i) => i >= 0),
        `${path}: expected ${names.join(", ")} in ${links.join(" | ")}`,
      ).toBe(true);
      expect(idx[0]).toBeLessThan(idx[1]!);
      expect(idx[1]).toBeLessThan(idx[2]!);
    }
  });
});
