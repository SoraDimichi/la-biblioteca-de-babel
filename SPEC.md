# La Biblioteca de Babel — Game Design Specification v2

## Vision

A first-person exploration game inside Borges' Library of Babel. You are climbing an infinite spiral staircase inside a massive hexagonal tower. The outer wall is lined floor-to-ceiling with bookshelves. You walk endlessly upward (or downward), selecting books from the shelves as you pass. The atmosphere is dark, warm, candlelit — ancient stone and endless books fading into darkness above and below.

**The feel:** You are tiny inside an impossibly vast structure. The staircase spirals forever. The shelves never end. Every book exists somewhere. You are searching.

**Rendering:** Mode 7 / pseudo-3D — SNES-style floor/ceiling scaling with billboard sprites for shelves and books. Forward-facing camera. Retro aesthetic.

---

## Source Material (Borges, 1941)

- Hexagonal galleries with vast air shafts
- 5 shelves per wall, 35 books per shelf
- 410 pages per book, 40 lines of 80 characters
- 25 orthographical symbols (22 letters a-v, space, comma, period)
- Spiral staircases connecting floors

**Our adaptation:** The player is ON the spiral staircase, walking along the outer wall of a hexagonal shaft. The inner edge looks down into a dark void (the air shaft). The outer wall is covered in bookshelves.

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Renderer | HTML5 Canvas 2D (Mode 7 floor/ceiling + billboard sprites) |
| Language | TypeScript (strict) |
| Bundler | Vite |
| Unit tests | Vitest |
| Package manager | npm |

**No PixiJS** — pure Canvas2D for maximum control over the pseudo-3D rendering pipeline.

---

## Architecture

### Game Loop

```
Game
  ├── InputSystem       — W/S forward/back, A/D turn, mouse look, click
  ├── PlayerSystem      — position on spiral, facing direction, movement
  ├── WorldGenerator    — generates shelf/book data for visible segment
  ├── Renderer          — Mode 7 rendering pipeline
  │     ├── FloorCeiling — scaled scanline floor/ceiling
  │     ├── WallRenderer — outer wall with shelves/books
  │     ├── VoidRenderer — inner edge looking into shaft
  │     └── FogRenderer  — distance fog/darkness
  ├── BookPicker        — cursor → book hit testing
  ├── BookViewer        — full-screen book reader overlay
  └── HUD               — position, controls
```

### Coordinate System

The world is a **1D spiral**:
- `position: number` — distance along the spiral (0 = starting point, positive = upward, negative = downward)
- `angle: number` — player's facing direction (radians, 0 = along the spiral)
- The spiral has a fixed radius and pitch (vertical rise per revolution)

Each "step" of the spiral has:
- An outer wall segment with bookshelves
- An inner railing looking into the void
- Floor (the stair tread) and ceiling

**Book addressing:**
- `floor: number` = `Math.floor(position / STEPS_PER_FLOOR)`
- `wallSegment: number` = `Math.floor(position % STEPS_PER_FLOOR)`
- `shelf: number` (0-4, bottom to top)
- `slot: number` (0-34, left to right along segment)

Same position → same books, always (deterministic seeded generation).

---

## Visual Design

### Mode 7 Rendering

The camera looks forward along the spiral staircase:

1. **Floor (stair treads):** Rendered as scaled horizontal scanlines. Each scanline maps to a row of floor pixels at increasing distance. Stone texture color with perspective foreshortening.

2. **Ceiling:** Same technique as floor but mirrored vertically. Dark stone, fading to black.

3. **Outer wall (bookshelves):** Fills the right side of the screen (or spans most of the view). Rendered as vertical strips at perspective-correct positions. Contains:
   - 5 horizontal shelf planks
   - Books between shelves (colored rectangles)
   - The wall recedes into distance with fog

4. **Inner void (left side):** The hexagonal shaft. Dark emptiness with a thin railing. Occasionally see distant walls/lights of other floors far below/above.

5. **Distance fog:** Everything fades to near-black beyond ~20 steps. Creates the feeling of infinite darkness.

### Screen Layout (320x200 logical resolution, scaled up)

