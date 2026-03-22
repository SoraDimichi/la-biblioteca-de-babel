import type { HexAddress } from "@/math/hex";
import { seedFromAddress, SeededRandom } from "@/math/hash";
import { BOOK_SPINE_COLORS } from "@/config";

export interface BookAddress {
  hex: HexAddress;
  wall: number;
  shelf: number;
  slot: number;
}

export interface BookData {
  address: BookAddress;
  seed: number;
  color: number;
  width: number;
}

export function deriveBookData(address: BookAddress): BookData {
  const seed = seedFromAddress(
    address.hex.q,
    address.hex.r,
    address.hex.y,
    address.wall,
    address.shelf,
    address.slot
  );

  const rng = new SeededRandom(seed);
  const colorIndex = rng.nextInt(0, BOOK_SPINE_COLORS.length - 1);
  const color = BOOK_SPINE_COLORS[colorIndex]!;
  const width = 2 + rng.nextInt(0, 4); // 2-6px

  return { address, seed, color, width };
}
