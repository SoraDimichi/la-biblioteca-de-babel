import {
  RENDER_WIDTH, RENDER_HEIGHT, COLOR_BG,
  FOV, EYE_HEIGHT, CORRIDOR_WIDTH, CURVE_PER_STEP, STEP_RISE,
  VIEW_STEPS, FOG_START_FRAC,
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
  sx: number;
  sy: number;
  depth: number;
  behind: boolean;
}

const CX = RENDER_WIDTH / 2;
const CY = RENDER_HEIGHT / 2;
const FOCAL = (RENDER_WIDTH * 0.5) / Math.tan(FOV / 2);

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

    const frac = player.position - Math.floor(player.position);
    const cosYaw = Math.cos(-player.angle);
    const sinYaw = Math.sin(-player.angle);
    const cosPitch = Math.cos(-player.pitch);
    const sinPitch = Math.sin(-player.pitch);

    // Draw corridor segments from far to near (painter's algorithm)
    for (let i = VIEW_STEPS; i >= 0; i--) {
      const worldStepNear = Math.floor(player.position) + i;

      // Get corridor corners in world space (relative to player position)
      const nearCorners = this.corridorCornersWorld(i - frac);
      const farCorners = this.corridorCornersWorld(i + 1 - frac);

      const nearFloorH = (i - frac) * STEP_RISE;
      const farFloorH = (i + 1 - frac) * STEP_RISE;
      const ceilH = 3.5;

      // Transform to view space (rotate by camera yaw & pitch) then project
      const nlf = this.viewProject(nearCorners.ix, nearFloorH, nearCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const nrf = this.viewProject(nearCorners.ox, nearFloorH, nearCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const flf = this.viewProject(farCorners.ix, farFloorH, farCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const frf = this.viewProject(farCorners.ox, farFloorH, farCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);

      const nlc = this.viewProject(nearCorners.ix, nearFloorH + ceilH, nearCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const nrc = this.viewProject(nearCorners.ox, nearFloorH + ceilH, nearCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const flc = this.viewProject(farCorners.ix, farFloorH + ceilH, farCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);
      const frc = this.viewProject(farCorners.ox, farFloorH + ceilH, farCorners.z, cosYaw, sinYaw, cosPitch, sinPitch, player.headBob);

      // Skip if entirely behind camera
      if (nlf.behind && nrf.behind && flf.behind && frf.behind) continue;
      if (flf.behind && frf.behind) continue;

      const avgDepth = Math.max(0.1, (nlf.depth + flf.depth) / 2);
      const fog = this.fogFactor(avgDepth);

      // Floor
      const floorColor = (worldStepNear % 2 === 0) ? COLOR_FLOOR : COLOR_FLOOR_ALT;
      this.fillQuad(ctx, nlf, nrf, frf, flf, this.fogged(floorColor, fog));

      // Ceiling
      this.fillQuad(ctx, nlc, nrc, frc, flc, this.fogged(COLOR_CEILING, fog));

      // Inner wall (void side)
      this.fillQuad(ctx, nlf, flf, flc, nlc, this.fogged(COLOR_WALL_INNER, fog * 1.1));

      // Railing on inner wall
      if (!nlc.behind && !flc.behind) {
        ctx.strokeStyle = rgb(this.fogged(COLOR_RAILING, fog));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nlc.sx, nlc.sy);
        ctx.lineTo(flc.sx, flc.sy);
        ctx.stroke();
      }

      // Outer wall (bookshelves)
      const wallColor = this.fogged(COLOR_WALL_OUTER, fog);
      this.fillQuad(ctx, nrf, frf, frc, nrc, wallColor);

      // Step edge
      if (!nlf.behind && !nrf.behind) {
        ctx.strokeStyle = rgb(this.fogged(COLOR_FLOOR_ALT, fog * 0.7));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nlf.sx, nlf.sy);
        ctx.lineTo(nrf.sx, nrf.sy);
        ctx.stroke();
      }

      // Shelves and books on outer wall
      if (avgDepth < 10 && !nrf.behind && !frf.behind) {
        this.drawShelvesOnWall(ctx, world, worldStepNear, nrf, nrc, frf, frc, fog, avgDepth);
      }
    }

    // Crosshair
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(CX - 4, CY, 9, 1);
    ctx.fillRect(CX, CY - 4, 1, 9);

    // Book info near crosshair
    this.drawBookTooltip(ctx);
  }

  /** Compute corridor inner/outer X and Z in world space for a given step offset */
  private corridorCornersWorld(stepOffset: number) {
    // The spiral curves: each step is rotated by CURVE_PER_STEP around the center shaft.
    // In world coords relative to the player, step 0 is at the player's feet,
    // step N is N steps ahead along the curving corridor.
    const angle = stepOffset * CURVE_PER_STEP;
    const forwardDist = stepOffset * 1.8;

    // Curve offset: the corridor bends left
    const curveX = -Math.sin(angle) * stepOffset * 0.5;

    const innerR = 1.0;
    const outerR = innerR + CORRIDOR_WIDTH;

    return {
      ix: curveX - innerR, // inner wall X
      ox: curveX + outerR, // outer wall X
      z: Math.max(0.01, forwardDist + Math.cos(angle) * stepOffset * 0.1),
    };
  }

  /** Transform a world-space point by camera yaw+pitch, then perspective project */
  private viewProject(
    wx: number, wy: number, wz: number,
    cosYaw: number, sinYaw: number,
    cosPitch: number, sinPitch: number,
    headBob: number
  ): Projected {
    // Yaw rotation (around Y axis): rotates X and Z
    const rx = wx * cosYaw - wz * sinYaw;
    const rz = wx * sinYaw + wz * cosYaw;

    // Offset Y by eye height and head bob
    const ry = wy - EYE_HEIGHT - headBob;

    // Pitch rotation (around X axis): rotates Y and Z
    const py = ry * cosPitch - rz * sinPitch;
    const pz = ry * sinPitch + rz * cosPitch;

    if (pz <= 0.01) {
      return { sx: CX, sy: CY, depth: 0.01, behind: true };
    }

    return {
      sx: CX + (rx / pz) * FOCAL,
      sy: CY - (py / pz) * FOCAL,
      depth: pz,
      behind: false,
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
    nearBot: Projected, nearTop: Projected,
    farBot: Projected, farTop: Projected,
    fog: number, depth: number
  ) {
    const stepData = world.getStep(worldStep);
    if (!stepData) return;

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const t0 = (s + 0.3) / (SHELVES_PER_WALL + 0.5);
      const t1 = (s + 1) / (SHELVES_PER_WALL + 0.5);

      const shelfNearY = nearBot.sy + (nearTop.sy - nearBot.sy) * t1;
      const shelfFarY = farBot.sy + (farTop.sy - farBot.sy) * t1;
      const bookTopNearY = nearBot.sy + (nearTop.sy - nearBot.sy) * t0;
      const bookTopFarY = farBot.sy + (farTop.sy - farBot.sy) * t0;

      // Shelf plank
      ctx.strokeStyle = rgb(this.fogged(COLOR_SHELF, fog));
      ctx.lineWidth = Math.max(1, 2 / depth);
      ctx.beginPath();
      ctx.moveTo(nearBot.sx, shelfNearY);
      ctx.lineTo(farBot.sx, shelfFarY);
      ctx.stroke();

      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks || depth > 6) continue;

      const leftX = Math.min(nearBot.sx, farBot.sx);
      const wallWidth = Math.abs(farBot.sx - nearBot.sx);
      let bx = leftX;
      const bxEnd = leftX + wallWidth;

      for (let b = 0; b < shelfBooks.length; b++) {
        const book = shelfBooks[b];
        if (!book) continue;

        const bookWidth = Math.max(1, Math.round(book.width * 0.8 / depth));
        if (bx + bookWidth > bxEnd) break;

        const tx = wallWidth > 0 ? (bx - leftX) / wallWidth : 0;
        const bookTopY = bookTopNearY + (bookTopFarY - bookTopNearY) * tx;
        const bookBotY = shelfNearY + (shelfFarY - shelfNearY) * tx;
        const topY = Math.min(bookTopY, bookBotY);
        const bookH = Math.max(1, Math.abs(bookBotY - bookTopY));

        const color = BOOK_SPINE_COLORS[book.colorIndex];
        if (!color) { bx += bookWidth; continue; }

        const isHit = CX >= bx && CX < bx + bookWidth && CY >= topY && CY < topY + bookH;

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
        ctx.fillRect(bx, topY, bookWidth, bookH);
        bx += bookWidth + (depth < 2 ? 1 : 0);
      }
    }
  }

  private drawBookTooltip(ctx: CanvasRenderingContext2D) {
    const hit = this.bookUnderCrosshair;
    if (!hit) return;
    ctx.fillStyle = "rgba(212,197,169,0.8)";
    ctx.font = "6px monospace";
    ctx.fillText(`Floor ${hit.floor} · Shelf ${hit.shelf} · Book ${hit.slot}`, CX - 40, CY + 14);
  }
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
