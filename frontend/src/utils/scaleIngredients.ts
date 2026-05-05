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
    { value: 0.125, word: 'ثمن' },
    { value: 0.2, word: 'خمس' },
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

// Escape special regex chars in Arabic words
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Build a combined regex that matches BOTH numeric tokens AND Arabic fraction
// words in a SINGLE pass — this guarantees we never re-scan a replacement and
// never scale the same value twice (which was the cause of the
// "نصف → ربع → 0.1" cascading bug).
const AR_FRAC_RE_SRC = AR_FRAC_WORDS.map((w) => escapeRe(w.word)).join('|');
const NUMBER_RE_SRC = [
  '\\d+\\s+\\d+\\/\\d+', // "1 1/2"
  '\\d+\\s*[\u00BD\u00BC\u00BE\u2150-\u215E]', // "2 ½"
  '\\d+\\/\\d+', // "1/2"
  '\\d+(?:\\.\\d+)?', // "3.5" or "10"
  '[\u00BD\u00BC\u00BE\u2150-\u215E]', // "½"
].join('|');

// IMPORTANT: Arabic fraction words FIRST, so longer words get matched before
// they could be misinterpreted as something else.
const COMBINED_RE = new RegExp(`(${AR_FRAC_RE_SRC})|(${NUMBER_RE_SRC})`, 'g');

// Old-style export kept for backwards compatibility (used elsewhere).
const NUMBER_RE = new RegExp(NUMBER_RE_SRC, 'g');

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
 *
 * Implementation note: ALL number tokens AND Arabic fraction words are matched
 * in a SINGLE pass with a combined regex. This guarantees we never re-scan a
 * replacement and never scale the same value twice (which previously caused
 * the cascading "نصف → ربع → 0.1" bug).
 */
export function scaleLine(line: string, factor: number, lang: Lang = 'ar'): string {
  if (!line || factor === 1) return line;

  // 1) Normalise Arabic-Indic digits to Western
  const original = toWestern(line);

  // 2) Build lookup for Arabic fraction words → value
  const fracWordValue: Record<string, number> = {};
  for (const { word, value } of AR_FRAC_WORDS) {
    fracWordValue[word] = value;
  }

  // 3) SINGLE-pass replacement covering both Arabic words and numeric tokens.
  return original.replace(COMBINED_RE, (match, fracWord, numToken, ...args) => {
    // last two args are: offset, full string
    const offset = args[args.length - 2] as number;
    const fullStr = args[args.length - 1] as string;

    let v: number | null = null;
    if (fracWord) {
      v = fracWordValue[fracWord] ?? null;
    } else if (numToken) {
      v = tokenToValue(numToken);
    }
    if (v === null) return match;
    if (v >= 1900) return match; // skip years / codes

    const scaled = v * factor;
    // Peek at the next ~25 chars (skipping whitespace/punct) to detect unit
    const after = fullStr
      .substring(offset + match.length)
      .replace(/^[\s,.\(\):\-]+/, '')
      .slice(0, 25);

    if (isIntegerUnitAfter(after)) {
      return formatInteger(scaled);
    }
    return formatScaled(scaled, lang);
  });
}

/**
 * Scale a full multi-line ingredient block by factor.
 */
export function scaleIngredients(text: string, factor: number, lang: Lang = 'ar'): string {
  if (!text || factor === 1) return text;
  return text.split('\n').map((line) => scaleLine(line, factor, lang)).join('\n');
}

/**
 * Scale cooking time using the 80/20 rule:
 *   newTime = oldTime * (0.8 + 0.2 * factor)
 *
 * - factor 1.0  → 1.00× (no change)
 * - factor 2.0  → 1.20× (+20% time)
 * - factor 0.5  → 0.90× (−10% time)
 * - factor 4.0  → 1.60×
 *
 * Cooking time does NOT scale linearly with quantity — a larger pot
 * needs slightly more heat-up time but not proportionally more.
 *
 * Returns formatted time text in the same language as the input,
 * or null if the time string can't be parsed.
 */
export function scaleCookingTime(
  timeText: string | undefined | null,
  factor: number,
  lang: Lang = 'ar'
): string | null {
  if (!timeText || !isFinite(factor) || factor <= 0) return null;

  const w = toWestern(String(timeText)).trim();
  // Match number (decimal allowed) followed by an hour/minute unit
  const re = /(\d+(?:\.\d+)?)\s*(hours?|hour|h|ساعات|ساعة|tim|timmar|minutes?|min|m|دقيقة|دقائق|minuter)/i;
  const m = w.match(re);
  if (!m) return null;

  const value = parseFloat(m[1]);
  if (!isFinite(value)) return null;
  const unitRaw = m[2].toLowerCase();

  // Detect unit type (hour vs minute)
  const isHour =
    /^(h|hour|hours|ساعة|ساعات|tim|timmar)$/i.test(unitRaw);

  // Convert to total minutes for math
  const baseMinutes = isHour ? value * 60 : value;
  const scaleMul = 0.8 + 0.2 * factor;
  let scaledMin = baseMinutes * scaleMul;
  // Round to a sensible number (5-min granularity for >= 30 min)
  if (scaledMin >= 30) {
    scaledMin = Math.round(scaledMin / 5) * 5;
  } else {
    scaledMin = Math.max(1, Math.round(scaledMin));
  }

  // Format back to original unit family (hour if >= 60 min, else minutes)
  const labels = {
    ar: { h_one: 'ساعة', h_two: 'ساعتان', h_many: 'ساعات', m: 'دقيقة', mPl: 'دقيقة' },
    en: { h_one: 'hour', h_two: 'hours', h_many: 'hours', m: 'minute', mPl: 'minutes' },
    sv: { h_one: 'timme', h_two: 'timmar', h_many: 'timmar', m: 'minut', mPl: 'minuter' },
  } as const;
  const L = labels[lang] || labels.ar;

  if (scaledMin >= 60 && scaledMin % 60 === 0) {
    const hours = scaledMin / 60;
    let unit: string = L.h_many;
    if (lang === 'ar') {
      if (hours === 1) unit = L.h_one;
      else if (hours === 2) unit = L.h_two;
      else unit = L.h_many;
    } else {
      unit = hours === 1 ? L.h_one : L.h_two;
    }
    if (lang === 'ar' && hours === 2) {
      return unit; // "ساعتان"
    }
    const numStr = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, '');
    return `${numStr} ${unit}`;
  }

  if (scaledMin >= 60) {
    const hours = Math.floor(scaledMin / 60);
    const mins = Math.round(scaledMin - hours * 60);
    const hUnit =
      lang === 'ar'
        ? hours === 1
          ? L.h_one
          : hours === 2
          ? L.h_two
          : L.h_many
        : hours === 1
        ? L.h_one
        : L.h_two;
    const mUnit = lang === 'en' || lang === 'sv' ? (mins === 1 ? L.m : L.mPl) : L.m;
    if (lang === 'ar' && hours === 2) {
      return `${hUnit} و${mins} ${mUnit}`;
    }
    return `${hours} ${hUnit} ${mins} ${mUnit}`;
  }

  const minLabel = lang === 'en' || lang === 'sv' ? (scaledMin === 1 ? L.m : L.mPl) : L.m;
  return `${Math.round(scaledMin)} ${minLabel}`;
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
