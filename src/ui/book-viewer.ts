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
      address.floor,
      address.segment,
      address.shelf,
      address.slot
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

    // Dark overlay
    ctx.fillStyle = "rgba(28, 23, 16, 0.95)";
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    // Header
    const addr = this.bookAddress;
    ctx.fillStyle = "#d4c5a9";
    ctx.font = "6px monospace";
    ctx.fillText(
      `Floor ${addr.floor} Seg ${addr.segment} — Shelf ${addr.shelf}, Book ${addr.slot}`,
      8, 10
    );

    // Page content
    ctx.fillStyle = "#8b7d6b";
    ctx.font = "4px monospace";

    const leftPage = generatePage(this.bookSeed, this.currentPage);
    const leftLines = leftPage.split("\n");

    const lineHeight = 4.5;
    const startY = 18;
    const maxLines = Math.min(leftLines.length, 38);

    for (let i = 0; i < maxLines; i++) {
      const line = leftLines[i];
      if (!line) continue;
      // Truncate to fit screen width
      const displayLine = line.substring(0, 40);
      ctx.fillText(displayLine, 8, startY + i * lineHeight);
    }

    // Right page
    const rightPageIdx = this.currentPage + 1;
    if (rightPageIdx < PAGES_PER_BOOK) {
      const rightPage = generatePage(this.bookSeed, rightPageIdx);
      const rightLines = rightPage.split("\n");

      for (let i = 0; i < maxLines; i++) {
        const line = rightLines[i];
        if (!line) continue;
        const displayLine = line.substring(0, 40);
        ctx.fillText(displayLine, RENDER_WIDTH / 2 + 4, startY + i * lineHeight);
      }
    }

    // Divider
    ctx.fillStyle = "#3a3020";
    ctx.fillRect(RENDER_WIDTH / 2, 14, 1, RENDER_HEIGHT - 20);

    // Page numbers
    ctx.fillStyle = "#d4c5a9";
    ctx.font = "5px monospace";
    ctx.fillText(
      `${this.currentPage + 1}-${Math.min(this.currentPage + 2, PAGES_PER_BOOK)} / ${PAGES_PER_BOOK}`,
      RENDER_WIDTH / 2 - 20, RENDER_HEIGHT - 4
    );
  }
}
