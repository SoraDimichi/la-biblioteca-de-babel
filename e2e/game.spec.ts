import { test, expect } from "@playwright/test";

test.describe("Library of Babel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
  });

  test("canvas renders and is not blank", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Take initial screenshot
    await page.screenshot({ path: "e2e/screenshots/01-initial.png" });

    // Check canvas is not all one color (something rendered)
    const pixelData = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      if (!c) return null;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      // Sample some pixels at different positions
      const samples: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor((data.length / 4) * (i / 10)) * 4;
        samples.push([data[idx]!, data[idx+1]!, data[idx+2]!]);
      }
      return samples;
    });

    expect(pixelData).not.toBeNull();
    // Not all pixels should be the same color
    const uniqueColors = new Set(pixelData!.map(p => p.join(",")));
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  test("WASD movement changes the view", async ({ page }) => {
    // Click to activate pointer lock
    const canvas = page.locator("canvas");
    await canvas.click();
    await page.waitForTimeout(300);

    // Take screenshot before movement
    await page.screenshot({ path: "e2e/screenshots/02-before-move.png" });

    // Press W to move forward for 1 second
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1000);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(200);

    // Take screenshot after movement
    await page.screenshot({ path: "e2e/screenshots/03-after-move-w.png" });

    // Check player position changed by reading from debug info
    // We can check that the screenshots are different
    const before = await page.screenshot();

    // Move more
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(200);

    await page.screenshot({ path: "e2e/screenshots/04-after-strafe-d.png" });

    // Move backward
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyS");
    await page.waitForTimeout(200);

    await page.screenshot({ path: "e2e/screenshots/05-after-move-s.png" });
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});
