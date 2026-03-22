import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { BookAddress } from "@/generation/book-data";
import { generatePage } from "@/generation/babel-text";
import { seedFromAddress } from "@/math/hash";
import { PAGES_PER_BOOK } from "@/config";

export class BookViewer {
  container: Container;
  private background: Graphics;
  private leftPageText: Text;
  private rightPageText: Text;
  private headerText: Text;
  private pageNumText: Text;
  private currentPage = 0;
  private bookSeed = 0;
  private bookAddress: BookAddress | null = null;
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container = new Container();
    this.container.visible = false;

    // Background
    this.background = new Graphics();
    this.container.addChild(this.background);

    const pageStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 10,
      fill: 0x8b7d6b,
      wordWrap: false,
      lineHeight: 12,
    });

    const headerStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: 0xd4c5a9,
    });

    this.headerText = new Text({ text: "", style: headerStyle });
    this.container.addChild(this.headerText);

    this.leftPageText = new Text({ text: "", style: pageStyle });
    this.container.addChild(this.leftPageText);

    this.rightPageText = new Text({ text: "", style: pageStyle });
    this.container.addChild(this.rightPageText);

    this.pageNumText = new Text({ text: "", style: headerStyle });
    this.container.addChild(this.pageNumText);

    this.layout();
  }

  private layout() {
    const w = this.screenWidth;
    const h = this.screenHeight;
    const padding = 40;
    const pageWidth = (w - padding * 3) / 2;

    this.background.clear();
    this.background.rect(0, 0, w, h);
    this.background.fill({ color: 0x1c1710, alpha: 0.95 });

    // Divider line
    this.background.rect(w / 2 - 0.5, padding + 30, 1, h - padding * 2 - 60);
    this.background.fill({ color: 0x3a3020, alpha: 0.5 });

    this.headerText.position.set(padding, padding / 2);

    this.leftPageText.position.set(padding, padding + 30);
    this.rightPageText.position.set(w / 2 + padding / 2, padding + 30);

    this.pageNumText.position.set(w / 2, h - padding / 2);
    this.pageNumText.anchor.set(0.5, 1);
  }

  resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
    this.layout();
    if (this.container.visible) {
      this.renderPages();
    }
  }

  open(address: BookAddress) {
    this.bookAddress = address;
    this.bookSeed = seedFromAddress(
      address.hex.q,
      address.hex.r,
      address.hex.y,
      address.wall,
      address.shelf,
      address.slot
    );
    this.currentPage = 0;
    this.container.visible = true;

    this.headerText.text = `Hex (${address.hex.q}, ${address.hex.r}) Floor ${address.hex.y} — Wall ${address.wall}, Shelf ${address.shelf}, Book ${address.slot}`;

    this.renderPages();
  }

  close() {
    this.container.visible = false;
    this.bookAddress = null;
  }

  flipPage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage < 0 || newPage >= PAGES_PER_BOOK) return;
    this.currentPage = newPage;
    this.renderPages();
  }

  private renderPages() {
    const leftPage = this.currentPage;
    const rightPage = this.currentPage + 1;

    this.leftPageText.text = generatePage(this.bookSeed, leftPage);

    if (rightPage < PAGES_PER_BOOK) {
      this.rightPageText.text = generatePage(this.bookSeed, rightPage);
    } else {
      this.rightPageText.text = "";
    }

    this.pageNumText.text = `${leftPage + 1}-${Math.min(rightPage + 1, PAGES_PER_BOOK)} / ${PAGES_PER_BOOK}`;
  }

  get isOpen(): boolean {
    return this.container.visible;
  }
}
