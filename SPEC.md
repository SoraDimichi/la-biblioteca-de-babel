# La Biblioteca de Babel — Game Design Specification

## Vision

A 2.5D exploration game that brings Jorge Luis Borges' "The Library of Babel" to life. The player drifts through an infinite hexagonal library — an impossible architecture of interlocking rooms, each lined with shelves of books containing every possible combination of characters. The atmosphere is dark, warm, and reverent — like wandering through an ancient monastery at night.

The library is not random. It is *total*. Every possible book exists somewhere. The same room at the same coordinates always contains the same books. The player is a searcher — floating through this impossible space, pulling books from shelves, finding mostly gibberish but always wondering if meaning hides in the next volume.

---

## Source Material (Borges, 1941)

Key details from the original story that inform the design:

> "The universe (which others call the Library) is composed of an indefinite and perhaps infinite number of hexagonal galleries, with vast air shafts between, surrounded by very low railings."

> "From any of the hexagons one can see, interminably, the upper and lower floors."

> "There are five shelves for each of the hexagon's walls; each shelf contains thirty-five books of uniform format; each book is of four hundred and ten pages; each page, of forty lines, each line of some eighty letters."

> "The orthographical symbols are twenty-five in number." (22 letters, period, comma, space)

> "Two facts are known: the Library is total [...] its shelves register all possible combinations of the twenty-odd orthographical symbols."

**Our adaptation:**
- 6 walls per hexagonal room (Borges says hexagonal galleries)
- 5 shelves per wall (as specified)
- 35 books per shelf (as specified)
- 410 pages per book, 40 lines per page, 80 characters per line
- 25 symbols: 22 lowercase letters (a-v), space, comma, period
- **1,050 books per room** (6 × 5 × 35)
- Vertical shafts connecting floors, visible from railings

---

## Technical Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Renderer | PixiJS v8 | WebGL-accelerated 2D, excellent sprite batching, mature ecosystem |
| Language | TypeScript (strict) | Type safety, IDE support |
| Bundler | Vite | Fast HMR, zero-config TS support |
| Unit tests | Vitest | Same config as Vite, fast |
| E2E tests | Playwright (Docker) | Headless browser verification in WSL2 |
| Package manager | npm | Standard |

---

## Architecture

### System-Based Game Loop

```
Game (coordinator)
  │
  ├── InputSystem          — keyboard/mouse state each frame
  ├── CameraSystem         — position, zoom, smooth movement, visible bounds
  ├── WorldManager         — chunk loading/unloading, procedural generation
  │     ├── ChunkGenerator — creates hex room data + visuals at given LOD
  │     ├── LODManager     — assigns LOD level per chunk based on camera distance
  │     └── CullingSystem  — toggles visibility of off-screen chunks
  ├── BookPicker           — mouse→hex→book hit detection, hover/select
  ├── AnimationSystem      — data-driven tweens (lerp + easing)
  ├── AtmosphereSystem     — lighting, fog, vignette
  └── UIManager            — state machine (EXPLORING ↔ READING)
        ├── HUD            — coordinates, floor, controls hint
        └── BookViewer     — full-screen book reader with page flip
```

Update order each frame: Input → Camera → World → BookPicker → Animation → Atmosphere → UI

### Coordinate Systems

**Hex coordinates (axial):**
- `HexCoord { q: number; r: number }` — position within a floor
- `HexAddress { q: number; r: number; y: number }` — includes vertical floor index
- Flat-top orientation
- Conversion: `hexToPixel(q, r)` → world position, `pixelToHex(x, y)` → hex cell

**Book address:**
- `BookAddress { hex: HexAddress; wall: number; shelf: number; slot: number }`
- Uniquely identifies every book in the infinite library
- Deterministic: same address → same content, always

**Screen coordinates:**
- Isometric projection: `worldToScreen(x, y, z)` → screen pixel
- Inverse: `screenToWorld(sx, sy, floor)` → world position (for mouse picking)

---

## Visual Design

### 2.5D Perspective

The game uses a **dimetric projection** (a form of axial/parallel projection):
- X-axis: 30 degrees from horizontal (rightward)
- Y-axis: 30 degrees from horizontal (leftward)
- Z-axis: straight up (vertical floors)

