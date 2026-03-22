import { describe, it, expect } from "vitest";
import {
  hexToPixel,
  pixelToHex,
  hexNeighbors,
  hexDistance,
  hexRing,
  hexSpiral,
} from "@/math/hex";

describe("hex math", () => {
  it("hexToPixel and pixelToHex roundtrip at origin", () => {
    const pixel = hexToPixel(0, 0);
    const hex = pixelToHex(pixel.x, pixel.y);
    expect(hex.q).toBe(0);
    expect(hex.r).toBe(0);
  });

  it("hexToPixel and pixelToHex roundtrip at various coords", () => {
    const coords = [
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: 3, r: -2 },
      { q: -5, r: 7 },
    ];
    for (const c of coords) {
      const pixel = hexToPixel(c.q, c.r);
      const result = pixelToHex(pixel.x, pixel.y);
      expect(result.q).toBe(c.q);
      expect(result.r).toBe(c.r);
    }
  });

  it("hexNeighbors returns 6 neighbors", () => {
    const neighbors = hexNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
    for (const n of neighbors) {
      expect(hexDistance({ q: 0, r: 0 }, n)).toBe(1);
    }
  });

  it("hexDistance returns 0 for same coord", () => {
    expect(hexDistance({ q: 3, r: -1 }, { q: 3, r: -1 })).toBe(0);
  });

  it("hexDistance is correct for known values", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3);
  });

  it("hexRing(0) returns just the center", () => {
    const ring = hexRing({ q: 0, r: 0 }, 0);
    expect(ring).toHaveLength(1);
    expect(ring[0]).toEqual({ q: 0, r: 0 });
  });

  it("hexRing(n) returns 6*n cells for n>0", () => {
    expect(hexRing({ q: 0, r: 0 }, 1)).toHaveLength(6);
    expect(hexRing({ q: 0, r: 0 }, 2)).toHaveLength(12);
    expect(hexRing({ q: 0, r: 0 }, 3)).toHaveLength(18);
  });

  it("all ring cells are at correct distance", () => {
    const center = { q: 2, r: -1 };
    const ring = hexRing(center, 3);
    for (const cell of ring) {
      expect(hexDistance(center, cell)).toBe(3);
    }
  });

  it("hexSpiral returns correct total count", () => {
    // spiral(r) = 1 + 6*1 + 6*2 + ... + 6*r = 1 + 3*r*(r+1)
    const spiral = hexSpiral({ q: 0, r: 0 }, 3);
    expect(spiral).toHaveLength(1 + 3 * 3 * 4);
  });
});
