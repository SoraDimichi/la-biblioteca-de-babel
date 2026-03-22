import { describe, it, expect } from "vitest";
import {
  WALL_COUNT,
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  BOOKS_PER_ROOM,
  BABEL_ALPHABET,
} from "@/config";

describe("config", () => {
  it("has correct books per room", () => {
    expect(BOOKS_PER_ROOM).toBe(WALL_COUNT * SHELVES_PER_WALL * BOOKS_PER_SHELF);
    expect(BOOKS_PER_ROOM).toBe(1050);
  });

  it("has 25-symbol Babel alphabet", () => {
    expect(BABEL_ALPHABET.length).toBe(25);
  });
});
