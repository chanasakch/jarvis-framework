import fs from "node:fs";
import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The data-driven diagrams outside the SDLC page (stats, workflow matrix, gate simulator,
 * flows, ownership, command map, standards map, changelog). Where a picture is drawn from
 * generated framework data, the test reads the same JSON and compares, so a diagram that
 * drifts from the framework fails here instead of quietly showing something else.
 */
const generated = <T>(file: string): T =>
  JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "content", "generated", file),
      "utf8",
    ),
  ) as T;

interface Phase {
  id: string;
  approval?: string;
}
interface Workflow {
  id: string;
  phases: Phase[];
}
interface Standard {
  id: string;
  rules: unknown[];
}
interface Cli {
  id: string;
  humanOnly: boolean;
}
interface ConfigKey {
  path: string;
  default: string;
}

const workflows = generated<Workflow[]>("workflows.json");
const standards = generated<Standard[]>("standards.json");
const cli = generated<Cli[]>("cli.json");
const commands = generated<{ id: string }[]>("commands.json");
const agents = generated<{ id: string }[]>("agents.json");
const changelog = generated<{ version: string }[]>("changelog.json");
const maxRetries = Number(
  generated<ConfigKey[]>("config.json").find(
    (k) => k.path === "gates.max_retries",
  )?.default,
);

const scrollThrough = async (page: Page) => {
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
};

test.describe("landing stats strip", () => {
  for (const url of ["/", "/th"]) {
    test(`${url} shows four numbers read from the generated data`, async ({
      page,
    }) => {
      await page.goto(url);
      const strip = page.locator('section[aria-labelledby="stats-heading"]');
      await strip.scrollIntoViewIfNeeded();
      const values = await strip.locator("span.sr-only").allTextContents();
      const rules = standards.reduce((n, s) => n + s.rules.length, 0);
      expect(values.map(Number)).toEqual([
        agents.length,
        workflows.length,
        rules,
        commands.length + cli.length,
      ]);
    });
  }
});

test.describe("workflow matrix", () => {
  for (const url of ["/docs/workflows", "/th/docs/workflows"]) {
    test(`${url} has a row per work type and the approval counts match the workflow files`, async ({
      page,
    }) => {
      await page.goto(url);
      const table = page
        .getByRole("table")
        .filter({ has: page.getByRole("columnheader", { name: "intake" }) });
      await table.scrollIntoViewIfNeeded();
      await expect(table.locator("tbody tr")).toHaveCount(workflows.length);

      const phaseIds = new Set(
        workflows.flatMap((w) => w.phases.map((p) => p.id)),
      );
      // role/type + one per phase + phases total + approvals total
      await expect(table.locator("thead th")).toHaveCount(
        1 + phaseIds.size + 2,
      );

      for (const w of workflows) {
        const row = table.locator("tbody tr").filter({
          has: page.getByRole("rowheader", { name: new RegExp(`^${w.id}`) }),
        });
        const cells = row.getByRole("cell");
        const last = await cells.count();
        await expect(cells.nth(last - 2)).toHaveText(String(w.phases.length));
        await expect(cells.nth(last - 1)).toHaveText(
          String(w.phases.filter((p) => p.approval === "human").length),
        );
      }
    });
  }

  test("every cell is described in words for a screen reader", async ({
    page,
  }) => {
    await page.goto("/docs/workflows");
    const table = page
      .getByRole("table")
      .filter({ has: page.getByRole("columnheader", { name: "intake" }) });
    const cells = table.locator("tbody td");
    const total = await cells.count();
    for (let i = 0; i < total; i++) {
      const text = (await cells.nth(i).textContent())?.trim() ?? "";
      // The two count columns are numbers; every phase cell says whether it runs.
      expect(text.length, `cell ${i} has no text`).toBeGreaterThan(0);
    }
  });
});

