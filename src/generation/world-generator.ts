import { seedFromAddress, SeededRandom } from "@/math/hash";
import {
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  STEPS_PER_FLOOR,
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

export class WorldGenerator {
  private cache = new Map<number, StepData>();

  getStep(worldStep: number): StepData | undefined {
    if (this.cache.has(worldStep)) return this.cache.get(worldStep);

    const data = this.generateStep(worldStep);
    this.cache.set(worldStep, data);

    // Keep cache bounded
    if (this.cache.size > 500) {
      const first = this.cache.keys().next().value;
      if (first !== undefined) this.cache.delete(first);
    }

    return data;
  }

  update(_playerPosition: number) {
    // Generation is on-demand via getStep
  }

  private generateStep(worldStep: number): StepData {
    const floor = Math.floor(worldStep / STEPS_PER_FLOOR);
    const segment = ((worldStep % STEPS_PER_FLOOR) + STEPS_PER_FLOOR) % STEPS_PER_FLOOR;

    const shelves: BookInfo[][] = [];

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfBooks: BookInfo[] = [];

      for (let b = 0; b < BOOKS_PER_SHELF; b++) {
        const bookSeed = seedFromAddress(floor, segment, s, b);
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