This creates the classic "2.5D" look where:
- Hexagonal floors appear as squashed hexagons
- Walls have visible height
- Depth is conveyed through vertical position on screen

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background (void) | Near-black | `#0a0a0f` |
| Floor (hex tiles) | Dark warm stone | `#2a2218` |
| Walls | Warm brown wood | `#3d2b1f` |
| Shelf planks | Lighter wood | `#5c4033` |
| Book spines | Varied (from seed) | Range: muted earth tones, deep reds, greens, blues, golds |
| Railing | Wrought iron | `#1a1a2e` |
| Light source glow | Warm amber | `#f4a460` |
| Text (UI) | Parchment | `#d4c5a9` |
| Book viewer background | Dark parchment | `#1c1710` |
| Book viewer text | Faded ink | `#8b7d6b` |

### Atmosphere

- **Vignette:** Dark edges (40% screen radius), creating a tunnel/lantern effect
- **Distance fog:** Rooms further from camera fade toward background color (alpha: 1.0 at camera → 0.2 at load boundary)
- **Ambient light:** Warm sepia color matrix applied to entire world container
- **Light flicker:** Subtle sine-wave alpha oscillation (±3%) on nearby rooms, creating the impression of candlelight. Period: 2-4 seconds, randomized per room.
- **Vertical void:** When looking up/down through the central shaft, rooms fade into darkness — the library appears infinite

### Room Visual Breakdown

Each hexagonal room rendered from back to front:

1. **Central air shaft** — a dark hexagonal void in the center of each room (Borges describes rooms surrounding air shafts). Rendered as a dark hexagon, smaller than the room floor.
2. **Low railing** — thin lines around the central shaft opening
3. **Floor** — hexagonal tile, warm stone color, with subtle grid lines
4. **Back walls** (3 walls furthest from camera) — rendered with full height
5. **Shelves on back walls** — horizontal planks with book spines
6. **Ladder/staircase** — one per room, connecting to floor above and below. Positioned at one of the hex edges.
7. **Front walls** (3 walls closest to camera) — rendered with partial transparency or cutaway so player can see inside
8. **Shelves on front walls** — same treatment but semi-transparent

### Book Spines

Each book spine is a thin vertical rectangle on a shelf:
- **Width:** varies by seed (2-6px at default zoom) — some books are thin pamphlets, others thick tomes
- **Height:** shelf height minus small gap (uniform)
- **Color:** determined by seed — pulled from a curated palette of 64 muted colors (earth tones, jewel tones, faded pastels)
- **Highlight on hover:** brightened tint + subtle glow filter + slight Y offset (book "pulls out" slightly)
- **Selected state:** book slides further out with a smooth animation before the viewer opens

---

## Procedural Generation

### Deterministic Seeding

Everything in the library is deterministic. The same coordinates always produce the same room, shelves, and books.

**Seeding chain:**
1. `HexAddress (q, r, y)` → hash → room seed
2. Room seed + wall index + shelf index + slot index → hash → book seed
3. Book seed + page index → hash → page seed
4. Page seed → SeededRandom → character sequence

**Hash function:** Use a fast, well-distributed hash like MurmurHash3 (32-bit) or a simple multiply-xorshift combiner:
```
hash(a, b) = ((a * 0x45d9f3b) ^ b) * 0x45d9f3b >>> 0
```

**PRNG:** xoshiro128** — fast, good distribution, small state (4 × 32-bit), splittable.

### Babel Text Generation

Each page is generated independently from `hash(bookSeed, pageIndex)`:

1. Initialize SeededRandom with page seed
2. Generate 40 lines of 80 characters each
3. Each character: `random.nextInt(0, 24)` mapped to the 25-symbol alphabet
4. The alphabet: `abcdefghijklmnopqrstuv ,.` (22 letters, space, comma, period)

This means:
- Page 1 and page 410 are equally fast to generate (no sequential dependency)
- The same book at the same address always has the same text
- Most text is gibberish, but statistically, every possible arrangement exists *somewhere*

### Book Metadata

From the book seed, derive:
- **Spine color:** `seed % 64` → index into color palette
- **Spine width:** `2 + (seed % 5)` → pixel width (2-6)
- **"Title":** first 20 characters of page 1 (purely decorative, shown on hover)

### Chunk Generation

The world is divided into chunks, each chunk being one hexagonal room at one floor.

**Load/unload radii (in hex distance from camera):**
- LOD_NEAR: 0-3 hexes — full detail (individual book spines, interactive)
- LOD_MID: 4-7 hexes — walls + shelf bars, no individual books
- LOD_FAR: 8-12 hexes — simple hexagonal outline with floor color
- UNLOAD: >14 hexes — chunk disposed, sprites returned to pool

**Generation budget:** max 2 new chunks generated per frame to prevent stuttering. Queue additional chunks for next frames.

---

## Camera System