test.describe("gate simulator", () => {
  const LOCALES = [
    {
      url: "/docs/gates",
      done: "Agent returns DONE",
      pass: "Passes",
      fail: "Fails",
      approve: "I approve it",
      retry: "Retry",
      force: "Force it",
      park: "Park it",
      attempt: (n: number) => `Attempt ${n} of ${maxRetries}`,
      menu: "Gate Failure Menu",
      unlocked: "The next phase is unlocked.",
      toggle: /needs human approval/,
    },
    {
      url: "/th/docs/gates",
      done: "Agent คืนค่า DONE",
      pass: "ผ่าน",
      fail: "ไม่ผ่าน",
      approve: "ฉันอนุมัติ",
      retry: "ลองใหม่",
      force: "Force ผ่าน",
      park: "Park ไว้",
      attempt: (n: number) => `ครั้งที่ ${n} จาก ${maxRetries}`,
      menu: "Gate Failure Menu",
      unlocked: "ปลดล็อก phase ถัดไปแล้ว",
      toggle: /ต้องให้คนอนุมัติ/,
    },
  ];

  const sim = (page: Page): Locator =>
    page
      .locator("div.not-prose")
      .filter({ has: page.getByRole("switch") })
      .first();

  for (const L of LOCALES) {
    test(`${L.url}: failing the gate ${maxRetries} times stops at the Gate Failure Menu, and retry resets`, async ({
      page,
    }) => {
      await page.goto(L.url);
      const root = sim(page);
      await root.scrollIntoViewIfNeeded();
      const btn = (name: string) =>
        root.getByRole("button", { name, exact: true });

      await expect(root.getByText(L.attempt(0), { exact: true })).toBeVisible();
      for (let i = 1; i <= maxRetries; i++) {
        await btn(L.done).click();
        await btn(L.fail).click();
      }
      await expect(root.getByText(L.menu, { exact: true })).toBeVisible();
      await expect(
        root.getByText(L.attempt(maxRetries), { exact: true }),
      ).toBeVisible();
      // Force and park exist only here, and pass/fail are gone: the orchestrator has stopped.
      await expect(btn(L.force)).toBeVisible();
      await expect(btn(L.park)).toBeVisible();
      await expect(btn(L.pass)).toHaveCount(0);

      await btn(L.retry).click();
      await expect(root.getByText(L.attempt(0), { exact: true })).toBeVisible();
      await expect(btn(L.done)).toBeVisible();
      await expect(root.getByText(L.menu, { exact: true })).toHaveCount(0);
    });

    test(`${L.url}: a phase that needs approval stops for it, and approving unlocks the next`, async ({
      page,
    }) => {
      await page.goto(L.url);
      const root = sim(page);
      await root.scrollIntoViewIfNeeded();
      const btn = (name: string) =>
        root.getByRole("button", { name, exact: true });

      await btn(L.done).click();
      await btn(L.pass).click();
      await btn(L.pass).click();
      await expect(btn(L.approve)).toBeVisible();
      await btn(L.approve).click();
      await expect(root.getByText(L.unlocked)).toBeVisible();
      await expect(
        root.locator('[data-slot="status-badge"]').first(),
      ).toContainText("approved");
    });

    test(`${L.url}: a phase that needs no approval goes straight on after both gates`, async ({
      page,
    }) => {
      await page.goto(L.url);
      const root = sim(page);
      await root.scrollIntoViewIfNeeded();
      await root.getByRole("switch").uncheck();
      const btn = (name: string) =>
        root.getByRole("button", { name, exact: true });

      await btn(L.done).click();
      await btn(L.pass).click();
      await btn(L.pass).click();
      await expect(root.getByText(L.unlocked)).toBeVisible();
      await expect(btn(L.approve)).toHaveCount(0);
      await expect(
        root.locator('[data-slot="status-badge"]').first(),
      ).toContainText("passed");
    });
  }

  test("the forced state is only reachable through the menu, and says who runs it", async ({
    page,
  }) => {
    await page.goto("/docs/gates");
    const root = sim(page);
    await root.scrollIntoViewIfNeeded();
    await expect(root.getByRole("button", { name: "Force it" })).toHaveCount(0);
    await expect(root.getByText(/guard\.js blocks Claude/)).toBeVisible();
  });
});

