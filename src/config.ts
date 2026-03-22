// Logical render resolution (scaled up to fill screen)
export const RENDER_WIDTH = 400;
export const RENDER_HEIGHT = 250;

// Spiral geometry
export const SPIRAL_RADIUS = 8; // radius of the spiral path in world units
export const CORRIDOR_WIDTH = 3; // width between inner and outer wall
export const STEP_RISE = 0.4; // height gained per step along spiral
export const STEPS_PER_FLOOR = 24; // steps for one full revolution
export const CURVE_PER_STEP = (Math.PI * 2) / STEPS_PER_FLOOR; // angular turn per step

// Camera / player
export const EYE_HEIGHT = 1.5; // player eye height in world units
export const MOVE_SPEED = 3.0; // steps per second
export const MOUSE_SENSITIVITY = 0.002;
export const HEAD_BOB_AMPLITUDE = 0.03;
export const HEAD_BOB_FREQUENCY = 4;
export const FOV = 1.2; // field of view in radians (~70 degrees)
export const PITCH_LIMIT = 1.0;

// View
export const VIEW_STEPS = 16; // how many corridor segments visible ahead
export const FOG_START_FRAC = 0.5;

// Shelves & books
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;

// Babel text
export const BABEL_ALPHABET = "abcdefghijklmnopqrstuv ,.";
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;

// Colors (0-1 floats for easier math)
export const COLOR_BG: RGB = [10, 10, 15];
export const COLOR_FLOOR: RGB = [42, 34, 24];
export const COLOR_FLOOR_ALT: RGB = [36, 28, 20]; // alternating step
export const COLOR_CEILING: RGB = [22, 20, 14];
export const COLOR_WALL_OUTER: RGB = [61, 43, 31]; // bookshelf wall
export const COLOR_WALL_INNER: RGB = [18, 18, 30]; // void wall
export const COLOR_SHELF: RGB = [92, 64, 51];
export const COLOR_RAILING: RGB = [30, 30, 50];

export type RGB = [number, number, number];

// Book spine color palette (64 muted colors)
export const BOOK_SPINE_COLORS: RGB[] = [
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
