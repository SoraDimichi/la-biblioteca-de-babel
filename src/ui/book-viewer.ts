import type { BookAddress } from "@/generation/book-data";
import { generatePage } from "@/generation/babel-text";
import { seedFromAddress } from "@/math/hash";
import { PAGES_PER_BOOK } from "@/config";

export class BookViewer {
  visible = false;
  private bookSeed = 0;
  private bookAddress: BookAddress | null = null;
  private currentPage = 0;
  private overlay: HTMLDivElement;
  private leftPage: HTMLPreElement;
  private rightPage: HTMLPreElement;
  private header: HTMLDivElement;
  private hint: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(28, 23, 16, 0.97)",
      display: "none",
      fontFamily: "Georgia, 'Times New Roman', Times, 'Noto Serif', serif",
      color: "#8b7d6b",
      zIndex: "10",
      padding: "3vh 3vw",
      boxSizing: "border-box",
      overflow: "hidden",
    });

    this.header = document.createElement("div");
    Object.assign(this.header.style, {
      color: "#d4c5a9",
      fontSize: "clamp(12px, 1.8vh, 20px)",
      marginBottom: "1.5vh",
    });
    this.overlay.appendChild(this.header);

    const pagesContainer = document.createElement("div");
    Object.assign(pagesContainer.style, {
      display: "flex",
      gap: "2vw",
      height: "calc(100% - 8vh)",
      overflow: "hidden",
    });

    this.leftPage = document.createElement("pre");
    this.rightPage = document.createElement("pre");

    const pageStyle = {
      flex: "1",
      margin: "0",
      fontSize: "clamp(8px, 1.3vh, 14px)",
      lineHeight: "1.4",
      overflow: "hidden",
      whiteSpace: "pre-wrap" as const,
      wordBreak: "break-all" as const,
      borderRight: "",
    };

    Object.assign(this.leftPage.style, {
      ...pageStyle,
      borderRight: "1px solid #3a3020",
      paddingRight: "1vw",
    });
    Object.assign(this.rightPage.style, {
      ...pageStyle,
      paddingLeft: "1vw",
    });

    pagesContainer.appendChild(this.leftPage);
    pagesContainer.appendChild(this.rightPage);
    this.overlay.appendChild(pagesContainer);

    this.hint = document.createElement("div");
    Object.assign(this.hint.style, {
      position: "absolute",
      bottom: "1.5vh",
      left: "0",
      right: "0",
      textAlign: "center",
      color: "#d4c5a9",
      fontSize: "clamp(10px, 1.4vh, 16px)",
    });
    this.hint.textContent = "A / D  flip pages  ·  Esc  close";
    this.overlay.appendChild(this.hint);

    document.body.appendChild(this.overlay);
  }

  open(address: BookAddress) {
    this.bookAddress = address;
    this.bookSeed = seedFromAddress(
      address.floor, address.segment, address.shelf, address.slot
    );
    this.currentPage = 0;
    this.visible = true;
    this.overlay.style.display = "block";
    this.header.textContent = `Floor ${address.floor} · Wall ${address.segment} · Shelf ${address.shelf} · Book ${address.slot}`;
    this.renderPages();
  }

  close() {
    this.visible = false;
    this.bookAddress = null;
    this.overlay.style.display = "none";
  }

  flipPage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage < 0 || newPage >= PAGES_PER_BOOK) return;
    this.currentPage = newPage;
    this.renderPages();
  }

  private renderPages() {
    this.leftPage.textContent = generatePage(this.bookSeed, this.currentPage);
    const rightIdx = this.currentPage + 1;
    this.rightPage.textContent = rightIdx < PAGES_PER_BOOK
      ? generatePage(this.bookSeed, rightIdx)
      : "";
  }

  // No-op: rendering is done via DOM, not canvas
  render(_ctx: CanvasRenderingContext2D, _w: number, _h: number) {}
}
