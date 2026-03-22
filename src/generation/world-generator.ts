import { seedFromAddress, SeededRandom } from "@/math/hash";
import {
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  STEPS_PER_FLOOR,
  VIEW_DISTANCE,
  BOOK_SPINE_COLORS,
} from "@/config";

export interface BookInfo {
  colorIndex: number;
  width: number; // 2-6
  seed: number;
}

export interface StepData {
  worldStep: number;
  shelves: BookInfo[][]; // [shelf][book]
}

export class WorldGenerator {
  private cache = new Map<number, StepData>();

  getStep(worldStep: number): StepData | undefined {
    if (this.cache.has(worldStep)) return this.cache.get(worldStep);

    const data = this.generateStep(worldStep);
    this.cache.set(worldStep, data);
    return data;
  }

  update(playerPosition: number) {
    const center = Math.floor(playerPosition);

    // Evict steps outside view range
    for (const [step] of this.cache) {
      if (Math.abs(step - center) > VIEW_DISTANCE + 5) {
        this.cache.delete(step);
      }
    }

    // Pre-generate visible steps
    for (let offset = -2; offset <= VIEW_DISTANCE; offset++) {
      const step = center + offset;
      if (!this.cache.has(step)) {
        this.cache.set(step, this.generateStep(step));
      }
    }
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
