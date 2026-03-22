import { hash, SeededRandom } from "@/math/hash";
import { BABEL_ALPHABET, LINES_PER_PAGE, CHARS_PER_LINE } from "@/config";

export function generatePage(bookSeed: number, pageIndex: number): string {
  const pageSeed = hash(bookSeed, pageIndex);
  const rng = new SeededRandom(pageSeed);

  const lines: string[] = [];
  for (let line = 0; line < LINES_PER_PAGE; line++) {
    let lineStr = "";
    for (let ch = 0; ch < CHARS_PER_LINE; ch++) {
      const charIndex = rng.nextInt(0, BABEL_ALPHABET.length - 1);
      lineStr += BABEL_ALPHABET[charIndex];
    }
    lines.push(lineStr);
  }

  return lines.join("\n");
}

export function getBookTitle(bookSeed: number): string {
  const firstPage = generatePage(bookSeed, 0);
  return firstPage.substring(0, 20).trim();
}
