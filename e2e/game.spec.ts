import { test, expect } from "@playwright/test";

test.describe("Library of Babel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
  });

  test("canvas renders with content", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/01-initial.png" });

    const hasContent = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return false;
      const ctx = c.getContext("2d");
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 400) {
        colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
      }
      return colors.size > 3;
    });
    expect(hasContent).toBe(true);
  });

  test("walk around and take screenshots", async ({ page }) => {
    // Walk forward
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/02-after-w.png" });

    // Strafe right
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/03-after-d.png" });

    // Walk backward
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyS");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/04-after-s.png" });

    // Strafe left
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyA");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/05-after-a.png" });

    // Turn right (arrow)
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(600);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/06-turn-right.png" });

    // Turn more right
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(600);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/07-turn-right2.png" });

    // Walk forward to wall
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/08-at-wall.png" });

    // Turn around
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(1200);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/09-turned-around.png" });

    // Walk to opposite wall
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(200);
    await page.screenshot({ path: "e2e/screenshots/10-opposite-wall.png" });
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});
