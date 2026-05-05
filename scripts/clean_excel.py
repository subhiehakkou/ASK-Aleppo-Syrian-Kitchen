#!/usr/bin/env python3
"""
ASK Recipe Excel Cleaner & Standardizer
========================================
Comprehensive cleaner for the user's Google Sheets export.

Fixes applied:
  1) Category unification (12 canonical categories) + EN/SV translations
  2) Multi-category support (e.g. "بابا غنوج" in both Mezze + Yogurt)
  3) "Salads" mistranslation: Authorities/Myndigheterna → Salads/Sallader
  4) Time format errors:
     - EN "X 1 hours" → "X hours"
     - AR "1.30 ساعة" → "1.5 ساعة" (and the EN/SV equivalents)
  5) Row 68 (الرز بشعيرية): wrong category copy-paste → "أكلات الحبوب"
  6) Typing artefacts:
     - "1 ملعقة صغيرةفلفل" → "1 ملعقة صغيرة فلفل" (missing space)
     - "0.5  نصف ملعقة" → "0.5 ملعقة" (duplicate fraction word + digit)
     - Doubled spaces, trailing whitespace
  7) Replace all "Kibbeh"/"Kibbe" with "Kebbe" in EN and SV
     (preserves capitalisation: KIBBEH→KEBBE, kibbeh→kebbe, Kibbeh→Kebbe)

Output:
  - /tmp/ASK_recipes_CLEANED.xlsx  (clean Excel for the user)
  - /tmp/ASK_recipes_REPORT.txt    (changelog of every fix)
"""
import openpyxl
import re
import sys
from pathlib import Path

INPUT  = Path('/tmp/ASK_recipes.xlsx')
OUTPUT = Path('/tmp/ASK_recipes_CLEANED.xlsx')
REPORT = Path('/tmp/ASK_recipes_REPORT.txt')

# ─────────────────────────────────────────────────────────────────────────────
# 1) Canonical category map  →  (AR, EN, SV)
# ─────────────────────────────────────────────────────────────────────────────
CANONICAL_CATEGORIES = [
    ('الكبب الحلبية',          'Aleppo Kebbe',         'Aleppo-kebbe'),
    ('المحاشي',                'Stuffed Vegetables',   'Fyllda grönsaker'),
    ('اللحوم',                 'Meat Dishes',          'Kötträtter'),
    ('الخضار',                 'Vegetable Dishes',     'Grönsaksrätter'),
    ('السلطات',                'Salads',               'Sallader'),
    ('الشوربات',               'Soups',                'Soppor'),
    ('المقبلات',               'Appetizers',           'Förrätter'),
    ('أكلات باللبن (الزبادي)', 'Yogurt Dishes',        'Yoghurträtter'),
    ('أكلات الحبوب',           'Grain Dishes',         'Spannmålsrätter'),
    ('أكلات نباتية',           'Vegetarian Dishes',    'Vegetariska rätter'),
    ('المعجنات',               'Pastries',             'Bakverk'),
    ('متنوعات',                'Various Dishes',       'Diverse rätter'),
]

# Map any AR variant → canonical AR
AR_VARIANT_MAP = {
    'الكبب الحلبية':          'الكبب الحلبية',
    'المحاشي':                'المحاشي',
    'اللحوم':                 'اللحوم',
    'الخضار':                 'الخضار',
    'السلطات':                'السلطات',
    'الشوربات':               'الشوربات',
    'المقبلات':               'المقبلات',
    'مقبلات':                 'المقبلات',
    'أكلات باللبن الزبادي':   'أكلات باللبن (الزبادي)',
    'أكلات باللبن (الزبادي)': 'أكلات باللبن (الزبادي)',
    'أكلات باللبن(الزبادي)':  'أكلات باللبن (الزبادي)',
    'أكلات الحبوب':           'أكلات الحبوب',
    'أكلات نباتية':           'أكلات نباتية',
    'المعجنات':               'المعجنات',
    'أكلات متنوعة':           'متنوعات',
    'متنوعات':                'متنوعات',
}

