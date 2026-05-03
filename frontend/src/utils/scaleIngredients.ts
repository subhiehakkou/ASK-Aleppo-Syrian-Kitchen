/**
 * scaleIngredients.ts
 *
 * Smart ingredient quantity scaler for AR/EN/SV recipes.
 * Detects and scales in a SINGLE pass (no double-scaling):
 *   - Western digits:           "2", "0.5", "3.25"
 *   - Arabic-Indic digits:      "٢", "٠٫٥"
 *   - ASCII fractions:          "1/2", "3/4"
 *   - Unicode fractions:        "½", "⅓", "⅔", "¼", "¾", …
 *   - Mixed numbers:            "1 1/2", "2 ½"
 *   - Arabic fraction words:    "نصف", "ربع", "ثلث", "ثمن", "ثلثي", "ثلاثة أرباع"
 */

// --- Helpers ---
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const toWestern = (s: string): string =>
  s.replace(/[٠-٩]/g, (c) => String(ARABIC_INDIC.indexOf(c)));

// Unicode fraction glyphs → decimal value
const UNI_FRAC: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3,
  '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

// Arabic fraction words → value (ORDER MATTERS: longest first)
const AR_FRAC_WORDS: { word: string; value: number }[] = [
  { word: 'ثلاثة أرباع', value: 0.75 },
  { word: 'ثلاث أرباع', value: 0.75 },
  { word: 'ثلثين', value: 2 / 3 },
  { word: 'ثلثي', value: 2 / 3 },
  { word: 'نصف', value: 0.5 },
  { word: 'نص', value: 0.5 },
  { word: 'ربع', value: 0.25 },
  { word: 'ثلث', value: 1 / 3 },
  { word: 'ثمن', value: 0.125 },
  { word: 'خُمس', value: 0.2 },
  { word: 'خمس', value: 0.2 },
];

/**
 * Format a number nicely for display.
 *   Whole numbers → "2"
 *   Common fractions → "½", "¾"
 *   Mixed → "1 ½"
 *   Otherwise decimal (1 digit) → "1.5"
 */
export function formatScaled(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '';
  if (n < 0) return '-' + formatScaled(-n);

  if (Math.abs(n - Math.round(n)) < 0.02) return String(Math.round(n));

  const whole = Math.floor(n);
  const frac = n - whole;

  const fracMap: [string, number][] = [
    // Halves, quarters, eighths (most common) first
    ['½', 0.5], ['¼', 0.25], ['¾', 0.75],
    ['⅛', 0.125], ['⅜', 0.375], ['⅝', 0.625], ['⅞', 0.875],
    // Thirds and sixths
    ['⅓', 1 / 3], ['⅔', 2 / 3], ['⅙', 1 / 6], ['⅚', 5 / 6],
    // Fifths
    ['⅕', 0.2], ['⅖', 0.4], ['⅗', 0.6], ['⅘', 0.8],
  ];

  for (const [glyph, val] of fracMap) {
    if (Math.abs(frac - val) < 0.02) {
      return whole > 0 ? `${whole} ${glyph}` : glyph;
    }
  }

  // Fallback: decimal with max 2 digits, trim trailing zeros
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}

// Master regex that catches all number-like tokens in one pass.
// Priority handled by ordering the alternatives (longest first):
//   1) Mixed: "1 1/2"  or  "2 ½"
//   2) Fraction: "1/2"
//   3) Decimal or integer: "3.5" or "2"
//   4) Single unicode fraction: "½"
const NUMBER_RE = new RegExp(
  [
    '\\d+\\s+\\d+\\/\\d+',                                        // "1 1/2"
    '\\d+\\s*[\u00BD\u00BC\u00BE\u2150-\u215E]',                   // "2 ½"
    '\\d+\\/\\d+',                                                 // "1/2"
    '\\d+(?:\\.\\d+)?',                                           // "3.5" or "10"
    '[\u00BD\u00BC\u00BE\u2150-\u215E]',                           // "½"
  ].join('|'),
  'g'
);

function tokenToValue(tok: string): number | null {
  const t = tok.trim();
  // Unicode fraction only
  if (UNI_FRAC[t] !== undefined) return UNI_FRAC[t];

  // Mixed: "1 1/2"
  const mMixedAscii = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mMixedAscii) {
    return parseFloat(mMixedAscii[1]) + parseFloat(mMixedAscii[2]) / parseFloat(mMixedAscii[3]);
  }

  // Mixed: "2 ½"
  const mMixedUni = t.match(/^(\d+)\s*([\u00BD\u00BC\u00BE\u2150-\u215E])$/);
  if (mMixedUni) {
    return parseFloat(mMixedUni[1]) + (UNI_FRAC[mMixedUni[2]] || 0);
  }

  // ASCII fraction: "1/2"
  const mFrac = t.match(/^(\d+)\/(\d+)$/);
  if (mFrac) return parseFloat(mFrac[1]) / parseFloat(mFrac[2]);

  // Decimal or integer
  const mNum = t.match(/^\d+(?:\.\d+)?$/);
  if (mNum) return parseFloat(t);

  return null;
}

/**
 * Scale a single line of ingredient text by a factor.
 */
export function scaleLine(line: string, factor: number): string {
  if (!line || factor === 1) return line;

  // 1) Normalise Arabic-Indic digits to Western for processing
  let s = toWestern(line);

  // 2) Scale all numeric tokens in a SINGLE regex pass (no cascade scaling)
  s = s.replace(NUMBER_RE, (match) => {
    const v = tokenToValue(match);
    if (v === null) return match;
    // Skip very large numbers (likely years / codes)
    if (v >= 1900) return match;
    return formatScaled(v * factor);
  });

  // 3) Replace Arabic fraction words (longest first, word list already ordered)
  for (const { word, value } of AR_FRAC_WORDS) {
    if (s.includes(word)) {
      const replacement = formatScaled(value * factor);
      s = s.split(word).join(replacement);
    }
  }

  return s;
}

/**
 * Scale a full multi-line ingredient block by factor.
 */
export function scaleIngredients(text: string, factor: number): string {
  if (!text || factor === 1) return text;
  return text.split('\n').map((line) => scaleLine(line, factor)).join('\n');
}

/**
 * Try to extract a number of servings from a "servings" field.
 * Examples:
 *   "4 أشخاص"   → 4
 *   "4-6 persons" → 5  (average, rounded)
 *   "تكفي ٦ أشخاص" → 6
 *   ""          → null
 */
export function parseServings(servingsText: string | undefined | null): number | null {
  if (!servingsText) return null;
  const w = toWestern(servingsText);
  const range = w.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    return Math.round((parseFloat(range[1]) + parseFloat(range[2])) / 2);
  }
  const single = w.match(/\d+/);
  if (single) return parseFloat(single[0]);
  return null;
}
