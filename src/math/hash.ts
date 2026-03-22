export function hash(a: number, b: number): number {
  let h = ((a * 0x45d9f3b) ^ b) >>> 0;
  h = ((h >>> 16) ^ h) * 0x45d9f3b >>> 0;
  h = ((h >>> 16) ^ h) >>> 0;
  return h;
}

export function seedFromAddress(
  floor: number,
  segment: number,
  shelf = 0,
  slot = 0
): number {
  let seed = hash(floor + 10000, segment + 10000);
  seed = hash(seed, shelf + 10000);
  seed = hash(seed, slot);
  return seed;
}

// xoshiro128** PRNG - fast, good distribution, small state
export class SeededRandom {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    this.s0 = this.splitmix32(seed);
    this.s1 = this.splitmix32(this.s0);
    this.s2 = this.splitmix32(this.s1);
    this.s3 = this.splitmix32(this.s2);
  }

  private splitmix32(state: number): number {
    state = (state + 0x9e3779b9) | 0;
    let t = state ^ (state >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return t >>> 0;
  }

  private rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  next(): number {
    const result = (Math.imul(this.rotl(Math.imul(this.s1, 5), 7), 9)) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = this.rotl(this.s3, 11);
    return result / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}
