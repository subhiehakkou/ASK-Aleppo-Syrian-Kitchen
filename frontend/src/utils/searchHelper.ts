/**
 * Client-side comprehensive search across ALL recipe fields.
 * Works offline using bundled recipe data (offline-first).
 * Searches: name, description, ingredients, instructions, secrets,
 *           decoration, time, servings, and category names — in all 3 languages.
 */
import recipesData from '../data/recipes.json';
import categoriesData from '../data/categories.json';

export interface SearchMatchField {
  field: string;
  type: 'name' | 'description' | 'ingredients' | 'instructions' | 'secrets' | 'decoration' | 'category' | 'other';
}

export interface SearchResult {
  id: string;
  name_ar: string;
  name_en: string;
  name_sv: string;
  image: string;
  category_id: string;
  category_name_ar: string;
  category_name_en: string;
  category_name_sv: string;
  match_fields: SearchMatchField[];
  time_ar: string;
  description_ar?: string;
  description_en?: string;
  description_sv?: string;
}

// SUPER STRICT mode (per Ms Sabah's strong request): search ONLY in
// • name (what the recipe IS called)
// • ingredients (what the recipe ACTUALLY contains)
// • category (high-level grouping)
// We deliberately EXCLUDE description, instructions, secrets, decoration —
// because those fields often mention ingredients incidentally (e.g. "يقدم
// مع اللبن" or "تزيين بالنعناع") and would create false positives.
const FIELD_GROUPS: Record<string, SearchMatchField['type']> = {
  name_ar: 'name', name_en: 'name', name_sv: 'name',
  ingredients_ar: 'ingredients', ingredients_en: 'ingredients', ingredients_sv: 'ingredients',
  category_name_ar: 'category', category_name_en: 'category', category_name_sv: 'category',
};

// Normalize Arabic text for fuzzy matching (handle diacritics, alef variants, etc.)
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u0652\u0670]/g, '') // remove diacritics
    .replace(/[إأآا]/g, 'ا')               // unify alef
    .replace(/[ىي]/g, 'ي')                  // unify ya
    .replace(/[ةه]/g, 'ه')                  // unify ta marbuta
    .replace(/[ؤو]/g, 'و')                  // unify waw
    .replace(/[ئءى]/g, 'ي')                 // unify hamza
    .toLowerCase()
    .trim();
}

function normalize(text: string): string {
  if (!text) return '';
  // Latin: lowercase + remove diacritics
  const latin = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Apply Arabic normalization too (it's harmless on Latin text)
  return normalizeArabic(latin);
}

function fieldContains(fieldValue: string, normQuery: string): boolean {
  if (!fieldValue) return false;
  const normField = normalize(fieldValue);
  return normField.includes(normQuery);
}

/**
 * Extract ONLY the actual ingredient bullet lines from the ingredients block.
 *
 * Why this matters (per Ms Sabah's strong feedback):
 *   The `ingredients_*` field in each recipe is a multi-line text that contains:
 *     • bullet lines starting with "•" — these are the REAL ingredients
 *       (e.g. "• 2 كيلو لبن دسم 10%")
 *     • narrative paragraphs that mention other dishes/concepts incidentally
 *       (e.g. "كل الكبب بالمرق أو اللبن الكبة فيها موحدة")
 *
 *   When a user with a yogurt allergy searches "لبن", showing them recipes
 *   that just MENTION yogurt in narrative text — but don't actually CONTAIN
 *   yogurt as an ingredient — is dangerous misinformation. So we strictly
 *   limit ingredient-search to bullet-prefixed lines.
 *
 *   All 81 ASK recipes use the "•" bullet convention, so this is reliable.
 */
function extractIngredientBullets(ingredientsBlock: string): string {
  if (!ingredientsBlock) return '';
  const lines = ingredientsBlock.split(/[\r\n]+/);
  const bulletLines: string[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    // Real ingredient line — starts with •, ◦, –, *, or "- "
    if (/^[•◦●○○*–\-]/.test(trimmed)) {
      bulletLines.push(trimmed);
    }
  }
  return bulletLines.join('\n');
}

/** Same as fieldContains but for ingredient fields — only matches bullet lines. */
function ingredientBulletsContain(ingredientsBlock: string, normQuery: string): boolean {
  if (!ingredientsBlock) return false;
  const bullets = extractIngredientBullets(ingredientsBlock);
  if (!bullets) return false;
  const normField = normalize(bullets);
  return normField.includes(normQuery);
}

// Build category lookup
const categoriesMap: Record<string, any> = {};
(categoriesData as any[]).forEach((c) => {
  categoriesMap[c.cat_id] = c;
});

export function searchRecipes(query: string): SearchResult[] {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  const normQuery = normalize(trimmed);
  const recipes = recipesData as any[];
  const results: SearchResult[] = [];

  for (const recipe of recipes) {
    const matchFields: SearchMatchField[] = [];
    const seenTypes = new Set<string>();

    // Get category info
    const cat = categoriesMap[recipe.category_id] || {};
    const fullRecord: Record<string, string> = {
      ...recipe,
      category_name_ar: cat.name_ar || '',
      category_name_en: cat.name_en || '',
      category_name_sv: cat.name_sv || '',
    };

    // Check each searchable field
    for (const fieldName of Object.keys(FIELD_GROUPS)) {
      const value = fullRecord[fieldName];
      if (!value) continue;
      const type = FIELD_GROUPS[fieldName];

      // For ingredient fields, ONLY match against bullet-prefixed lines
      // (real ingredients) — never against narrative text mixed in. This
      // prevents false positives like "لبن" matching recipes that mention
      // yogurt only as a related-dish reference.
      const matched = (type === 'ingredients')
        ? ingredientBulletsContain(String(value), normQuery)
        : fieldContains(String(value), normQuery);

      if (matched) {
        if (!seenTypes.has(type)) {
          matchFields.push({ field: fieldName, type });
          seenTypes.add(type);
        }
      }
    }

    if (matchFields.length > 0) {
      results.push({
        id: recipe.id,
        name_ar: recipe.name_ar || '',
        name_en: recipe.name_en || '',
        name_sv: recipe.name_sv || '',
        image: recipe.image || '',
        category_id: recipe.category_id || '',
        category_name_ar: cat.name_ar || '',
        category_name_en: cat.name_en || '',
        category_name_sv: cat.name_sv || '',
        match_fields: matchFields,
        time_ar: recipe.time_ar || '',
        description_ar: recipe.description_ar,
        description_en: recipe.description_en,
        description_sv: recipe.description_sv,
      });
    }
  }

  // Priority sort: name match > description > ingredients > others
  const priority: Record<string, number> = {
    name: 0, description: 1, ingredients: 2, category: 3,
    instructions: 4, secrets: 5, decoration: 6, other: 7,
  };
  results.sort((a, b) => {
    const aBest = Math.min(...a.match_fields.map((m) => priority[m.type] ?? 9));
    const bBest = Math.min(...b.match_fields.map((m) => priority[m.type] ?? 9));
    if (aBest !== bBest) return aBest - bBest;
    return (a.name_ar || '').localeCompare(b.name_ar || '');
  });

  return results;
}
