import { describe, it, expect } from "vitest";
import { deriveBookData, type BookAddress } from "@/generation/book-data";
import { BOOK_SPINE_COLORS } from "@/config";

describe("book-data", () => {
  const addr: BookAddress = {
    hex: { q: 1, r: 2, y: 0 },
    wall: 0,
    shelf: 0,
    slot: 0,
  };

  it("same address produces same book data", () => {
    const a = deriveBookData(addr);
    const b = deriveBookData(addr);
    expect(a.seed).toBe(b.seed);
    expect(a.color).toBe(b.color);
    expect(a.width).toBe(b.width);
  });

  it("different addresses produce different data", () => {
    const addr2: BookAddress = { ...addr, slot: 1 };
    const a = deriveBookData(addr);
    const b = deriveBookData(addr2);
    expect(a.seed).not.toBe(b.seed);
  });

  it("width is in valid range", () => {
    for (let slot = 0; slot < 100; slot++) {
      const data = deriveBookData({ ...addr, slot });
      expect(data.width).toBeGreaterThanOrEqual(2);
      expect(data.width).toBeLessThanOrEqual(6);
    }
  });

  it("color is from the palette", () => {
    for (let slot = 0; slot < 50; slot++) {
      const data = deriveBookData({ ...addr, slot });
      expect(BOOK_SPINE_COLORS).toContain(data.color);
    }
  });
});