### Movement

- **WASD / Arrow keys:** horizontal movement across the hex grid
- **Q / E (or PgUp/PgDn):** move up/down between floors
- **Scroll wheel:** zoom in/out
- **Movement style:** smooth — camera lerps toward target position (lerp factor: 0.08-0.12 per frame at 60fps)
- **Zoom range:** 0.3x (zoomed out, see many rooms) to 2.0x (zoomed in, read book spines)

### Visible Bounds

The camera calculates which hex cells are visible each frame:
1. Get screen dimensions in world units (accounting for zoom)
2. Convert screen corners to world coordinates via inverse isometric projection
3. Find all hex cells that overlap this AABB
4. Return as `HexCoord[]` — this drives the WorldManager's load/unload logic

### Floor Transitions

When moving between floors:
- Smooth vertical camera transition (0.5s ease-in-out)
- Current floor fades in, previous floor fades out
- Only the current floor and ±1 adjacent floors are rendered (performance)
- The central air shaft provides a visual preview of floors above/below (dark silhouettes)

---

## Interaction System

### Book Picking

**Pipeline each frame:**
1. Get mouse screen position from InputSystem
2. Convert to world position via `screenToWorld()`
3. Determine which hex cell the mouse is over via `pixelToHex()`
4. If that hex is loaded and at LOD_NEAR:
   - Determine which wall the mouse is closest to (angle from hex center)
   - Hit-test against book spine bounding boxes on that wall
   - If hit: set as hovered book
5. If no hit: clear hover state

**Hover effect:**
- Book spine brightens (tint multiplied by 1.3)
- Slight Y offset (-2px, book "pulls out")
- Tooltip appears showing the book's "title" (first 20 chars of page 1) and address

**Click/select:**
- Book slides out animation (200ms ease-out)
- Screen fades to book viewer overlay
- UIManager transitions from EXPLORING to READING state

### Book Viewer

Full-screen overlay displaying the selected book:

**Layout:**
- Dark parchment background
- Two-page spread (left page, right page) centered on screen
- Book address displayed at top: `Hex (q, r) Floor y — Wall w, Shelf s, Book b`
- Page numbers at bottom of each page
- Navigation arrows on left/right edges

**Content:**
- Monospace font (system monospace or embedded)
- 40 lines × 80 characters per page
- Generated on-demand: only the 2 visible pages are in memory
- Font size adjusts to fit page within available space

