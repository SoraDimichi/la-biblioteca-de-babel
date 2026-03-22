// Hex geometry
export const HEX_RADIUS = 120;
export const WALL_COUNT = 6;
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;
export const BOOKS_PER_ROOM = WALL_COUNT * SHELVES_PER_WALL * BOOKS_PER_SHELF; // 1050

// Camera
export const CAMERA_MOVE_SPEED = 4;
export const CAMERA_LERP_FACTOR = 0.1;
export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 2.0;
export const ZOOM_SPEED = 0.1;

// LOD distance thresholds (in hex distance)
export const LOD_NEAR = 3;
export const LOD_MID = 7;
export const LOD_FAR = 12;
export const UNLOAD_RADIUS = 14;
export const CHUNK_LOAD_RADIUS = 12;
export const MAX_CHUNKS_PER_FRAME = 2;

// Babel text
export const BABEL_ALPHABET = "abcdefghijklmnopqrstuv ,.";
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;

// Visual
export const WALL_HEIGHT = 80;
export const SHELF_HEIGHT = 14;

// Colors
export const COLOR_BACKGROUND = 0x0a0a0f;
export const COLOR_FLOOR = 0x2a2218;
export const COLOR_WALL = 0x3d2b1f;
export const COLOR_SHELF = 0x5c4033;
export const COLOR_RAILING = 0x1a1a2e;
export const COLOR_LIGHT = 0xf4a460;
export const COLOR_TEXT = 0xd4c5a9;

export const BOOK_SPINE_COLORS = [
  0x8b4513, 0xa0522d, 0x6b3a2a, 0x4a2c2a, 0x2f1b14,
  0x704214, 0x8b6914, 0x556b2f, 0x2e4a2e, 0x1a3a1a,
  0x2f4f4f, 0x1a3a4a, 0x1a2a4a, 0x2a1a4a, 0x4a1a3a,
  0x4a1a1a, 0x6b1a1a, 0x8b2a2a, 0x4a3a2a, 0x3a2a1a,
  0x7a6a4a, 0x9a8a6a, 0x6a5a3a, 0x5a4a2a, 0x8a7a5a,
  0x3a3a3a, 0x4a4a4a, 0x5a5a5a, 0x2a2a3a, 0x3a3a4a,
  0xb8860b, 0xdaa520, 0xcd853f, 0xd2691e, 0xa52a2a,
  0x800000, 0x8b0000, 0x654321, 0x3b2f2f, 0x483c32,
  0x4b3621, 0x5c4033, 0x6e4b3a, 0x7b5b4a, 0x8b6b5a,
  0x2e2b26, 0x3e3b36, 0x4e4b46, 0x1e3b26, 0x2e4b36,
  0x4e1b26, 0x3e2b16, 0x5e3b06, 0x6e4b16, 0x7e5b26,
  0x8e6b36, 0x9e7b46, 0xae8b56, 0xbe9b66, 0xceab76,
  0x2b1d0e, 0x3c2a1a, 0x4d3b2a, 0x5e4c3a,
];
