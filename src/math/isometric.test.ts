import { describe, it, expect } from "vitest";
import { worldToScreen, screenToWorld, depthSort } from "@/math/isometric";

describe("isometric projection", () => {
  it("worldToScreen and screenToWorld roundtrip at origin", () => {
    const screen = worldToScreen(0, 0, 0);
    const world = screenToWorld(screen.sx, screen.sy, 0);
    expect(world.wx).toBeCloseTo(0, 5);
    expect(world.wy).toBeCloseTo(0, 5);
  });

  it("worldToScreen and screenToWorld roundtrip at various coords", () => {
    const coords = [
      { x: 100, y: 50 },
      { x: -200, y: 300 },
      { x: 0, y: -150 },
      { x: 500, y: 500 },
    ];
    for (const c of coords) {
      const screen = worldToScreen(c.x, c.y, 0);
      const world = screenToWorld(screen.sx, screen.sy, 0);
      expect(world.wx).toBeCloseTo(c.x, 3);
      expect(world.wy).toBeCloseTo(c.y, 3);
    }
  });

  it("roundtrip with non-zero z", () => {
    const screen = worldToScreen(100, 200, 50);
    const world = screenToWorld(screen.sx, screen.sy, 50);
    expect(world.wx).toBeCloseTo(100, 3);
    expect(world.wy).toBeCloseTo(200, 3);
  });

  it("depthSort: objects further in Y sort earlier", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 100 };
    // b is further "into" the screen, should render first (lower sy)
    // Actually with our projection, higher world y -> higher screen sy
    const result = depthSort(a, b);
    expect(result).toBeLessThan(0); // a renders before b
  });

  it("depthSort handles equal positions", () => {
    const a = { x: 50, y: 50 };
    const b = { x: 50, y: 50 };
    expect(depthSort(a, b)).toBe(0);
  });
});
