// Logical render resolution (scaled up to fill screen)
export const RENDER_WIDTH = 320;
export const RENDER_HEIGHT = 200;
export const HORIZON = 100; // center of screen

// Spiral staircase geometry
export const STEPS_PER_FLOOR = 20;
export const STEP_HEIGHT = 16;
export const STEP_DEPTH = 32; // depth of each step in world units
export const WALL_OFFSET = 120; // distance from center to outer wall
export const VOID_OFFSET = 40; // distance from center to inner railing

// Camera
export const PLAYER_HEIGHT = 40;
export const MOVE_SPEED = 2.0; // steps per second
export const MOUSE_LOOK_RANGE = 0.26; // ±15 degrees in radians
export const HEAD_BOB_AMPLITUDE = 2;
export const HEAD_BOB_FREQUENCY = 4; // cycles per second

// View
export const VIEW_DISTANCE = 20; // steps visible ahead/behind
export const FOG_START = 0.6; // fog begins at 60% of view distance

// Shelves & books
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;
export const BOOKS_PER_STEP = SHELVES_PER_WALL * BOOKS_PER_SHELF; // 175

// Babel text
export const BABEL_ALPHABET = "abcdefghijklmnopqrstuv ,.";
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;

// Colors
export const COLOR_BG = "#0a0a0f";
export const COLOR_FLOOR = { r: 42, g: 34, b: 24 };
export const COLOR_CEILING = { r: 26, g: 24, b: 16 };
export const COLOR_WALL = { r: 61, g: 43, b: 31 };
export const COLOR_SHELF = { r: 92, g: 64, b: 51 };
export const COLOR_RAILING = { r: 26, g: 26, b: 46 };
export const COLOR_VOID = { r: 5, g: 5, b: 8 };
export const COLOR_HUD = "#d4c5a9";

// Book spine color palette (64 muted colors)
export const BOOK_SPINE_COLORS = [
  [139,69,19],[160,82,45],[107,58,42],[74,44,42],[47,27,20],
  [112,66,20],[139,105,20],[85,107,47],[46,74,46],[26,58,26],
  [47,79,79],[26,58,74],[26,42,74],[42,26,74],[74,26,58],
  [74,26,26],[107,26,26],[139,42,42],[74,58,42],[58,42,26],
  [122,106,74],[154,138,106],[106,90,58],[90,74,42],[138,122,90],
  [58,58,58],[74,74,74],[90,90,90],[42,42,58],[58,58,74],
  [184,134,11],[218,165,32],[205,133,63],[210,105,30],[165,42,42],
  [128,0,0],[139,0,0],[101,67,33],[59,47,47],[72,60,50],
  [75,54,33],[92,64,51],[110,75,58],[123,91,74],[139,107,90],
  [46,43,38],[62,59,54],[78,75,70],[30,59,38],[46,75,54],
  [78,27,38],[62,43,22],[94,59,6],[110,75,22],[126,91,38],
  [142,107,54],[158,123,70],[174,139,86],[190,155,102],[206,171,118],
  [43,29,14],[60,42,26],[77,59,42],[94,76,58],
];
