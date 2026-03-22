import type { InputSystem } from "@/systems/input";
import type { CameraSystem } from "@/systems/camera";
import type { BookAddress } from "@/generation/book-data";
import { pixelToHex, hexToPixel } from "@/math/hex";
import { WALL_COUNT, SHELVES_PER_WALL, BOOKS_PER_SHELF, HEX_RADIUS } from "@/config";

export interface BookPickerResult {
  hovered: BookAddress | null;
  clicked: BookAddress | null;
}

export class BookPicker {
  update(input: InputSystem, camera: CameraSystem): BookPickerResult {
    const mouse = input.getMouseScreen();

    // Convert screen to world position
    const offsetOrigin = camera.worldToScreenOffset(0, 0);
    const worldX = (mouse.x - offsetOrigin.x) / camera.zoom + camera.x;
    const worldY = (mouse.y - offsetOrigin.y) / camera.zoom + camera.y;

    // Find which hex the mouse is over
    const hex = pixelToHex(worldX, worldY);
    const hexCenter = hexToPixel(hex.q, hex.r);

    // Relative position within the hex
    const dx = worldX - hexCenter.x;
    const dy = worldY - hexCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only pick books if cursor is near the walls (outer 40% of hex radius)
    if (dist < HEX_RADIUS * 0.4) {
      return { hovered: null, clicked: null };
    }

    // Determine wall from angle (flat-top hex: wall 0 starts at 0 degrees)
    const angle = Math.atan2(dy, dx);
    const normalizedAngle = ((angle + Math.PI * 2) % (Math.PI * 2));
    const wall = Math.floor(normalizedAngle / (Math.PI * 2 / WALL_COUNT)) % WALL_COUNT;

    // Use fractional position along the wall for slot, and distance for shelf
    const wallFraction = (normalizedAngle % (Math.PI * 2 / WALL_COUNT)) / (Math.PI * 2 / WALL_COUNT);
    const slot = Math.floor(wallFraction * BOOKS_PER_SHELF);

    // Use radial distance to approximate shelf (closer to wall = higher shelf)
    const radialFraction = (dist - HEX_RADIUS * 0.4) / (HEX_RADIUS * 0.6);
    const shelf = Math.min(SHELVES_PER_WALL - 1, Math.floor(radialFraction * SHELVES_PER_WALL));

    const floor = camera.currentFloor;
    const address: BookAddress = {
      hex: { q: hex.q, r: hex.r, y: floor },
      wall,
      shelf,
      slot,
    };

    const clicked = input.consumeClick() ? address : null;

    return {
      hovered: address,
      clicked,
    };
  }
}
