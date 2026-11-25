// Sizzle & Serve: the kitchen floor — where every station sits, and
// what the cook bumps into. Coordinates are canvas pixels, 1280x800.
// The room is one open floor; counters form the walls and the islands.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;
export const BOARD_H = 108;

// A station the cook can stand beside and use with E.
export const STATIONS = [
  { id: 'crate-rice', kind: 'crate', gives: 'rice', x: 24, y: 196, w: 92, h: 92, label: 'RICE' },
  { id: 'crate-noodle', kind: 'crate', gives: 'noodle', x: 24, y: 300, w: 92, h: 92, label: 'NOODLE' },
  { id: 'crate-egg', kind: 'crate', gives: 'egg', x: 24, y: 404, w: 92, h: 92, label: 'EGG' },
  { id: 'crate-chicken', kind: 'crate', gives: 'chicken', x: 24, y: 508, w: 92, h: 92, label: 'CHICKEN' },
  { id: 'crate-veg', kind: 'crate', gives: 'veg', x: 24, y: 612, w: 92, h: 92, label: 'VEG' },
  { id: 'crate-chili', kind: 'crate', gives: 'chili', x: 132, y: 612, w: 92, h: 92, label: 'CHILI' },
  { id: 'board', kind: 'board', x: 300, y: 196, w: 150, h: 84, label: 'CHOP' },
  { id: 'wok1', kind: 'wok', x: 520, y: 196, w: 150, h: 84, label: 'WOK 1' },
  { id: 'wok2', kind: 'wok', x: 700, y: 196, w: 150, h: 84, label: 'WOK 2' },
  { id: 'plate', kind: 'plate', x: 920, y: 196, w: 150, h: 84, label: 'PLATE' },
  { id: 'serve', kind: 'serve', x: 1120, y: 300, w: 136, h: 180, label: 'SERVE' },
  { id: 'trash', kind: 'trash', x: 1120, y: 612, w: 92, h: 92, label: 'TRASH' },
];

// The walkable floor: inside the room, outside every station's box.
export function collidesWithStation(x, y, r) {
  for (const s of STATIONS) {
    if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return s;
  }
  return null;
}

// Furniture that fills the room but is never used: a prep island, dining
// tables, plants and a menu poster. Solid like a station, never a station.
export const DECOR = [
  { id: 'island', kind: 'island', x: 330, y: 440, w: 560, h: 90, label: 'PREP' },
  { id: 'table1', kind: 'table', x: 330, y: 600, w: 170, h: 90 },
  { id: 'table2', kind: 'table', x: 580, y: 600, w: 170, h: 90 },
  { id: 'table3', kind: 'table', x: 830, y: 600, w: 170, h: 90 },
  { id: 'plant1', kind: 'plant', x: 1150, y: 720, w: 52, h: 52 },
  { id: 'plant2', kind: 'plant', x: 240, y: 700, w: 52, h: 52 },
];

export function collidesWithDecor(x, y, r) {
  for (const d of DECOR) {
    if (x + r > d.x && x - r < d.x + d.w && y + r > d.y && y - r < d.y + d.h) return d;
  }
  return null;
}

export function insideRoom(x, y, r) {
  return x - r >= 8 && x + r <= VIEW_W - 8 && y - r >= HUD_H + BOARD_H + 4 && y + r <= VIEW_H - 8;
}

/** The station whose edge the cook is nearest to, within reach. */
export function nearestStation(x, y, reach = 46) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= reach ? best : null;
}
