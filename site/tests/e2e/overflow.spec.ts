import { expect, test } from "@playwright/test";

// A phone must never have to scroll sideways. A long unbreakable string in a lifecycle stage
// panel once made the grid track wider than the screen and pushed the whole page 35px past it
// (DECISIONS.md D-054), on the docs page and the landing page alike. Every stage is opened in
// turn because each panel has a different longest word.
test.use({ viewport: { width: 390, height: 844 } });

for (const path of ["/docs/sdlc", "/th/docs/sdlc", "/", "/th"]) {
  test(`${path} does not scroll sideways on a phone`, async ({ page }) => {
    await page.goto(path);
    const stages = page
      .getByRole("tablist", { name: /SDLC stages|ขั้นของ SDLC/ })
      .getByRole("tab");
    const count = await stages.count();
    expect(count, "the lifecycle should offer six stages").toBe(6);
    for (let i = 0; i < count; i++) {
      await stages.nth(i).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `stage ${i} on ${path}`).toBeLessThanOrEqual(0);
    }
  });
}
