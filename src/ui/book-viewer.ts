import type { BookAddress } from "@/generation/book-data";
import { generatePage } from "@/generation/babel-text";
import { seedFromAddress } from "@/math/hash";
import { RENDER_WIDTH, RENDER_HEIGHT, PAGES_PER_BOOK } from "@/config";

export class BookViewer {
  visible = false;
  private bookSeed = 0;
  private bookAddress: BookAddress | null = null;
  private currentPage = 0;

  open(address: BookAddress) {
    this.bookAddress = address;
    this.bookSeed = seedFromAddress(
      address.floor, address.segment, address.shelf, address.slot
    );
    this.currentPage = 0;
    this.visible = true;
  }

  close() {
    this.visible = false;
    this.bookAddress = null;
  }

  flipPage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage < 0 || newPage >= PAGES_PER_BOOK) return;
    this.currentPage = newPage;
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.visible || !this.bookAddress) return;

    ctx.fillStyle = "rgba(28, 23, 16, 0.97)";
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    const addr = this.bookAddress;
    ctx.fillStyle = "#d4c5a9";
    ctx.font = "14px monospace";
    ctx.fillText(
      `Floor ${addr.floor} Seg ${addr.segment} — Shelf ${addr.shelf}, Book ${addr.slot}`,
      20, 24
    );

    ctx.fillStyle = "#8b7d6b";
    ctx.font = "10px monospace";

    const leftPage = generatePage(this.bookSeed, this.currentPage);
    const leftLines = leftPage.split("\n");
    const lineHeight = 9;
    const startY = 44;
    const maxLines = Math.min(leftLines.length, Math.floor((RENDER_HEIGHT - 60) / lineHeight));

    for (let i = 0; i < maxLines; i++) {
      const line = leftLines[i];
      if (!line) continue;
      ctx.fillText(line.substring(0, 50), 20, startY + i * lineHeight);
    }

    // Right page
    const rightPageIdx = this.currentPage + 1;
    if (rightPageIdx < PAGES_PER_BOOK) {
      const rightPage = generatePage(this.bookSeed, rightPageIdx);
      const rightLines = rightPage.split("\n");
      for (let i = 0; i < maxLines; i++) {
        const line = rightLines[i];
        if (!line) continue;
        ctx.fillText(line.substring(0, 50), RENDER_WIDTH / 2 + 10, startY + i * lineHeight);
      }
    }

    ctx.fillStyle = "#3a3020";
    ctx.fillRect(RENDER_WIDTH / 2, 34, 1, RENDER_HEIGHT - 50);

    ctx.fillStyle = "#d4c5a9";
    ctx.font = "12px monospace";
    ctx.fillText(
      `${this.currentPage + 1}-${Math.min(this.currentPage + 2, PAGES_PER_BOOK)} / ${PAGES_PER_BOOK}`,
      RENDER_WIDTH / 2 - 40, RENDER_HEIGHT - 10
    );

    ctx.font = "10px monospace";
    ctx.fillText("← →  flip pages  ·  Esc  close", RENDER_WIDTH / 2 - 100, RENDER_HEIGHT - 26);
  }
}
