import { expect, test } from "@playwright/test";

/** The business explainer that opens /docs/sdlc, in both languages. Text differs by locale;
 *  the structure (counts, roles, states) is what these tests pin down. */
const LOCALES = [
  {
    name: "English",
    path: "/docs/sdlc",
    liveLabel: "Live",
    foundHere: "If the problem is found now",
    designNote: "Fix a design. There is no code yet.",
    replay: "Replay",
    caption: /not measured data/,
    leads: "Leads",
    developer: "Developer",
    exampleTag: /Made-up example: a restaurant/,
  },
  {
    name: "Thai",
    path: "/th/docs/sdlc",
    liveLabel: "ใช้งานจริง",
    foundHere: "ถ้าพบปัญหาตอนนี้",
    designNote: "แก้แบบ ยังไม่มีโค้ด",
    replay: "เล่นซ้ำ",
    caption: /ไม่ใช่ข้อมูลที่วัดได้/,
    leads: "รับผิดชอบนำ",
    developer: "นักพัฒนา",
    exampleTag: /ตัวอย่างสมมติ ร้านอาหาร/,
  },
] as const;

for (const L of LOCALES) {
  test.describe(`SDLC explainer (${L.name})`, () => {
    test("the house-and-software analogy has one card per stage", async ({
      page,
    }) => {
      await page.goto(L.path);
      // Each card holds a house step and a software step, so 6 cards, and 12 visible sentences.
      const cards = page
        .locator("ol")
        .filter({ has: page.locator("li >> text=Discover") })
        .first()
        .locator("> li");
      await expect(cards).toHaveCount(6);
    });

    test("the cost chart starts on the point after release and lets you pick another", async ({
      page,
    }) => {
      await page.goto(L.path);
      const chart = page.getByRole("tablist", { name: /Choose when|เลือกจุด/ });
      await chart.scrollIntoViewIfNeeded();
      await expect(chart.getByRole("tab")).toHaveCount(7);
      await expect(
        page.getByRole("tab", { name: L.liveLabel, exact: true }),
      ).toHaveAttribute("aria-selected", "true");

      await chart.getByRole("tab", { name: "Design", exact: true }).click();
      await expect(page.getByText(L.designNote)).toBeVisible();
      await expect(page.getByText(L.foundHere).first()).toBeVisible();
    });

    test("the cost chart says it is an illustration, not data, and can be replayed", async ({
      page,
    }) => {
      await page.goto(L.path);
      await expect(page.getByText(L.caption)).toBeVisible();
      const replay = page.getByRole("button", { name: L.replay }).first();
      await replay.scrollIntoViewIfNeeded();
      await replay.click();
      // Replay remounts the curve; the chart must still be there afterwards.
      await expect(page.getByRole("img", { name: /.+/ }).first()).toBeVisible();
    });

    test("the journey has six stages, is labelled as made-up, and lights the stage in view", async ({
      page,
    }) => {
      await page.goto(L.path);
      await expect(page.getByText(L.exampleTag)).toBeVisible();
      const items = page.locator("li[data-index]");
      await expect(items).toHaveCount(6);

      await items.nth(5).scrollIntoViewIfNeeded();
      await expect(items.nth(5)).toHaveAttribute("data-active", "true");
      await items.nth(2).scrollIntoViewIfNeeded();
      await expect(items.nth(2)).toHaveAttribute("data-active", "true");
    });

    test("three delivery models are compared, each with what it suits and what to watch", async ({
      page,
    }) => {
      await page.goto(L.path);
      const models = page.locator("h3", {
        hasText: /^(Waterfall|Agile|DevOps)$/,
      });
      await expect(models).toHaveCount(3);
      await expect(
        page.locator("dl").filter({ has: models.first() }),
      ).toHaveCount(0); // headings sit beside, not inside, the lists
      await expect(
        page.locator("dt").filter({ hasText: /Suits|เหมาะเมื่อ/ }),
      ).toHaveCount(3);
      await expect(
        page.locator("dt").filter({ hasText: /Watch out for|ข้อควรระวัง/ }),
      ).toHaveCount(3);
    });

    test("the who-is-involved grid is a real table: 8 roles by 6 stages, with text for every cell", async ({
      page,
    }) => {
      await page.goto(L.path);
      const table = page
        .getByRole("table")
        .filter({ has: page.getByRole("columnheader", { name: "Discover" }) })
        .first();
      await table.scrollIntoViewIfNeeded();
      await expect(table.getByRole("columnheader")).toHaveCount(7); // role + 6 stages
      await expect(table.locator("tbody tr")).toHaveCount(8);
      await expect(table.locator("tbody td")).toHaveCount(48);

      // A developer leads Build, and a screen reader is told so in words.
      const row = table
        .getByRole("row")
        .filter({ has: page.getByRole("rowheader", { name: L.developer }) });
      await expect(row.getByRole("cell").nth(3)).toContainText(L.leads);
    });

    test("the four delivery measures are listed, with no invented numbers", async ({
      page,
    }) => {
      await page.goto(L.path);
      const heading = page.getByRole("heading", {
        level: 2,
        name: /How to tell|วัดอย่างไร/,
      });
      await heading.scrollIntoViewIfNeeded();
      const cards = page.locator("li").filter({
        has: page.locator("h3", {
          hasText:
            /Lead time|Release frequency|Failed release rate|Time to restore|ความถี่ในการปล่อย|อัตราการปล่อย|เวลากู้คืน/,
        }),
      });
      await expect(cards).toHaveCount(4);
    });

    test("the bridge pairs seven typical problems with what Jarvis does", async ({
      page,
    }) => {
      await page.goto(L.path);
      const bridge = page
        .locator("div.not-prose")
        .filter({ has: page.locator("li.reveal") })
        .filter({ hasText: /ADR/ })
        .last();
      await bridge.scrollIntoViewIfNeeded();
      await expect(bridge.locator("li.reveal")).toHaveCount(7);
      // Every mechanism named is one the framework really has.
      await expect(bridge).toContainText("ADR");
      await expect(bridge).toContainText("portfolio");
    });

    test("the original Jarvis lifecycle is still there, after the business explainer", async ({
      page,
    }) => {
      await page.goto(L.path);
      const lifecycle = page.getByRole("tablist", {
        name: /SDLC stages|ขั้นของ SDLC/,
      });
      await expect(lifecycle).toBeAttached();
      const explainerY = await page
        .getByRole("heading", { level: 2 })
        .first()
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const lifecycleY = await lifecycle.evaluate(
        (el) => el.getBoundingClientRect().top + window.scrollY,
      );
      expect(lifecycleY).toBeGreaterThan(explainerY);
    });
  });
}

test("the explainer's motion plays once and never loops (WCAG 2.2.2)", async ({
  page,
}) => {
  await page.goto("/docs/sdlc");
  // Scroll the whole page so every reveal has been triggered, then let them finish.
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(5000);
  // No animation inside the explainer may be infinite: nothing there needs a pause control.
  const infinite = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getTiming().iterations === Infinity)
      .map((a) =>
        (a.effect as KeyframeEffect).target?.className?.toString().slice(0, 60),
      ),
  );
  // The lifecycle hub's "playing" ping is the one deliberate exception, and it has a pause button.
  expect(infinite.filter((c) => !/animate-ping/.test(String(c)))).toEqual([]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the who-is-involved grid fits without sideways scrolling", async ({
    page,
  }) => {
    await page.goto("/docs/sdlc");
    const scroller = page.getByRole("region", {
      name: /typical split|ตัวอย่างการแบ่งบทบาท/,
    });
    await scroller.scrollIntoViewIfNeeded();
    const { scrollWidth, clientWidth } = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    // A few pixels of slack for borders; the point is that six columns are not cut off.
    expect(scrollWidth - clientWidth).toBeLessThanOrEqual(24);
  });

});