AR_TO_EN = {ar: en for ar, en, _ in CANONICAL_CATEGORIES}
AR_TO_SV = {ar: sv for ar, _, sv in CANONICAL_CATEGORIES}

# ─────────────────────────────────────────────────────────────────────────────
# 2) Helpers
# ─────────────────────────────────────────────────────────────────────────────

def normalize_ar_category(value):
    """Split a possibly multi-category cell into a clean list of canonical AR names."""
    if not value or not isinstance(value, str):
        return []
    # Split on commas (Arabic and Latin)
    parts = re.split(r'[,،]', value)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # Heuristic: anything longer than 30 chars is a description, not a category
        if len(p) > 30:
            continue
        canonical = AR_VARIANT_MAP.get(p)
        if canonical and canonical not in out:
            out.append(canonical)
    return out


def replace_kibbeh_to_kebbe(text):
    """Case-preserving replacement: Kibbeh/Kibbe → Kebbe (in EN/SV text)."""
    if not text or not isinstance(text, str):
        return text

    def _replace(m):
        word = m.group(0)
        if word.isupper():
            return 'KEBBE'
        if word[0].isupper():
            return 'Kebbe'
        return 'kebbe'

    # Replace Kibbeh first (longer), then Kibbe
    text = re.sub(r'\bkibbeh\b', _replace, text, flags=re.IGNORECASE)
    text = re.sub(r'\bkibbe\b',  _replace, text, flags=re.IGNORECASE)
    return text


def normalize_ar_time(text):
    """Clean and standardise an Arabic time string.
    Examples:
      "1.30 ساعة"    → "1.5 ساعة"
      "1.5 ساعة ف"   → "1.5 ساعة"     (strip trailing junk)
      "ساعة"         → "1 ساعة"       (insert implicit 1)
      "30"           → "30 دقيقة"     (assume minutes if just a number ≤ 60)
      "30 دقيقة"     → "30 دقيقة"     (unchanged)
    """
    if text is None or text == '':
        return text
    # Handle numeric cell values from Excel (integers like 30 or floats like 1.5)
    if isinstance(text, (int, float)):
        n = float(text)
        n_str = str(int(n)) if n == int(n) else str(n)
        if n <= 60:
            return f"{n_str} دقيقة"
        return f"{n_str} ساعة"
    if not isinstance(text, str):
        return text
    s = text.strip()
    s = re.sub(r'\s+', ' ', s)

    # 1.30 ساعة → 1.5 ساعة
    s = re.sub(r'(\d+)\.30\b', r'\1.5', s)

    # If the string ends with stray Arabic letters like "ف", "ا" etc. after a unit,
    # cut everything after the recognised unit.
    m = re.match(r'^(\d+(?:\.\d+)?)\s*(ساعات|ساعة|دقيقة|دقائق|دقيقه)\b', s)
    if m:
        n_str, unit = m.group(1), m.group(2)
        # Normalise plurals: 1 ساعة, 2+ ساعات / ساعة → keep AR convention
        return f"{n_str} {unit}"

    # No leading number: "ساعة" alone or "ساعات" alone
    m2 = re.match(r'^(ساعات|ساعة|دقيقة|دقائق|دقيقه)\b', s)
    if m2:
        return f"1 {m2.group(1)}"

    # Just a number: assume minutes if ≤ 60 else hours
    m3 = re.fullmatch(r'(\d+(?:\.\d+)?)', s)
    if m3:
        n = float(m3.group(1))
        if n <= 60:
            return f"{int(n) if n == int(n) else n} دقيقة"
        return f"{int(n) if n == int(n) else n} ساعة"

    return s


