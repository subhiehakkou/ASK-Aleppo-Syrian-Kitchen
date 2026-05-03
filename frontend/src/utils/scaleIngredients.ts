/**
 * scaleIngredients.ts
 *
 * Smart ingredient quantity scaler for AR/EN/SV recipes.
 * Language-aware formatting:
 *   - Weight/volume units (جرام، غرام، gram، g، مل، ml، سم³):
 *       rounded to nearest INTEGER (no fractions, no decimals).
 *   - Arabic text: no Unicode fraction glyphs (⅓, ⅔, ¼, ½ …) — these break
 *     on many Arabic fonts. Use Arabic words or plain decimals instead.
 *   - English/Swedish: Unicode fraction glyphs allowed (nicer typography).
 *
 * Detects and scales in a SINGLE pass (no double-scaling):
 *   - Western digits:           "2", "0.5", "3.25"
 *   - Arabic-Indic digits:      "٢", "٠٫٥"
 *   - ASCII fractions:          "1/2", "3/4"
 *   - Unicode fractions:        "½", "⅓", "⅔", …
 *   - Mixed numbers:            "1 1/2", "2 ½"
 *   - Arabic fraction words:    "نصف", "ربع", "ثلث", "ثمن", "ثلثي", "ثلاثة أرباع"
 */

export type Lang = 'ar' | 'en' | 'sv';

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

// Units where the ingredient is weighed/measured in small increments:
// ALWAYS output integer (the cook doesn't care about 0.67g of salt).
const INTEGER_UNIT_PREFIXES = [
  // Arabic
  'جرام', 'غرام', 'غ ', 'غ.', 'غ،', 'جم',
  'مل ', 'مل.', 'مل،', 'مليلتر',
  'سم3', 'سم٣',
  // English
  'g ', 'g.', 'g,', 'gr ', 'gr.', 'gram', 'grams',
  'ml ', 'ml.', 'ml,', 'milliliter',
  'cc ', 'cc.',
  // Swedish
  'gr ', 'gram',
];

// Units where fractions feel natural (cups, spoons, pieces …).
// These keep fraction display (with language-aware formatting).
// (All other units fall here by default.)

// --- Format helpers ---------------------------------------------------------

function formatInteger(n: number): string {
  // Standard rounding: .5 and above → up; below → down.
  return String(Math.round(n));
}

function formatArabic(n: number): string {
  // Arabic-friendly display: no Unicode fraction glyphs.
  // Whole number? just the number.
  if (Math.abs(n - Math.round(n)) < 0.02) return String(Math.round(n));

  // Try common Arabic fraction words (purely decorative for half/quarter).
  const whole = Math.floor(n);
  const frac = n - whole;

  const namedFractions: { value: number; word: string }[] = [
    { value: 0.5, word: 'نصف' },
    { value: 0.25, word: 'ربع' },
    { value: 0.75, word: 'ثلاثة أرباع' },
    { value: 1 / 3, word: 'ثلث' },
    { value: 2 / 3, word: 'ثلثي' },
  ];

  for (const { value, word } of namedFractions) {
    if (Math.abs(frac - value) < 0.03) {
      return whole > 0 ? `${whole} و${word}` : word;
    }
  }

  // Fallback: plain decimal with 1 digit (no fraction glyphs in Arabic)
  const s = n.toFixed(1);
  return s.replace(/\.0$/, '');
}

function formatWestern(n: number): string {
  // English/Swedish: Unicode fractions are visually nicer.
  if (!isFinite(n) || isNaN(n)) return '';
  if (n < 0) return '-' + formatWestern(-n);

  if (Math.abs(n - Math.round(n)) < 0.02) return String(Math.round(n));

  const whole = Math.floor(n);
  const frac = n - whole;

  const fracMap: [string, number][] = [
    ['½', 0.5], ['¼', 0.25], ['¾', 0.75],
    ['⅛', 0.125], ['⅜', 0.375], ['⅝', 0.625], ['⅞', 0.875],
    ['⅓', 1 / 3], ['⅔', 2 / 3], ['⅙', 1 / 6], ['⅚', 5 / 6],
    ['⅕', 0.2], ['⅖', 0.4], ['⅗', 0.6], ['⅘', 0.8],
  ];

  for (const [glyph, val] of fracMap) {
    if (Math.abs(frac - val) < 0.02) {
      return whole > 0 ? `${whole} ${glyph}` : glyph;
    }
  }

  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}

