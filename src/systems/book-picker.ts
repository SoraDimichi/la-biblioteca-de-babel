import type { InputSystem } from "@/systems/input";
import type { CameraSystem } from "@/systems/camera";
import type { BookAddress } from "@/generation/book-data";
import { pixelToHex, hexKey } from "@/math/hex";

export interface BookPickerResult {
  hovered: BookAddress | null;
  clicked: BookAddress | null;
}

export class BookPicker {
  private hoveredBook: BookAddress | null = null;

  update(input: InputSystem, camera: CameraSystem): BookPickerResult {
    const mouse = input.getMouseScreen();

    // Convert screen position to world position
    const worldX = (mouse.x - camera.worldToScreenOffset(0, 0).x) / camera.zoom + camera.x;
    const worldY = (mouse.y - camera.worldToScreenOffset(0, 0).y) / camera.zoom + camera.y;

    // Find which hex the mouse is over
    const hex = pixelToHex(worldX, worldY);
    const floor = camera.currentFloor;

    // For now, create a simple book address based on position within the hex
    // Full hit-testing against individual book spines will be refined later
    const address: BookAddress = {
      hex: { q: hex.q, r: hex.r, y: floor },
      wall: 0,
      shelf: 0,
      slot: 0,
    };

    this.hoveredBook = address;

    const clicked = input.consumeClick() ? address : null;

    return {
      hovered: this.hoveredBook,
      clicked,
    };
  }
}
