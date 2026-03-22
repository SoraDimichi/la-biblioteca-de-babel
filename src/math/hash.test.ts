import { describe, it, expect } from "vitest";
import { hash, SeededRandom, seedFromAddress } from "@/math/hash";

describe("hash", () => {
  it("produces consistent results", () => {
    expect(hash(1, 2)).toBe(hash(1, 2));
    expect(hash(0, 0)).toBe(hash(0, 0));
  });

  it("produces different results for different inputs", () => {
    expect(hash(1, 2)).not.toBe(hash(2, 1));
    expect(hash(0, 0)).not.toBe(hash(0, 1));
    expect(hash(0, 0)).not.toBe(hash(1, 0));
  });
});

describe("SeededRandom", () => {
  it("produces deterministic sequence from same seed", () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences from different seeds", () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(43);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it("produces values in [0, 1) range", () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("nextInt produces values in range", () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(0, 24);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(24);
    }
  });
});

describe("seedFromAddress", () => {
  it("same address produces same seed", () => {
    expect(seedFromAddress(1, 2, 3)).toBe(seedFromAddress(1, 2, 3));
  });

  it("different addresses produce different seeds", () => {
    const seeds = new Set([
      seedFromAddress(0, 0, 0),
      seedFromAddress(1, 0, 0),
      seedFromAddress(0, 1, 0),
      seedFromAddress(0, 0, 1),
      seedFromAddress(1, 1, 0),
      seedFromAddress(0, 1, 1),
    ]);
    expect(seeds.size).toBe(6);
  });

  it("different book positions produce different seeds", () => {
    const s1 = seedFromAddress(0, 0, 0, 0);
    const s2 = seedFromAddress(0, 0, 0, 1);
    const s3 = seedFromAddress(0, 0, 1, 0);
    const s4 = seedFromAddress(0, 1, 0, 0);
    const seeds = new Set([s1, s2, s3, s4]);
    expect(seeds.size).toBe(4);
  });
});
