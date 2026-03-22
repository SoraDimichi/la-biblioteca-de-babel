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
  private leftPageNum: HTMLDivElement;
  private rightPageNum: HTMLDivElement;

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
      gap: "0",
      height: "calc(100% - 10vh)",
      overflow: "hidden",
    });

    const pageFont = "clamp(8px, 1.3vh, 14px)";
    const numFont = "clamp(9px, 1.2vh, 14px)";

    // Left page column
    const leftCol = document.createElement("div");
    Object.assign(leftCol.style, {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #3a3020",
      paddingRight: "1vw",
      marginRight: "1vw",
    });

    this.leftPage = document.createElement("pre");
    Object.assign(this.leftPage.style, {
      flex: "1",
      margin: "0",
      fontSize: pageFont,
      lineHeight: "1.4",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
    });

    this.leftPageNum = document.createElement("div");
    Object.assign(this.leftPageNum.style, {
      color: "#d4c5a9",
      fontSize: numFont,
      paddingTop: "0.8vh",
      textAlign: "left",
    });

    leftCol.appendChild(this.leftPage);
    leftCol.appendChild(this.leftPageNum);

    // Right page column
    const rightCol = document.createElement("div");
    Object.assign(rightCol.style, {
      flex: "1",
      display: "flex",
      flexDirection: "column",
    });

    this.rightPage = document.createElement("pre");
    Object.assign(this.rightPage.style, {
      flex: "1",
      margin: "0",
      fontSize: pageFont,
      lineHeight: "1.4",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
    });

    this.rightPageNum = document.createElement("div");
    Object.assign(this.rightPageNum.style, {
      color: "#d4c5a9",
      fontSize: numFont,
      paddingTop: "0.8vh",
      textAlign: "right",
    });

    rightCol.appendChild(this.rightPage);
    rightCol.appendChild(this.rightPageNum);

    pagesContainer.appendChild(leftCol);
    pagesContainer.appendChild(rightCol);
    this.overlay.appendChild(pagesContainer);

    // Controls hint at very bottom
    const hint = document.createElement("div");
    Object.assign(hint.style, {
      position: "absolute",
      bottom: "1.5vh",
      left: "0",
      right: "0",
      textAlign: "center",
      color: "#d4c5a9",
      fontSize: "clamp(9px, 1.2vh, 14px)",
      opacity: "0.4",
    });
    hint.textContent = "A / D  flip pages  ·  Esc  close";
    this.overlay.appendChild(hint);

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
    this.leftPageNum.textContent = String(this.currentPage + 1);

    const rightIdx = this.currentPage + 1;
    if (rightIdx < PAGES_PER_BOOK) {
      this.rightPage.textContent = generatePage(this.bookSeed, rightIdx);
      this.rightPageNum.textContent = String(rightIdx + 1);
    } else {
      this.rightPage.textContent = "";
      this.rightPageNum.textContent = "";
    }
  }

  render(_ctx: CanvasRenderingContext2D, _w: number, _h: number) {}
}