```
┌──────────────────────────────────────┐
│ ceiling (dark, fading up)            │
│                                      │
│  void/railing │ corridor │ bookshelf │
│  (dark abyss) │  (floor) │ (books)   │
│               │          │ ██████    │
│   darkness    │  stone   │ ██████    │
│               │  floor   │ ██████    │
│                                      │
│ floor (stone, fading to distance)    │
└──────────────────────────────────────┘
```

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background/void | Near-black | `#0a0a0f` |
| Floor stone | Warm dark stone | `#2a2218` |
| Ceiling | Dark stone | `#1a1810` |
| Wall stone | Warm brown | `#3d2b1f` |
| Shelf planks | Lighter wood | `#5c4033` |
| Book spines | Varied from seed | Earth tones, deep colors |
| Railing | Iron gray | `#1a1a2e` |
| Fog/distance | Black | `#0a0a0f` |
| HUD text | Parchment | `#d4c5a9` |
| Book viewer bg | Dark parchment | `#1c1710` |
| Book viewer text | Faded ink | `#8b7d6b` |

### Atmosphere

- **Fog:** Linear distance fog. Objects fade to black starting at 60% view distance
- **Candlelight flicker:** Subtle brightness oscillation (±3%), period 2-3 seconds
- **Railing glow:** Faint warm light on the railing edge
- **Void whispers:** The dark shaft has occasional faint specs of light far below (other floors, candles)

---

## Rendering Pipeline (Mode 7 Detail)

### Logical Resolution

Render to an offscreen canvas at **320×200** pixels, then scale to fit the screen. This gives the retro aesthetic and makes rendering cheap.

### Floor/Ceiling Rendering (per scanline)

For each horizontal scanline below the horizon:
1. Calculate the distance this scanline represents using perspective projection:
   `distance = viewHeight / (scanlineY - horizon)`
2. Map the scanline to world-space coordinates along the spiral
3. Sample the floor color (stone with subtle variation from hash)
4. Apply distance fog (darken with distance)
5. Draw the scanline

Ceiling is the same but above the horizon, flipped.

### Wall Rendering (vertical strips)

The outer wall is rendered as a series of vertical strips, one per world-space step:
1. For each visible step along the spiral (nearest to farthest):
   - Calculate screen X position based on angle offset from player facing
   - Calculate strip height based on distance (perspective)
   - Draw wall background (stone color, darkened by distance)
   - Draw 5 shelf planks as horizontal lines within the strip
   - Draw book spines between shelves as colored vertical rectangles
