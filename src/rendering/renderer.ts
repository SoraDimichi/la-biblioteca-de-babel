import {
  RENDER_WIDTH, RENDER_HEIGHT, COLOR_BG,
  FOV, EYE_HEIGHT, CORRIDOR_WIDTH, CURVE_PER_STEP, STEP_RISE,
  VIEW_STEPS, FOG_START_FRAC, PITCH_LIMIT,
  COLOR_FLOOR, COLOR_FLOOR_ALT, COLOR_CEILING,
  COLOR_WALL_OUTER, COLOR_WALL_INNER, COLOR_SHELF, COLOR_RAILING,
  SHELVES_PER_WALL, BOOK_SPINE_COLORS, STEPS_PER_FLOOR,
  type RGB,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";

export interface BookHit {
  worldStep: number;
  floor: number;
  segment: number;
  shelf: number;
  slot: number;
}

interface Projected {
  sx: number; // screen x
  sy: number; // screen y
  depth: number; // for fog
}

const CX = RENDER_WIDTH / 2;
const CY = RENDER_HEIGHT / 2;

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;
    ctx.fillStyle = rgb(COLOR_BG);
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    this.flickerTime += 0.016;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    const pitchOffset = -player.pitch * (RENDER_HEIGHT * 0.5);
    const bobOffset = player.headBob * RENDER_HEIGHT;
    const frac = player.position - Math.floor(player.position);

    // Draw corridor segments from far to near
    for (let i = VIEW_STEPS; i >= 0; i--) {
      const stepNear = i;
      const stepFar = i + 1;
      const worldStepNear = Math.floor(player.position) + stepNear;

      // Corridor geometry: each step curves left by CURVE_PER_STEP
      // We compute positions relative to the player, in a local coordinate system
      // where player faces +Z, +X is right
      const nearPts = this.getStepCorners(stepNear - frac, player.angle);
      const farPts = this.getStepCorners(stepFar - frac, player.angle);

      // Height of near and far steps (spiral rises)
      const nearFloorY = (stepNear - frac) * STEP_RISE;
      const farFloorY = (stepFar - frac) * STEP_RISE;
      const ceilH = 3.5; // ceiling height above floor

      // Project all 4 corners at floor and ceiling level
      const nearLeftFloor = this.project(nearPts.innerX, nearFloorY, nearPts.z, pitchOffset + bobOffset);
      const nearRightFloor = this.project(nearPts.outerX, nearFloorY, nearPts.z, pitchOffset + bobOffset);
      const farLeftFloor = this.project(farPts.innerX, farFloorY, farPts.z, pitchOffset + bobOffset);
      const farRightFloor = this.project(farPts.outerX, farFloorY, farPts.z, pitchOffset + bobOffset);

      const nearLeftCeil = this.project(nearPts.innerX, nearFloorY + ceilH, nearPts.z, pitchOffset + bobOffset);
      const nearRightCeil = this.project(nearPts.outerX, nearFloorY + ceilH, nearPts.z, pitchOffset + bobOffset);
      const farLeftCeil = this.project(farPts.innerX, farFloorY + ceilH, farPts.z, pitchOffset + bobOffset);
      const farRightCeil = this.project(farPts.outerX, farFloorY + ceilH, farPts.z, pitchOffset + bobOffset);

      // Skip if behind camera
      if (nearPts.z <= 0.1 && farPts.z <= 0.1) continue;
      if (farPts.z <= 0.1) continue;

      const avgDepth = (nearPts.z + farPts.z) / 2;
      const fog = this.fogFactor(avgDepth);

      // Floor (quad between near and far, left and right floor edges)
      const floorColor = (worldStepNear % 2 === 0) ? COLOR_FLOOR : COLOR_FLOOR_ALT;
      this.fillQuad(ctx, nearLeftFloor, nearRightFloor, farRightFloor, farLeftFloor,
        this.fogged(floorColor, fog));

      // Ceiling
      this.fillQuad(ctx, nearLeftCeil, nearRightCeil, farRightCeil, farLeftCeil,
        this.fogged(COLOR_CEILING, fog));

      // Inner wall (void side) — left wall
      this.fillQuad(ctx, nearLeftFloor, farLeftFloor, farLeftCeil, nearLeftCeil,
        this.fogged(COLOR_WALL_INNER, fog * 1.1));

      // Railing line on inner wall top edge
      if (nearLeftCeil.depth > 0 && farLeftCeil.depth > 0) {
        ctx.strokeStyle = rgb(this.fogged(COLOR_RAILING, fog));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nearLeftCeil.sx, nearLeftCeil.sy);
        ctx.lineTo(farLeftCeil.sx, farLeftCeil.sy);
        ctx.stroke();
      }

      // Outer wall (bookshelf side) — right wall
      const wallColor = this.fogged(COLOR_WALL_OUTER, fog);
      this.fillQuad(ctx, nearRightFloor, farRightFloor, farRightCeil, nearRightCeil, wallColor);

      // Step edge line (the rise of each stair step)
      if (nearPts.z > 0.1) {
        ctx.strokeStyle = rgb(this.fogged(COLOR_FLOOR_ALT, fog * 0.7));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nearLeftFloor.sx, nearLeftFloor.sy);
        ctx.lineTo(nearRightFloor.sx, nearRightFloor.sy);
        ctx.stroke();
      }

      // Draw shelves and books on outer wall
      if (avgDepth < 10) {
        this.drawShelvesOnWall(
          ctx, world, worldStepNear,
          nearRightFloor, nearRightCeil, farRightFloor, farRightCeil,
          fog, avgDepth
        );
      }
    }

    // Crosshair
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(CX - 4, CY, 9, 1);
    ctx.fillRect(CX, CY - 4, 1, 9);
  }

  private getStepCorners(stepOffset: number, playerAngle: number) {
    // The spiral curves left. Each step ahead curves by CURVE_PER_STEP.
    const totalAngle = stepOffset * CURVE_PER_STEP + playerAngle;
    const dist = Math.max(0.01, stepOffset * 1.8); // depth along corridor

    // The corridor curves: offset X based on accumulated angle
    const curveX = Math.sin(totalAngle) * stepOffset * 0.4;

    const innerRadius = 1.0;
    const outerRadius = innerRadius + CORRIDOR_WIDTH;

    return {
      innerX: curveX - innerRadius,
      outerX: curveX + outerRadius,
      z: dist,
    };
  }

  private project(x: number, y: number, z: number, pitchOff: number): Projected {
    if (z <= 0.01) z = 0.01;
    const scale = (RENDER_WIDTH * 0.5) / (z * Math.tan(FOV / 2));
    return {
      sx: CX + x * scale,
      sy: CY - (y - EYE_HEIGHT) * scale + pitchOff,
      depth: z,
    };
  }

  private fogFactor(depth: number): number {
    const maxDist = VIEW_STEPS * 1.8;
    const fogStart = maxDist * FOG_START_FRAC;
    if (depth <= fogStart) return 0;
    return Math.min(1, (depth - fogStart) / (maxDist - fogStart));
  }

  private fogged(color: RGB, fog: number): RGB {
    const f = this.flicker * (1 - fog * 0.92);
    return [
      Math.max(0, Math.min(255, Math.round(color[0] * f))),
      Math.max(0, Math.min(255, Math.round(color[1] * f))),
      Math.max(0, Math.min(255, Math.round(color[2] * f))),
    ];
  }

  private fillQuad(
    ctx: CanvasRenderingContext2D,
    a: Projected, b: Projected, c: Projected, d: Projected,
    color: RGB
  ) {
    ctx.fillStyle = rgb(color);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.lineTo(c.sx, c.sy);
    ctx.lineTo(d.sx, d.sy);
    ctx.closePath();
    ctx.fill();
  }

  private drawShelvesOnWall(
    ctx: CanvasRenderingContext2D,
    world: WorldGenerator,
    worldStep: number,
    nearBottom: Projected, nearTop: Projected,
    farBottom: Projected, farTop: Projected,
    fog: number,
    depth: number
  ) {
    const stepData = world.getStep(worldStep);
    if (!stepData) return;

    const shelfCount = SHELVES_PER_WALL;

    for (let s = 0; s < shelfCount; s++) {
      const t0 = (s + 0.3) / (shelfCount + 0.5);
      const t1 = (s + 1) / (shelfCount + 0.5);

      // Interpolate shelf plank position on the wall quad
      const shelfNearY = nearBottom.sy + (nearTop.sy - nearBottom.sy) * t1;
      const shelfFarY = farBottom.sy + (farTop.sy - farBottom.sy) * t1;
      const bookTopNearY = nearBottom.sy + (nearTop.sy - nearBottom.sy) * t0;
      const bookTopFarY = farBottom.sy + (farTop.sy - farBottom.sy) * t0;

      // Shelf plank line
      ctx.strokeStyle = rgb(this.fogged(COLOR_SHELF, fog));
      ctx.lineWidth = Math.max(1, 2 / depth);
      ctx.beginPath();
      ctx.moveTo(nearBottom.sx, shelfNearY);
      ctx.lineTo(farBottom.sx, shelfFarY);
      ctx.stroke();

      // Books on this shelf
      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks || depth > 6) continue;

      const nearBookH = Math.abs(shelfNearY - bookTopNearY);
      const wallNearX = nearBottom.sx;
      const wallFarX = farBottom.sx;
      const wallWidth = Math.abs(wallFarX - wallNearX);
      const booksTotalWidth = wallWidth;

      let bx = Math.min(wallNearX, wallFarX);
      const bxEnd = bx + booksTotalWidth;

      for (let b = 0; b < shelfBooks.length; b++) {
        const book = shelfBooks[b];
        if (!book) continue;

        const bookWidth = Math.max(1, Math.round(book.width * 0.8 / depth));
        if (bx + bookWidth > bxEnd) break;

        // Interpolate Y for this book's X position
        const tx = wallWidth > 0 ? (bx - Math.min(wallNearX, wallFarX)) / wallWidth : 0;
        const bookTopY = bookTopNearY + (bookTopFarY - bookTopNearY) * tx;
        const bookBotY = shelfNearY + (shelfFarY - shelfNearY) * tx;
        const bookH = Math.max(1, Math.abs(bookBotY - bookTopY));

        const color = BOOK_SPINE_COLORS[book.colorIndex];
        if (!color) { bx += bookWidth; continue; }

        // Check crosshair
        const isHit = CX >= bx && CX < bx + bookWidth &&
                      CY >= Math.min(bookTopY, bookBotY) && CY < Math.min(bookTopY, bookBotY) + bookH;

        let drawColor: RGB;
        if (isHit) {
          drawColor = this.fogged([
            Math.min(255, color[0] + 70),
            Math.min(255, color[1] + 70),
            Math.min(255, color[2] + 70),
          ], fog);
          const floor = Math.floor(worldStep / STEPS_PER_FLOOR);
          const segment = ((worldStep % STEPS_PER_FLOOR) + STEPS_PER_FLOOR) % STEPS_PER_FLOOR;
          this.bookUnderCrosshair = { worldStep, floor, segment, shelf: s, slot: b };
        } else {
          drawColor = this.fogged(color, fog);
        }

        ctx.fillStyle = rgb(drawColor);
        ctx.fillRect(bx, Math.min(bookTopY, bookBotY), bookWidth, bookH);

        bx += bookWidth + (depth < 2 ? 1 : 0);
      }
    }
  }
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