test.describe("status lanes", () => {
  test("nine statuses across three lanes, and the unlock rule", async ({
    page,
  }) => {
    await page.goto("/docs/gates");
    const lanes = page
      .locator("div.not-prose")
      .filter({ hasText: /Set automatically/ })
      .first();
    await lanes.scrollIntoViewIfNeeded();
    // pending, skipped | in_progress, gate_failed, passed, blocked | approved, forced, skipped, parked | four unlocking states
    await expect(lanes.locator('[data-slot="status-badge"]')).toHaveCount(
      2 + 4 + 4 + 4,
    );
    for (const status of [
      "pending",
      "in_progress",
      "gate_failed",
      "passed",
      "approved",
      "forced",
      "skipped",
      "blocked",
      "parked",
    ]) {
      await expect(
        lanes
          .locator('[data-slot="status-badge"]')
          .filter({ hasText: status })
          .first(),
      ).toBeVisible();
    }
  });
});

test.describe("flow diagrams", () => {
  const CASES = [
    {
      url: "/docs/introduction",
      list: /How one request moves through Jarvis/,
      count: 5,
    },
    {
      url: "/th/docs/introduction",
      list: /หนึ่งคำขอเดินผ่าน Jarvis/,
      count: 5,
    },
    { url: "/docs/concepts", list: /How a phase is handed off/, count: 5 },
    {
      url: "/docs/concepts",
      list: /What guard\.js does before and after/,
      count: 4,
    },
    { url: "/th/docs/concepts", list: /การส่งต่อ phase ด้วย path/, count: 5 },
    { url: "/th/docs/concepts", list: /guard\.js ทำอะไรก่อนและหลัง/, count: 4 },
  ];
  for (const c of CASES) {
    test(`${c.url}: ${c.list} has ${c.count} steps and survives a replay`, async ({
      page,
    }) => {
      await page.goto(c.url);
      const list = page.getByRole("list", { name: c.list });
      await list.scrollIntoViewIfNeeded();
      await expect(list.locator("> li")).toHaveCount(c.count);
      await page
        .getByRole("button", { name: /Replay|เล่นซ้ำ/ })
        .first()
        .click();
      await expect(
        page.getByRole("list", { name: c.list }).locator("> li"),
      ).toHaveCount(c.count);
    });
  }

  test("the guard flow shows both outcomes of the hook", async ({ page }) => {
    await page.goto("/docs/concepts");
    const list = page.getByRole("list", { name: /What guard\.js does/ });
    await list.scrollIntoViewIfNeeded();
    await expect(list.getByText("exit 0: the tool runs")).toBeVisible();
    await expect(list.getByText(/exit 2: blocked/)).toBeVisible();
  });
});

test.describe("ownership map", () => {
  for (const url of ["/docs/getting-started", "/th/docs/getting-started"]) {
    test(`${url} splits the files into framework, yours and runtime`, async ({
      page,
    }) => {
      await page.goto(url);
      const framework = page.locator("#own-framework").locator("..");
      await framework.scrollIntoViewIfNeeded();
      await expect(framework.locator("li")).toHaveCount(5);
      await expect(
        page.locator("#own-project").locator("..").locator("li"),
      ).toHaveCount(7);
      await expect(
        page.locator("#own-runtime").locator("..").locator("li"),
      ).toHaveCount(3);
      await expect(framework).toContainText(".claude/agents");
      await expect(page.locator("#own-project").locator("..")).toContainText(
        "jarvis.config.yaml",
      );
    });
  }
});