**Navigation:**
- Left/right arrow keys or click edges → flip page (±2 pages, since it's a spread)
- Escape or click outside → close viewer, return to EXPLORING
- Page flip: simple crossfade transition (150ms)

**Performance:**
- Only 2 PixiJS Text objects exist, content swapped on page change
- Text generation is <1ms per page (just 3200 random lookups)

---

## Performance Optimization

### Rendering Budget

Target: **60 FPS** on mid-range hardware (integrated GPU, 2020-era laptop)

**Draw call budget:** <50 per frame
- All book spines share ONE white rectangle texture, differentiated by tint → PixiJS batches into ~1 draw call per room regardless of book count
- All shelves share one texture → batched
- All walls share one texture → batched
- Floor, railing, ladder: 3 more draw calls per room
- At ~6 nearby rooms at LOD_NEAR: ~36 draw calls for detailed rooms
- LOD_MID and LOD_FAR rooms: 1-3 draw calls each

### Object Pooling

Generic `ObjectPool<T>` with:
- `acquire(): T` — get from pool or create new
- `release(obj: T): void` — reset and return to pool
- Factory function provided at construction

Pools for: Sprite, Container, Graphics, Text

When a chunk is unloaded, all its sprites are released back to pools. When a new chunk loads, it acquires from pools first. This eliminates GC pressure from constant create/destroy as the camera moves.

### Culling

Two levels:
1. **Container visibility:** chunks outside visible bounds get `container.visible = false` (PixiJS skips them entirely in render)
2. **Full unload:** chunks beyond UNLOAD radius get `dispose()` called — sprites pooled, data freed, removed from chunk map

### Texture Strategy

All textures are generated at runtime using PixiJS Graphics → `RenderTexture`:
- **No external asset files** — zero network requests, instant load
- Textures cached and reused across all rooms
- Total texture count: ~8 (floor, wall, shelf, book spine, ladder, railing, shaft, glow)
- Estimated texture memory: <1MB total

### Generation Throttling

- Max 2 chunk generations per frame
- Chunks queued by priority (distance from camera — closer chunks generated first)
- LOD_FAR chunks are trivially cheap (<0.1ms each)
- LOD_NEAR chunks are heavier (~2-5ms each) but rare (only ~6-12 within near radius)

---

## UI Layer

### HUD (always visible during EXPLORING)

- **Position display** (top-left): `Hex (q, r) · Floor y` — updates as camera moves
- **Controls hint** (bottom-center): `WASD Move · Scroll Zoom · Q/E Floor · Click Book` — fades out after 10 seconds of activity, reappears on 5 seconds of inactivity
- **Style:** semi-transparent dark background, parchment-colored text, small font

### Performance Monitor (debug, toggle with F3)

- FPS (current/average)
- Draw calls
- Active sprites / pooled sprites
- Loaded chunks (near/mid/far)
- Chunk generation queue length

---

## File Structure

```
la-biblioteca-de-babel/
  index.html                           — Minimal HTML: canvas, full-viewport CSS
  package.json                         — Dependencies: pixi.js, vite, typescript, vitest, @playwright/test
  tsconfig.json                        — Strict mode, ES2022, paths alias @/ → src/
  vite.config.ts                       — Standard Vite config
  vitest.config.ts                     — Vitest config (same as Vite)
  playwright.config.ts                 — Playwright config for Docker-based e2e
  SPEC.md                              — This file
  PROGRESS.md                          — Ralph Loop iteration tracker
  src/
    main.ts                            — Entry: init PixiJS Application, create Game, start loop
    game.ts                            — Game class: owns app, systems, update loop
    config.ts                          — All constants (hex geometry, LOD, camera, Babel specs)
    math/
      hex.ts                           — HexCoord, HexAddress, hexToPixel, pixelToHex, neighbors, distance, ring, spiral
      hex.test.ts                      — Roundtrip tests, neighbor correctness, distance, ring generation
      hash.ts                          — hash(), SeededRandom (xoshiro128**), seedFromAddress()
      hash.test.ts                     — Determinism, distribution, collision resistance
      isometric.ts                     — worldToScreen, screenToWorld, depthSort comparator
      isometric.test.ts                — Roundtrip projection, depth ordering correctness
    systems/
      input.ts                         — InputSystem: keyboard state, mouse position, scroll, movement vector
      camera.ts                        — CameraSystem: position, zoom, lerp, getVisibleBounds, getVisibleHexes, currentFloor
      world-manager.ts                 — WorldManager: chunk Map, load/unload logic, generation queue
      book-picker.ts                   — BookPicker: mouse→hex→wall→book hit testing, hover/select events
      culling.ts                       — CullingSystem: toggle container.visible based on bounds
      lod-manager.ts                   — LODManager: assign LOD per chunk, trigger re-render on change
      animation.ts                     — AnimationSystem: data-driven tweens {target, prop, from, to, duration, easing}
    generation/
      chunk-generator.ts               — ChunkGenerator: create HexChunk at LOD level, throttled
      hex-chunk.ts                     — HexChunk: address, container, lod, books[], dispose()
      book-data.ts                     — BookAddress, BookData types, deriveBookData(address) → metadata
      book-data.test.ts                — Determinism: same address → same data
      babel-text.ts                    — generatePage(bookSeed, pageIndex) → string (3200 chars)
      babel-text.test.ts               — Determinism, alphabet compliance, page independence, correct dimensions
    rendering/
      room-renderer.ts                 — RoomRenderer: build hex room container (floor, shaft, railing, walls, shelves, books, ladder)
      assets.ts                        — TextureCache: generate & cache all textures from Graphics
      object-pool.ts                   — ObjectPool<T>: acquire, release, stats
      object-pool.test.ts              — Acquire/release cycle, pool growth, reuse verification
      atmosphere.ts                    — AtmosphereSystem: sepia ColorMatrix, vignette sprite, distance fog, light flicker
    ui/
      ui-manager.ts                    — UIManager: EXPLORING ↔ READING state machine
      book-viewer.ts                   — BookViewer: two-page spread, page generation, flip navigation
      hud.ts                           — HUD: position display, controls hint with fade behavior
    debug/
      perf-monitor.ts                  — PerfMonitor: FPS, draw calls, pool stats, F3 toggle
  e2e/
    game.spec.ts                       — Playwright e2e: canvas renders, camera moves, book viewer opens
    screenshots/                       — Auto-captured screenshots for visual verification
```

---

## Milestones

### Milestone 1: Project Setup + Test Infrastructure
**Build:** Vite + PixiJS + TypeScript scaffold, Vitest config, Playwright Docker config
**Verify:** `npx tsc --noEmit` passes, `npx vite build` succeeds, Playwright test confirms canvas appears with no console errors
**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `src/main.ts`, `e2e/game.spec.ts`

### Milestone 2: Math Foundation + Single Hex Room
**Build:** Hex math, isometric projection, config constants, texture generation, render one hex room with floor + 6 walls + central shaft + railing
**Verify:** Unit tests pass (hex roundtrips, isometric roundtrips), Playwright screenshot shows hexagonal room
**Files:** `src/config.ts`, `src/game.ts`, `src/math/*`, `src/rendering/assets.ts`, `src/rendering/room-renderer.ts`

### Milestone 3: Camera & Input
**Build:** Keyboard/mouse input tracking, camera movement (WASD), zoom (scroll), smooth lerp
**Verify:** Playwright simulates WASD, screenshots show camera moved (pixels changed)
**Files:** `src/systems/input.ts`, `src/systems/camera.ts`

### Milestone 4: Infinite World
**Build:** Seeded RNG, chunk generation, world manager (load/unload), culling, generation throttling
**Verify:** Unit tests (RNG determinism, hash uniqueness), Playwright moves camera far — new hexes appear
**Files:** `src/math/hash.ts`, `src/generation/hex-chunk.ts`, `src/generation/chunk-generator.ts`, `src/systems/world-manager.ts`, `src/systems/culling.ts`

### Milestone 5: Room Details & LOD
**Build:** Shelves on walls, book spines (tinted), 3-tier LOD, object pooling
**Verify:** Unit tests (object pool, book data determinism), Playwright zoom in — detail increases in screenshot
**Files:** `src/generation/book-data.ts`, `src/systems/lod-manager.ts`, `src/rendering/object-pool.ts`

### Milestone 6: Book Interaction
**Build:** Book picking (hover highlight, click select), Babel text generator, book viewer (two-page spread, page flip), UI state machine
**Verify:** Unit tests (text determinism, alphabet, dimensions), Playwright clicks canvas — UI overlay appears
**Files:** `src/systems/book-picker.ts`, `src/generation/babel-text.ts`, `src/ui/book-viewer.ts`, `src/ui/ui-manager.ts`

### Milestone 7: Atmosphere & Polish
**Build:** Sepia tint, vignette, distance fog, light flicker, animations, HUD, perf monitor
**Verify:** Playwright screenshot shows atmospheric lighting (not flat). F3 key triggers perf overlay. All previous tests still pass.
**Files:** `src/rendering/atmosphere.ts`, `src/systems/animation.ts`, `src/ui/hud.ts`, `src/debug/perf-monitor.ts`

---

## Testing Strategy

### Unit Tests (Vitest, every iteration)

| Module | What to test |
|--------|-------------|
| `hex.ts` | hexToPixel↔pixelToHex roundtrip, neighbors return 6 valid coords, distance(a,a)=0, ring(n) returns 6n cells |
| `hash.ts` | Same seed → same sequence (10 values), different seeds → different sequences, seedFromAddress(a) !== seedFromAddress(b) for different addresses |
| `isometric.ts` | worldToScreen↔screenToWorld roundtrip (with known floor), depth sort: objects with higher screen Y sort later |
| `babel-text.ts` | Same seed+page → same text, all chars in valid alphabet, page 0 !== page 1 (different content), each page is 40 lines × 80 chars |
| `book-data.ts` | Same address → same color/width/title, different addresses → different data |
| `object-pool.ts` | acquire() returns object, release+acquire returns same object, pool.size grows on demand |

### E2E Tests (Playwright in Docker, after each milestone)

Single test file `e2e/game.spec.ts` with progressive assertions:

1. **Canvas exists:** page has `<canvas>`, width/height > 0
2. **No errors:** no console.error during 2 seconds of runtime
3. **Content renders:** canvas is not all-black (pixel sample check)
4. **Camera moves:** dispatch WASD keypress, wait 500ms, screenshot differs from before
5. **Book viewer opens:** dispatch click on canvas center, check for viewer DOM/overlay
6. **Book viewer closes:** dispatch Escape, verify viewer gone

Screenshots saved to `e2e/screenshots/` — Claude reads these with the Read tool for visual verification.

### Docker E2E Command

```bash
# npm script "test:e2e":
npx vite build && npx vite preview --host 0.0.0.0 --port 5173 &
sleep 2
docker run --rm --network host \
  -v $(pwd):/work -w /work \
  mcr.microsoft.com/playwright:v1.52.0-noble \
  npx playwright test
kill %1
```