// Public export kept for backward-compat: default to Western formatting.
export function formatScaled(n: number, lang: Lang = 'en'): string {
  return lang === 'ar' ? formatArabic(n) : formatWestern(n);
}

/** Returns true if `textAfter` (already trimmed-start) begins with a unit
 *  where integer output is mandatory (grams, ml, etc.). */
function isIntegerUnitAfter(textAfter: string): boolean {
  const t = textAfter.toLowerCase();
  for (const u of INTEGER_UNIT_PREFIXES) {
    if (t.startsWith(u.toLowerCase())) return true;
  }
  // Special case: unit ends with bare "g" followed by space/punct (avoid matching "garlic")
  // Only when numeric value right before, keep tight: the cases above already cover most.
  return false;
}

// --- Main regex (single-pass, no cascade) ----------------------------------

const NUMBER_RE = new RegExp(
  [
    '\\d+\\s+\\d+\\/\\d+',                                         // "1 1/2"
    '\\d+\\s*[\u00BD\u00BC\u00BE\u2150-\u215E]',                    // "2 ½"
    '\\d+\\/\\d+',                                                  // "1/2"
    '\\d+(?:\\.\\d+)?',                                            // "3.5" or "10"
    '[\u00BD\u00BC\u00BE\u2150-\u215E]',                            // "½"
  ].join('|'),
  'g'
);

function tokenToValue(tok: string): number | null {
  const t = tok.trim();
  if (UNI_FRAC[t] !== undefined) return UNI_FRAC[t];

  const mMixedAscii = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mMixedAscii) {
    return parseFloat(mMixedAscii[1]) + parseFloat(mMixedAscii[2]) / parseFloat(mMixedAscii[3]);
  }
  const mMixedUni = t.match(/^(\d+)\s*([\u00BD\u00BC\u00BE\u2150-\u215E])$/);
  if (mMixedUni) {
    return parseFloat(mMixedUni[1]) + (UNI_FRAC[mMixedUni[2]] || 0);
  }
  const mFrac = t.match(/^(\d+)\/(\d+)$/);
  if (mFrac) return parseFloat(mFrac[1]) / parseFloat(mFrac[2]);

  const mNum = t.match(/^\d+(?:\.\d+)?$/);
  if (mNum) return parseFloat(t);

  return null;
}

/**
 * Scale a single line of ingredient text by a factor.
 * `lang` controls the fraction formatting style (Arabic avoids Unicode glyphs).
 */
export function scaleLine(line: string, factor: number, lang: Lang = 'ar'): string {
  if (!line || factor === 1) return line;

  // 1) Normalise Arabic-Indic digits to Western
  let s = toWestern(line);

  // 2) Scale all numeric tokens in ONE pass.  Inspect text after each match to
  //    decide: integer-forced (grams/ml) vs. fraction-friendly.
  s = s.replace(NUMBER_RE, (match, ...args) => {
    const offset = args[args.length - 2] as number;
    const fullStr = args[args.length - 1] as string;

    const v = tokenToValue(match);
    if (v === null) return match;
    if (v >= 1900) return match; // skip years / codes

    const scaled = v * factor;

    // Peek at the next ~25 chars (skipping whitespace/punct) to detect unit
    const after = fullStr.substring(offset + match.length).replace(/^[\s,.\(\):\-]+/, '').slice(0, 25);
    if (isIntegerUnitAfter(after)) {
      return formatInteger(scaled);
    }
    return formatScaled(scaled, lang);
  });

  // 3) Replace Arabic fraction words (longest first)
  for (const { word, value } of AR_FRAC_WORDS) {
    if (s.includes(word)) {
      const scaled = value * factor;
      // Check: is this word next to an integer-unit? search for the word's position
      let idx = 0;
      while ((idx = s.indexOf(word, idx)) !== -1) {
        const after = s.substring(idx + word.length).replace(/^[\s,.\(\):\-]+/, '').slice(0, 25);
        const replacement = isIntegerUnitAfter(after)
          ? formatInteger(scaled)
          : formatScaled(scaled, lang);
        s = s.substring(0, idx) + replacement + s.substring(idx + word.length);
        idx += replacement.length;
      }
    }
  }

  return s;
}

/**
 * Scale a full multi-line ingredient block by factor.
 */
export function scaleIngredients(text: string, factor: number, lang: Lang = 'ar'): string {
  if (!text || factor === 1) return text;
  return text.split('\n').map((line) => scaleLine(line, factor, lang)).join('\n');
}

/**
 * Try to extract a number of servings from a "servings" field.
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
