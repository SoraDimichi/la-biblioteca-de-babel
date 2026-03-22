import { test, expect } from "@playwright/test";

test("canvas renders without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.goto("/");
  await page.waitForTimeout(2000);

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);

  await page.screenshot({ path: "e2e/screenshots/initial.png" });

  expect(errors).toHaveLength(0);
});
