import type { BookAddress } from "@/generation/book-data";

export enum UIState {
  EXPLORING = "EXPLORING",
  READING = "READING",
}

export class UIManager {
  state = UIState.EXPLORING;
  private onOpenBook: ((address: BookAddress) => void) | null = null;
  private onCloseBook: (() => void) | null = null;

  setOpenBookHandler(handler: (address: BookAddress) => void) {
    this.onOpenBook = handler;
  }

  setCloseBookHandler(handler: () => void) {
    this.onCloseBook = handler;
  }

  openBook(address: BookAddress) {
    this.state = UIState.READING;
    this.onOpenBook?.(address);
  }

  closeBook() {
    this.state = UIState.EXPLORING;
    this.onCloseBook?.();
  }

  get isReading(): boolean {
    return this.state === UIState.READING;
  }
}
