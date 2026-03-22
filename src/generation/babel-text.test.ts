import { describe, it, expect } from "vitest";
import { generatePage, getBookTitle } from "@/generation/babel-text";
import { BABEL_ALPHABET, LINES_PER_PAGE, CHARS_PER_LINE } from "@/config";

describe("babel-text", () => {
  it("same seed and page produce same text", () => {
    const text1 = generatePage(42, 0);
    const text2 = generatePage(42, 0);
    expect(text1).toBe(text2);
  });

  it("different pages produce different text", () => {
    const page0 = generatePage(42, 0);
    const page1 = generatePage(42, 1);
    expect(page0).not.toBe(page1);
  });

  it("different seeds produce different text", () => {
    const text1 = generatePage(42, 0);
    const text2 = generatePage(43, 0);
    expect(text1).not.toBe(text2);
  });

  it("page has correct dimensions", () => {
    const text = generatePage(100, 5);
    const lines = text.split("\n");
    expect(lines).toHaveLength(LINES_PER_PAGE);
    for (const line of lines) {
      expect(line).toHaveLength(CHARS_PER_LINE);
    }
  });

  it("all characters are from the Babel alphabet", () => {
    const text = generatePage(999, 0);
    const validChars = new Set(BABEL_ALPHABET.split(""));
    for (const char of text) {
      if (char === "\n") continue;
      expect(validChars.has(char)).toBe(true);
    }
  });

  it("page 300 can be generated without generating pages 0-299", () => {
    const start = performance.now();
    const text = generatePage(42, 300);
    const elapsed = performance.now() - start;
    expect(text.split("\n")).toHaveLength(LINES_PER_PAGE);
    expect(elapsed).toBeLessThan(50); // should be <1ms
  });

  it("getBookTitle returns first 20 chars trimmed", () => {
    const title = getBookTitle(42);
    expect(title.length).toBeLessThanOrEqual(20);
    expect(title.length).toBeGreaterThan(0);
  });
});
