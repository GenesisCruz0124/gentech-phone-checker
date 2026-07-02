// Best-guess iPhone lookup. iOS Safari hides the model in the UA, so we map
// GPU renderer (Apple AXX GPU) + logical screen size + devicePixelRatio to a
// short list of likely models. This is intentionally a "best guess" — never
// present as certain.

export interface IPhoneGuess {
  models: string[];
  chip: string;
}

interface Entry {
  // logical CSS points (portrait), width x height
  w: number;
  h: number;
  dpr: number;
  models: string[];
  chip: string;
}

// Ordered roughly newest → oldest. Multiple models can share a screen profile.
const TABLE: Entry[] = [
  { w: 440, h: 956, dpr: 3, models: ['iPhone 16 Pro Max', 'iPhone 16 Plus'], chip: 'Apple A18' },
  { w: 402, h: 874, dpr: 3, models: ['iPhone 16 Pro'], chip: 'Apple A18 Pro' },
  { w: 393, h: 852, dpr: 3, models: ['iPhone 16', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 14 Pro'], chip: 'Apple A16/A17/A18' },
  { w: 430, h: 932, dpr: 3, models: ['iPhone 15 Plus', 'iPhone 15 Pro Max', 'iPhone 14 Pro Max'], chip: 'Apple A16/A17' },
  { w: 390, h: 844, dpr: 3, models: ['iPhone 14', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 12', 'iPhone 12 Pro'], chip: 'Apple A14/A15' },
  { w: 428, h: 926, dpr: 3, models: ['iPhone 14 Plus', 'iPhone 13 Pro Max', 'iPhone 12 Pro Max'], chip: 'Apple A14/A15' },
  { w: 375, h: 812, dpr: 3, models: ['iPhone 13 mini', 'iPhone 12 mini', 'iPhone 11 Pro', 'iPhone XS', 'iPhone X'], chip: 'Apple A11–A15' },
  { w: 414, h: 896, dpr: 3, models: ['iPhone 11 Pro Max', 'iPhone XS Max'], chip: 'Apple A12/A13' },
  { w: 414, h: 896, dpr: 2, models: ['iPhone 11', 'iPhone XR'], chip: 'Apple A12/A13' },
  { w: 414, h: 736, dpr: 3, models: ['iPhone 8 Plus', 'iPhone 7 Plus', 'iPhone 6s Plus'], chip: 'Apple A9–A11' },
  { w: 375, h: 667, dpr: 2, models: ['iPhone SE (2nd/3rd gen)', 'iPhone 8', 'iPhone 7', 'iPhone 6s'], chip: 'Apple A9–A15' },
  { w: 320, h: 568, dpr: 2, models: ['iPhone SE (1st gen)', 'iPhone 5s'], chip: 'Apple A7/A9' },
];

/** Extract e.g. "Apple A15 GPU" chip family from a WebGL renderer string. */
export function appleChipFromRenderer(renderer: string): string | null {
  const m = /Apple\s+(A\d+X?|M\d+)\s*GPU/i.exec(renderer);
  return m ? `Apple ${m[1]}` : null;
}

export function guessIPhone(
  cssW: number,
  cssH: number,
  dpr: number,
  renderer: string,
): IPhoneGuess | null {
  const w = Math.min(cssW, cssH);
  const h = Math.max(cssW, cssH);
  const roundedDpr = Math.round(dpr);
  let best: Entry | null = null;
  let bestScore = Infinity;
  for (const e of TABLE) {
    const score =
      Math.abs(e.w - w) + Math.abs(e.h - h) + (e.dpr === roundedDpr ? 0 : 40);
    if (score < bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (!best || bestScore > 60) return null;
  const chipFromGpu = appleChipFromRenderer(renderer);
  return { models: best.models, chip: chipFromGpu ?? best.chip };
}
