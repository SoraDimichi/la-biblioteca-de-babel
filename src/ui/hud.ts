import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { CameraSystem } from "@/systems/camera";
import { pixelToHex } from "@/math/hex";

export class HUD {
  container: Container;
  private positionText: Text;
  private controlsText: Text;
  private controlsTimer = 0;
  private hasInteracted = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    const bgStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: 0xd4c5a9,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 0,
        alpha: 0.8,
      },
    });

    const controlStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: 0xd4c5a9,
      align: "center",
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 0,
        alpha: 0.8,
      },
    });

    // Position display (top-left)
    this.positionText = new Text({ text: "Hex (0, 0) · Floor 0", style: bgStyle });
    this.positionText.position.set(12, 12);
    this.container.addChild(this.positionText);

    // Controls hint (bottom-center)
    this.controlsText = new Text({
      text: "WASD Move · Scroll Zoom · Q/E Floor · Click Book",
      style: controlStyle,
    });
    this.controlsText.anchor.set(0.5, 1);
    this.controlsText.position.set(screenWidth / 2, screenHeight - 12);
    this.container.addChild(this.controlsText);
  }

  resize(width: number, _height: number) {
    this.controlsText.position.set(width / 2, _height - 12);
  }

  update(camera: CameraSystem, dt: number) {
    const hex = pixelToHex(camera.x, camera.y);
    this.positionText.text = `Hex (${hex.q}, ${hex.r}) · Floor ${camera.currentFloor}`;

    // Fade out controls after interaction
    this.controlsTimer += dt / 60;
    if (this.controlsTimer > 10 && !this.hasInteracted) {
      this.hasInteracted = true;
    }

    if (this.hasInteracted) {
      this.controlsText.alpha = Math.max(0, this.controlsText.alpha - 0.01);
    }
  }
}
