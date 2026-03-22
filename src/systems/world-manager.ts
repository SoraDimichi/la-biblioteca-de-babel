import { Container } from "pixi.js";
import { hexKey, hexDistance, pixelToHex, type HexCoord } from "@/math/hex";
import { HexChunk, LODLevel } from "@/generation/hex-chunk";
import { generateChunk } from "@/generation/chunk-generator";
import type { CameraSystem } from "@/systems/camera";
import {
  CHUNK_LOAD_RADIUS,
  UNLOAD_RADIUS,
  LOD_NEAR,
  LOD_MID,
  LOD_FAR,
  MAX_CHUNKS_PER_FRAME,
} from "@/config";

export class WorldManager {
  private chunks = new Map<string, HexChunk>();
  private worldContainer: Container;
  private generationQueue: { q: number; r: number; y: number; dist: number }[] = [];

  constructor(worldContainer: Container) {
    this.worldContainer = worldContainer;
  }

  update(camera: CameraSystem) {
    const floor = camera.currentFloor;
    const visibleHexes = camera.getVisibleHexes(CHUNK_LOAD_RADIUS);
    const cameraHex = pixelToHex(camera.x, camera.y);

    // Reset queue each frame
    this.generationQueue.length = 0;

    // Queue chunks that need loading
    for (const hex of visibleHexes) {
      const key = hexKey(hex, floor);
      if (!this.chunks.has(key)) {
        const dist = hexDistance(cameraHex, hex);
        this.generationQueue.push({ q: hex.q, r: hex.r, y: floor, dist });
      }
    }

    // Sort queue by distance (closest first)
    this.generationQueue.sort((a, b) => a.dist - b.dist);

    // Generate up to MAX_CHUNKS_PER_FRAME
    let generated = 0;
    while (this.generationQueue.length > 0 && generated < MAX_CHUNKS_PER_FRAME) {
      const item = this.generationQueue.shift()!;
      const key = hexKey({ q: item.q, r: item.r }, item.y);
      if (this.chunks.has(key)) continue;

      const lod = this.getLODForDistance(item.dist);
      const chunk = generateChunk({ q: item.q, r: item.r, y: item.y }, lod);
      this.chunks.set(key, chunk);
      this.worldContainer.addChild(chunk.container);
      generated++;
    }

    // Update LOD and unload distant chunks
    for (const [key, chunk] of this.chunks) {
      const dist = hexDistance(cameraHex, { q: chunk.address.q, r: chunk.address.r });

      if (dist > UNLOAD_RADIUS || chunk.address.y !== floor) {
        chunk.dispose();
        this.chunks.delete(key);
        continue;
      }

      // Update visibility (culling)
      chunk.container.visible = dist <= CHUNK_LOAD_RADIUS;
    }
  }

  private getLODForDistance(dist: number): LODLevel {
    if (dist <= LOD_NEAR) return LODLevel.NEAR;
    if (dist <= LOD_MID) return LODLevel.MID;
    return LODLevel.FAR;
  }

  get chunkCount(): number {
    return this.chunks.size;
  }
}
