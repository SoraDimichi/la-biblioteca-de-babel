import { seedFromAddress, SeededRandom } from "@/math/hash";
import {
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  BOOK_SPINE_COLORS,
} from "@/config";

export interface BookInfo {
  colorIndex: number;
  width: number;
  seed: number;
}

export interface StepData {
  worldStep: number;
  shelves: BookInfo[][];
}

const HEX_WALLS = 6;

export class WorldGenerator {
  private cache = new Map<number, StepData>();

  getStep(worldStep: number): StepData | undefined {
    const cached = this.cache.get(worldStep);
    if (cached) {
      // Move to end for LRU behavior (delete + re-insert)
      this.cache.delete(worldStep);
      this.cache.set(worldStep, cached);
      return cached;
    }

    const data = this.generateStep(worldStep);
    this.cache.set(worldStep, data);

    // Evict oldest entries if cache too large
    if (this.cache.size > 500) {
      const first = this.cache.keys().next().value;
      if (first !== undefined) this.cache.delete(first);
    }

    return data;
  }

  private generateStep(worldStep: number): StepData {
    const floor = Math.floor(worldStep / HEX_WALLS);
    const wallIdx = ((worldStep % HEX_WALLS) + HEX_WALLS) % HEX_WALLS;

    const shelves: BookInfo[][] = [];

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfBooks: BookInfo[] = [];

      for (let b = 0; b < BOOKS_PER_SHELF; b++) {
        const bookSeed = seedFromAddress(floor, wallIdx, s, b);
        const rng = new SeededRandom(bookSeed);
        const colorIndex = rng.nextInt(0, BOOK_SPINE_COLORS.length - 1);
        const width = 2 + rng.nextInt(0, 4);

        shelfBooks.push({ colorIndex, width, seed: bookSeed });
      }

      shelves.push(shelfBooks);
    }

    return { worldStep, shelves };
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
