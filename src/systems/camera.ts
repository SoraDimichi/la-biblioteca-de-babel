import {
  CAMERA_MOVE_SPEED,
  CAMERA_LERP_FACTOR,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_SPEED,
} from "@/config";
import { pixelToHex, type HexCoord, hexSpiral } from "@/math/hex";
import type { InputSystem } from "@/systems/input";

export class CameraSystem {
  // Current smooth position
  x = 0;
  y = 0;
  z = 0;
  zoom = 1;

  // Target position (lerp toward)
  private targetX = 0;
  private targetY = 0;
  private targetZ = 0;
  private targetZoom = 1;

  private screenWidth = 0;
  private screenHeight = 0;

  constructor(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  update(dt: number, input: InputSystem) {
    const move = input.getMovementVector();
    const speed = CAMERA_MOVE_SPEED * dt / this.zoom;

    this.targetX += move.x * speed;
    this.targetY += move.y * speed;

    // Floor transitions (discrete, edge-triggered)
    if (input.wasJustPressed("KeyQ") || input.wasJustPressed("PageUp")) {
      this.targetZ += 1;
    }
    if (input.wasJustPressed("KeyE") || input.wasJustPressed("PageDown")) {
      this.targetZ -= 1;
    }

    // Zoom
    const scroll = input.consumeScroll();
    if (scroll !== 0) {
      const zoomDelta = scroll > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
      this.targetZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.targetZoom + zoomDelta));
    }

    // Smooth lerp
    const lerp = CAMERA_LERP_FACTOR;
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;
    this.z += (this.targetZ - this.z) * lerp;
    this.zoom += (this.targetZoom - this.zoom) * lerp;
  }

  get currentFloor(): number {
    return Math.round(this.targetZ);
  }

  getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfW = (this.screenWidth / 2) / this.zoom;
    const halfH = (this.screenHeight / 2) / this.zoom;
    return {
      minX: this.x - halfW,
      minY: this.y - halfH,
      maxX: this.x + halfW,
      maxY: this.y + halfH,
    };
  }

  getVisibleHexes(radius: number): HexCoord[] {
    const centerHex = pixelToHex(this.x, this.y);
    return hexSpiral(centerHex, radius);
  }

  worldToScreenOffset(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + this.screenWidth / 2,
      y: (wy - this.y) * this.zoom + this.screenHeight / 2,
    };
  }
}
