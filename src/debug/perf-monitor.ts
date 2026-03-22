import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Application } from "pixi.js";

export class PerfMonitor {
  container: Container;
  private fpsText: Text;
  private infoText: Text;
  private background: Graphics;
  private visible = false;
  private fpsHistory: number[] = [];

  constructor(private app: Application) {
    this.container = new Container();
    this.container.visible = false;

    this.background = new Graphics();
    this.container.addChild(this.background);

    const style = new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: 0x00ff00,
      lineHeight: 14,
    });

    this.fpsText = new Text({ text: "FPS: --", style });
    this.fpsText.position.set(8, 8);
    this.container.addChild(this.fpsText);

    this.infoText = new Text({ text: "", style });
    this.infoText.position.set(8, 24);
    this.container.addChild(this.infoText);

    // Toggle with F3
    window.addEventListener("keydown", (e) => {
      if (e.code === "F3") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    this.container.visible = this.visible;
  }

  update(chunkCount: number) {
    if (!this.visible) return;

    const fps = this.app.ticker.FPS;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();

    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    this.fpsText.text = `FPS: ${Math.round(fps)} (avg: ${Math.round(avgFps)})`;
    this.infoText.text = `Chunks: ${chunkCount}\nChildren: ${this.app.stage.children.length}`;

    // Background
    const w = 180;
    const h = 70;
    this.background.clear();
    this.background.rect(0, 0, w, h);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
  }
}
