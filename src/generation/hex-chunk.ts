import { Container } from "pixi.js";
import type { HexAddress } from "@/math/hex";

export enum LODLevel {
  NEAR = 0,
  MID = 1,
  FAR = 2,
}

export class HexChunk {
  container: Container;
  lod: LODLevel;

  constructor(
    public address: HexAddress,
    lod: LODLevel
  ) {
    this.container = new Container();
    this.lod = lod;
  }

  dispose() {
    this.container.removeFromParent();
    this.container.destroy({ children: true });
  }
}