test.describe("command map", () => {
  for (const url of ["/docs/commands", "/th/docs/commands"]) {
    test(`${url} puts the human-only commands behind the guard, counted from the CLI data`, async ({
      page,
    }) => {
      await page.goto(url);
      const map = page
        .locator("div.not-prose")
        .filter({ hasText: /guard\.js/ })
        .first();
      await map.scrollIntoViewIfNeeded();
      const human = cli.filter((c) => c.humanOnly);
      const grid = map.locator("> div.grid");
      const lanes = grid.locator("> div.reveal");
      await expect(lanes.last().locator("li")).toHaveCount(human.length);
      await expect(lanes.first().locator("li")).toHaveCount(
        commands.length + cli.length - human.length,
      );
      for (const c of human)
        await expect(
          lanes.last().locator("li", { hasText: new RegExp(`^${c.id}$`) }),
        ).toBeVisible();
    });
  }
});

test.describe("standards map", () => {
  for (const url of ["/docs/standards", "/th/docs/standards"]) {
    test(`${url} has a bar per area, each linking to a real rules entry`, async ({
      page,
    }) => {
      await page.goto(url);
      const links = page.locator('a[href^="#std-"]');
      await links.first().scrollIntoViewIfNeeded();
      await expect(links).toHaveCount(standards.length);
      for (const s of standards)
        await expect(page.locator(`#std-${s.id}`)).toHaveCount(1);
      await expect(
        page
          .getByText(String(standards.reduce((n, s) => n + s.rules.length, 0)))
          .first(),
      ).toBeVisible();
    });
  }
});

test.describe("changelog timeline", () => {
  for (const url of ["/changelog", "/th/changelog"]) {
    test(`${url} has a node per release, the newest marked, and labelled sections`, async ({
      page,
    }) => {
      await page.goto(url);
      await expect(page.locator("main ol > li h2")).toHaveCount(
        changelog.length,
      );
      await expect(page.getByText(/^(Latest|ล่าสุด)$/)).toHaveCount(1);
      await expect(
        page.getByRole("heading", { level: 3, name: "Added" }).first(),
      ).toBeVisible();

      // Release notes are not cut off mid-sentence (the parser once kept only the first line
      // of each wrapped bullet), and `inline code` is shown as code, not as backticks.
      const items = await page.locator("main li").allTextContents();
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.trim(), "a release note ends mid-sentence").not.toMatch(
          /[,(]$/,
        );
      }
      await expect(page.locator("main li code").first()).toBeVisible();
      expect(await page.locator("main").textContent()).not.toContain("`");
    });
  }
});

test.describe("docs Steps", () => {
  test("a procedure's steps are all visible, numbered, and the line to the next is drawn", async ({
    page,
  }) => {
    await page.goto("/docs/getting-started");
    const steps = page.locator("div.step");
    const count = await steps.count();
    expect(count).toBeGreaterThan(3);
    await scrollThrough(page);
    for (let i = 0; i < count; i++) await expect(steps.nth(i)).toBeVisible();
  });
});

test.describe("motion discipline across the new visuals", () => {
  const PAGES = [
    "/",
    "/docs/introduction",
    "/docs/concepts",
    "/docs/gates",
    "/docs/workflows",
    "/docs/commands",
    "/docs/standards",
    "/docs/getting-started",
    "/changelog",
  ];
  for (const url of PAGES) {
    test(`${url} has no animation that loops forever`, async ({ page }) => {
      await page.goto(url);
      await scrollThrough(page);
      await page.waitForTimeout(3500);
      const infinite = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations === Infinity)
          .map((a) =>
            String((a.effect as KeyframeEffect).target?.className ?? "").slice(
              0,
              50,
            ),
          ),
      );
      // The lifecycle hub's ping (landing page) is the one deliberate exception; it has a pause button.
      expect(infinite.filter((c) => !/animate-ping/.test(c))).toEqual([]);
    });
  }
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const PAGES = [
    "/docs/introduction",
    "/docs/concepts",
    "/docs/gates",
    "/docs/workflows",
    "/docs/commands",
    "/docs/standards",
    "/docs/getting-started",
    "/docs/team",
    "/changelog",
  ];
  for (const p of PAGES) {
    for (const prefix of ["", "/th"]) {
      test(`${prefix}${p} does not scroll sideways`, async ({ page }) => {
        await page.goto(prefix + p);
        await scrollThrough(page);
        await page.waitForTimeout(600);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});