def derive_time_from_ar(ar_time, lang='en'):
    """When EN/SV time is missing or broken, build it from the Arabic time."""
    if not ar_time:
        return None
    s = str(ar_time).strip()
    # First normalise 1.30 → 1.5
    s = re.sub(r'(\d+)\.30', r'\1.5', s)

    m_h = re.search(r'(\d+(?:\.\d+)?)\s*(?:ساعات|ساعة|ساعه)', s)
    m_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:دقائق|دقيقة|دقيقه)', s)
    if m_h:
        n = float(m_h.group(1))
        n_str = str(int(n)) if n == int(n) else str(n)
        if lang == 'en':
            return f"{n_str} hour" if n == 1 else f"{n_str} hours"
        if lang == 'sv':
            return f"{n_str} timme" if n == 1 else f"{n_str} timmar"
    if m_m:
        n = int(m_m.group(1))
        if lang == 'en':
            return f"{n} minute" if n == 1 else f"{n} minutes"
        if lang == 'sv':
            return f"{n} minut" if n == 1 else f"{n} minuter"
    return None


def fix_ar_typos(text):
    """Repair common typing artefacts in Arabic ingredient/instruction lines."""
    if not text or not isinstance(text, str):
        return text
    s = text

    # 1) Duplicate fraction-word + digit:  "0.5  نصف ملعقة" → "0.5 ملعقة"
    fraction_words = ['نصف', 'نص', 'ربع', 'ثلث', 'ثمن', 'ثلثي', 'ثلثين']
    for w in fraction_words:
        # "<digit>.<digit>  <word> <unit>"  → "<digit>.<digit> <unit>"
        s = re.sub(rf'(\d+\.\d+)\s+{w}\s+', r'\1 ', s)
        # "0.5<word>"  with no space (rare)
        s = re.sub(rf'(\d+\.\d+){w}\s+', r'\1 ', s)

    # 2) Missing space after Arabic measurement word, before next noun:
    #    "صغيرةفلفل" → "صغيرة فلفل"
    for unit in ['ملعقة صغيرة', 'ملعقة طعام', 'ملعقة', 'كوب', 'كأس', 'فنجان']:
        # If unit is glued to a following Arabic letter, insert a space.
        s = re.sub(rf'({unit})([\u0621-\u064A])', r'\1 \2', s)

    # 3) Collapse 2+ spaces and trim line ends
    s = re.sub(r'  +', ' ', s)
    s = '\n'.join(line.rstrip() for line in s.split('\n'))

    return s


# ─────────────────────────────────────────────────────────────────────────────
# 3) Main processing
# ─────────────────────────────────────────────────────────────────────────────

