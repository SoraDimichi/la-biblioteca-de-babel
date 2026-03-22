import { seedFromAddress, SeededRandom } from "@/math/hash";
import { BOOK_SPINE_COLORS } from "@/config";

export interface BookAddress {
  floor: number;
  segment: number;
  shelf: number;
  slot: number;
}

export interface BookData {
  address: BookAddress;
  seed: number;
  colorIndex: number;
  width: number;
}

const HEX_WALLS = 6;

export function deriveBookData(address: BookAddress): BookData {
  const seed = seedFromAddress(
    address.floor,
    address.segment,
    address.shelf,
    address.slot
  );

  const rng = new SeededRandom(seed);
  const colorIndex = rng.nextInt(0, BOOK_SPINE_COLORS.length - 1);
  const width = 2 + rng.nextInt(0, 4);

  return { address, seed, colorIndex, width };
}

export function bookAddressFromWorldStep(
  worldStep: number,
  shelf: number,
  slot: number
): BookAddress {
  const floor = Math.floor(worldStep / HEX_WALLS);
  const segment = ((worldStep % HEX_WALLS) + HEX_WALLS) % HEX_WALLS;
  return { floor, segment, shelf, slot };
}
