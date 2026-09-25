import { expect, test } from "@playwright/test";

// A phone must never have to scroll sideways. A long unbreakable string in a lifecycle stage
// panel once made the grid track wider than the screen and pushed the whole page 35px past it
// (DECISIONS.md D-054), on the docs page and the landing page alike. Every stage is opened in
// turn because each panel has a different longest word.
test.use({ viewport: { width: 390, height: 844 } });

/** Which elements reach past the right edge and are not clipped by a scroll container. Named in
 *  the failure message, because "8px too wide" alone does not say what to fix, and a CI runner
 *  (different fonts) can overflow where a developer's machine does not. */
async function offenders(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height || b.right <= vw + 0.5) continue;
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        if (
          ["auto", "scroll", "hidden"].includes(getComputedStyle(p).overflowX)
        ) {
          clipped = true;
          break;
        }
        p = p.parentElement;
      }
      if (clipped) continue;
      const cls = String(el.getAttribute("class") ?? "")
        .split(" ")
        .slice(0, 5)
        .join(" ");
      const text = (el.textContent ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 40);
      out.push(
        `<${el.tagName.toLowerCase()} class="${cls}"> right=${Math.round(b.right)} width=${Math.round(b.width)} "${text}"`,
      );
    }
    return out.slice(0, 8);
  });
}

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
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const culprits = overflow > 0 ? await offenders(page) : [];
      expect(
        overflow,
        `stage ${i} on ${path} is ${overflow}px too wide. Reaching past the edge:\n${culprits.join("\n")}`,
      ).toBeLessThanOrEqual(0);
    }
  });
}
