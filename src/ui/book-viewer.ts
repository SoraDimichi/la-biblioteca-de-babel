import type { BookAddress } from "@/generation/book-data";
import { generatePage } from "@/generation/babel-text";
import { seedFromAddress } from "@/math/hash";
import { PAGES_PER_BOOK } from "@/config";

export class BookViewer {
  visible = false;
  private bookSeed = 0;
  private bookAddress: BookAddress | null = null;
  private currentPage = 0;
  private cachedLeft = "";
  private cachedRight = "";
  private cachedPageIdx = -1;

  open(address: BookAddress) {
    this.bookAddress = address;
    this.bookSeed = seedFromAddress(
      address.floor, address.segment, address.shelf, address.slot
    );
    this.currentPage = 0;
    this.cachedPageIdx = -1;
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

  private ensurePagesCached() {
    if (this.cachedPageIdx === this.currentPage) return;
    this.cachedLeft = generatePage(this.bookSeed, this.currentPage);
    const rightIdx = this.currentPage + 1;
    this.cachedRight = rightIdx < PAGES_PER_BOOK
      ? generatePage(this.bookSeed, rightIdx)
      : "";
    this.cachedPageIdx = this.currentPage;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.visible || !this.bookAddress) return;

    this.ensurePagesCached();

    const fontSize = Math.max(10, Math.floor(h / 50));
    const headerSize = Math.max(12, Math.floor(h / 35));
    const lineHeight = fontSize * 1.3;
    const margin = Math.floor(w * 0.03);

    ctx.fillStyle = "rgba(28, 23, 16, 0.97)";
    ctx.fillRect(0, 0, w, h);

    const addr = this.bookAddress;
    ctx.fillStyle = "#d4c5a9";
    ctx.font = `${headerSize}px monospace`;
    ctx.fillText(
      `Floor ${addr.floor} Seg ${addr.segment} — Shelf ${addr.shelf}, Book ${addr.slot}`,
      margin, margin + headerSize
    );

    ctx.fillStyle = "#8b7d6b";
    ctx.font = `${fontSize}px monospace`;

    const startY = margin + headerSize + margin;
    const maxLines = Math.floor((h - startY - margin * 2) / lineHeight);
    const charsPerLine = Math.floor((w / 2 - margin * 2) / (fontSize * 0.6));

    const leftLines = this.cachedLeft.split("\n");
    for (let i = 0; i < Math.min(leftLines.length, maxLines); i++) {
      const line = leftLines[i];
      if (!line) continue;
      ctx.fillText(line.substring(0, charsPerLine), margin, startY + i * lineHeight);
    }

    if (this.cachedRight) {
      const rightLines = this.cachedRight.split("\n");
      for (let i = 0; i < Math.min(rightLines.length, maxLines); i++) {
        const line = rightLines[i];
        if (!line) continue;
        ctx.fillText(line.substring(0, charsPerLine), w / 2 + margin, startY + i * lineHeight);
      }
    }

    ctx.fillStyle = "#3a3020";
    ctx.fillRect(w / 2, startY - margin, 1, h - startY);

    ctx.fillStyle = "#d4c5a9";
    ctx.font = `${Math.floor(fontSize * 1.1)}px monospace`;

    ctx.font = `${fontSize}px monospace`;
    const helpText = "← →  flip pages  ·  Esc  close";
    const helpW = ctx.measureText(helpText).width;
    ctx.fillText(helpText, (w - helpW) / 2, h - margin - lineHeight);
  }
}
