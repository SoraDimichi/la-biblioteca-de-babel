# La Biblioteca de Babel

A first-person exploration game inside Jorge Luis Borges' [Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel) — an infinite hexagonal tower where every possible book exists.

**[Play it here](https://soradimichi.github.io/la-biblioteca-de-babel/)**

## Concept

> *The universe (which others call the Library) is composed of an indefinite, perhaps infinite, number of hexagonal galleries.*
> — Jorge Luis Borges, 1941

You stand inside a hexagonal tower that extends infinitely upward and downward. Every wall is lined with bookshelves. Every book contains a unique, deterministic sequence of 25 symbols — the same book at the same location always has the same text. The library is total: somewhere in its infinite shelves, every possible arrangement of characters exists.

Walk the spiral. Pick a book. Read gibberish — or perhaps find meaning.

## Controls

| Key | Action |
|-----|--------|
| **WASD** | Move / strafe |
| **Mouse** | Look around |
| **Click** | Select a book |
| **A / D** | Flip pages (while reading) |
| **Escape** | Close book |
| **F3** | Performance monitor |

## Technical

- 2.5D raycaster with ray-segment intersection against hexagonal walls
- Infinite vertical floors rendered per ray column
- Deterministic procedural generation via seeded xoshiro128** PRNG
- Babel text: 25 symbols (22 letters + space + comma + period), 410 pages per book
- Pure Canvas2D, zero dependencies, ~13KB bundle
- Adaptive resolution with half-res rendering for performance

## Development

```bash
npm install
npm run dev        # dev server
npm run build      # production build
npm test           # unit tests
```

## Architecture

```
src/
  main.ts                  — Entry, game loop, canvas scaling
  game.ts                  — Game coordinator
  config.ts                — Constants
  rendering/renderer.ts    — Raycaster: hex walls, multi-floor, bookshelves
  systems/input.ts         — Pointer lock, keyboard
  systems/player.ts        — FPS movement, spiral floor tracking
  generation/
    world-generator.ts     — Procedural book data per wall/floor
    babel-text.ts          — Deterministic page text generation
    book-data.ts           — Book addressing
  math/hash.ts             — Seeded RNG (xoshiro128**)
  ui/book-viewer.ts        — HTML overlay book reader
  ui/hud.ts                — Floor/position display
  debug/perf-monitor.ts    — FPS counter
```

## License

ISC