2. Closer strips overdraw farther ones (painter's algorithm, back-to-front)

### Void Rendering

The inner edge (left side when facing along spiral):
- Dark gradient from railing color to pure black
- Thin railing line at the edge
- Occasional distant light specs (randomly placed, slowly drifting)

---

## Player Movement

### Controls

- **W / Up:** Move forward along spiral (upward)
- **S / Down:** Move backward (downward)
- **A / Left:** Not used for turning — player always faces along the spiral
- **Mouse move:** Look slightly left/right (±15 degrees) to see more of wall or void
- **Click:** Select hovered book
- **Escape:** Close book viewer
- **Arrow Left/Right in viewer:** Flip pages

### Movement Feel

- Smooth movement along the spiral: `position += speed * dt`
- Speed: ~2 steps per second at walk speed
- **Head bob:** Subtle sine-wave vertical oscillation while moving (±2px, synced to footsteps)
- **No strafing** — this is a narrow spiral staircase, you move forward or backward

### Steps Per Floor

- `STEPS_PER_FLOOR = 20` — one full revolution of the spiral = one "floor" of the library
- Each step has one wall segment with books visible
- The spiral rises `STEP_HEIGHT = 16` pixels per step (at 1:1 scale)

---

## Book Interaction

### Hover Detection

The cursor maps to the visible wall:
1. Get mouse screen position
2. Map to the wall strip the cursor is over (which step along the spiral)
3. Within that strip, determine shelf (vertical position) and slot (horizontal position)
4. Highlight the hovered book (brighten color)
5. Show tooltip: book title (first 20 chars of page 1) and address

### Book Viewer

Same as before — full-screen overlay:
- Dark parchment background
- Two-page spread with monospace Babel text
- Arrow keys to flip pages
- Escape to close
- Book address in header

---

## Procedural Generation

### Deterministic Seeding (reuse existing)

- `seedFromAddress(floor, wallSegment, shelf, slot)` → book seed
- `hash(bookSeed, pageIndex)` → page seed
- `SeededRandom(pageSeed)` → character sequence
- Same `hash.ts` and `babel-text.ts` modules

### World Segment Generation

Only generate data for visible segments (current position ± view distance):
- ~40 steps visible at any time (20 ahead, 20 behind)
- Each step: generate 5 shelves × 35 books = 175 book colors/widths
- Use existing `deriveBookData()` with adapted address format

### View Distance

- `VIEW_DISTANCE = 20` steps forward/backward
- Beyond that: pure fog/darkness
- Total visible books: ~40 steps × 175 books = 7,000 book data points (trivial)

---

## Performance

### Target: 60 FPS

The Mode 7 approach is inherently fast:
- 320×200 = 64,000 pixels to fill per frame
- Floor/ceiling: ~100 scanlines × 320px = 32,000 pixel ops
- Wall: ~40 visible strips × ~200px height = 8,000 pixel ops
- Books: colored rectangles within wall strips
- All integer math, no floating point division in inner loops
- Final upscale: single `drawImage()` call

### Memory

- Only ~40 steps of book data in memory at a time
- Text generated on-demand when book is opened
- No textures — all drawn with solid colors

---

## File Structure

```
la-biblioteca-de-babel/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  SPEC.md
  PROGRESS.md
  src/
    main.ts                    — Entry: create canvas, start game loop
    game.ts                    — Game coordinator, system update order
    config.ts                  — All constants
    math/
      hash.ts                  — hash(), SeededRandom, seedFromAddress() [KEEP]
      hash.test.ts             — [KEEP]
    generation/
      babel-text.ts            — generatePage(), getBookTitle() [KEEP]
      babel-text.test.ts       — [KEEP]
      book-data.ts             — BookAddress, BookData, deriveBookData() [ADAPT]
      book-data.test.ts        — [ADAPT]
      world-generator.ts       — Generate visible segment book data
    rendering/
      renderer.ts              — Main render orchestrator
      floor-ceiling.ts         — Mode 7 scanline floor/ceiling
      wall-renderer.ts         — Outer wall with shelves and books
      void-renderer.ts         — Inner void/abyss rendering
      fog.ts                   — Distance fog application
    systems/
      input.ts                 — Keyboard/mouse input [ADAPT]
      player.ts                — Position on spiral, movement, head bob
    ui/
      book-viewer.ts           — Full-screen book reader [ADAPT to Canvas2D]
      hud.ts                   — Position display [ADAPT to Canvas2D]
    debug/
      perf-monitor.ts          — FPS counter [ADAPT to Canvas2D]
```

---

## Milestones

### Milestone 1: Project Setup + Canvas
- Remove PixiJS dependency, set up pure Canvas2D
- 320×200 offscreen canvas, scaled to fit window
- Render solid background color
- **Verify:** Build passes, canvas visible

### Milestone 2: Mode 7 Floor/Ceiling
- Implement scanline-based floor rendering with perspective
- Stone color with distance fog
- Ceiling mirrored above horizon
- **Verify:** Screenshot shows floor receding into distance

### Milestone 3: Player Movement
- WASD movement along spiral
- Smooth position tracking
- Head bob while moving
- Mouse look (±15 degrees)
- **Verify:** Movement works, floor perspective shifts correctly

### Milestone 4: Wall Rendering with Shelves
- Render outer wall as vertical strips
- 5 shelf planks per wall segment
- Book spines between shelves (colored rectangles from seed)
- Distance fog on wall
- **Verify:** Walk forward, see shelves with books receding into darkness

### Milestone 5: Void & Atmosphere
- Inner void rendering (dark abyss with railing)
- Fog system
- Candlelight flicker
- Distant light specs in void
- **Verify:** Atmospheric, moody screenshot

### Milestone 6: Book Interaction
- Cursor → wall → shelf → book hit detection
- Hover highlight
- Click opens book viewer (Canvas2D rendered)
- Babel text generation
- Page flipping
- **Verify:** Can select and read a book

### Milestone 7: Polish
- HUD (floor number, position)
- Perf monitor (F3)
- Smooth transitions
- **Verify:** All features working, 60 FPS

---

## Testing Strategy

### Unit Tests (Vitest)

| Module | Tests |
|--------|-------|
| `hash.ts` | Determinism, distribution, uniqueness [KEEP] |
| `babel-text.ts` | Determinism, alphabet, dimensions [KEEP] |
| `book-data.ts` | Same address → same data [ADAPT] |
| `player.ts` | Position updates, head bob calculation |
| `floor-ceiling.ts` | Scanline distance calculation correctness |
| `wall-renderer.ts` | Strip position/height calculation |

### Visual Verification

After each milestone, take a screenshot of the canvas and review it with the Read tool.
