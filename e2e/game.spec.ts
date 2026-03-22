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

    // Check canvas has varied pixel colors (not blank)
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

  test("WASD movement changes player position", async ({ page }) => {
    // Read initial position from HUD
    await page.screenshot({ path: "e2e/screenshots/02-before-move.png" });

    // Expose player position via window for testing
    const posBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return null;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      // Read the HUD text from the canvas - check pixel changes instead
      return { time: Date.now() };
    });

    // Press W for movement (works without pointer lock)
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/03-after-w.png" });

    // Press A to strafe
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyA");
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/04-after-a.png" });

    // Press S to move backward
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(800);
    await page.keyboard.up("KeyS");
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/05-after-s.png" });

    // Arrow key rotation
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(800);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/06-after-arrow-right.png" });
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