def main():
    if not INPUT.exists():
        print(f"❌ Input file not found: {INPUT}", file=sys.stderr)
        sys.exit(1)

    wb = openpyxl.load_workbook(INPUT)
    ws = wb['Sheet1']

    report_lines = ["=" * 70, "ASK Recipe Excel Cleanup Report", "=" * 70, ""]
    stats = {
        'rows_processed': 0,
        'cat_fixed': 0,
        'multi_cat': 0,
        'salads_fixed': 0,
        'time_fixed': 0,
        'kebbe_replaced': 0,
        'typo_fixed': 0,
        'row_68_fixed': False,
    }

    for r in range(2, ws.max_row + 1):
        if not ws.cell(r, 1).value:
            continue
        stats['rows_processed'] += 1

        name_ar = ws.cell(r, 3).value or '<unnamed>'
        name_en = ws.cell(r, 18).value or ''

        # ── Categories ────────────────────────────────────────────────────
        ar_raw = ws.cell(r, 2).value
        ar_cats = normalize_ar_category(ar_raw)
        if not ar_cats:
            # fallback for row 68 (long-text bug) and any other broken row
            ar_cats = ['متنوعات']
            stats['cat_fixed'] += 1
            report_lines.append(
                f"Row {r} ({name_ar}): category was unrecognised "
                f"({str(ar_raw)[:40]}…) → defaulted to 'متنوعات'"
            )
        elif ar_raw and ', '.join(ar_cats) != str(ar_raw).strip():
            stats['cat_fixed'] += 1
            report_lines.append(
                f"Row {r} ({name_ar}): category cleaned   "
                f"'{str(ar_raw)[:35]}…' → '{', '.join(ar_cats)}'"
            )
        if len(ar_cats) > 1:
            stats['multi_cat'] += 1

        # Special override for row 68 (الرز بشعيرية)
        if r == 68:
            ar_cats = ['أكلات الحبوب']
            stats['row_68_fixed'] = True
            report_lines.append(f"Row 68 (الرز بشعيرية): category forced to 'أكلات الحبوب'")

        ws.cell(r, 2).value  = ', '.join(ar_cats)
        ws.cell(r, 17).value = ', '.join(AR_TO_EN[c] for c in ar_cats)
        ws.cell(r, 32).value = ', '.join(AR_TO_SV[c] for c in ar_cats)
        if 'Salads' in ws.cell(r, 17).value or 'Sallader' in ws.cell(r, 32).value:
            stats['salads_fixed'] += 1

        # ── Time ──────────────────────────────────────────────────────────
        # Strategy: AR is the source of truth. We normalise AR, then DERIVE
        # the EN/SV times from the cleaned AR. This guarantees consistency.
        time_ar_raw = ws.cell(r, 5).value
        time_en_raw = ws.cell(r, 20).value
        time_sv_raw = ws.cell(r, 35).value

        time_ar_new = normalize_ar_time(time_ar_raw)
        time_en_new = derive_time_from_ar(time_ar_new, 'en') or time_en_raw
        time_sv_new = derive_time_from_ar(time_ar_new, 'sv') or time_sv_raw

        if (time_ar_new != time_ar_raw or time_en_new != time_en_raw
                or time_sv_new != time_sv_raw):
            stats['time_fixed'] += 1
            report_lines.append(
                f"Row {r} ({name_ar}): time fixed  "
                f"AR '{time_ar_raw}'→'{time_ar_new}' | "
                f"EN '{time_en_raw}'→'{time_en_new}' | "
                f"SV '{time_sv_raw}'→'{time_sv_new}'"
            )
        ws.cell(r, 5).value  = time_ar_new
        ws.cell(r, 20).value = time_en_new
        ws.cell(r, 35).value = time_sv_new

        # ── Kibbeh → Kebbe (EN + SV columns 16-30 + 31-45) ────────────────
        for col_range in (range(16, 31), range(31, 46)):
            for c in col_range:
                v = ws.cell(r, c).value
                if isinstance(v, str) and re.search(r'\bkibbe[h]?\b', v, re.IGNORECASE):
                    new = replace_kibbeh_to_kebbe(v)
                    if new != v:
                        ws.cell(r, c).value = new
                        stats['kebbe_replaced'] += 1

        # ── Typo fixes (AR ingredient/instruction columns) ─────────────────
        for c in [6, 7, 9, 10, 14, 15]:  # Ingredients / Way / Decoration / Secrets / Tips / Where
            v = ws.cell(r, c).value
            if isinstance(v, str):
                new = fix_ar_typos(v)
                if new != v:
                    stats['typo_fixed'] += 1
                    ws.cell(r, c).value = new

    # ── Save ──────────────────────────────────────────────────────────────
    wb.save(OUTPUT)
    report_lines.append("")
    report_lines.append("=" * 70)
    report_lines.append("Summary")
    report_lines.append("=" * 70)
    for k, v in stats.items():
        report_lines.append(f"  {k:<22}: {v}")
    REPORT.write_text('\n'.join(report_lines), encoding='utf-8')

    print("✅ Cleaning complete!")
    print(f"   Cleaned file → {OUTPUT}")
    print(f"   Report file  → {REPORT}")
    print()
    for k, v in stats.items():
        print(f"   {k:<22}: {v}")


if __name__ == '__main__':
    main()
