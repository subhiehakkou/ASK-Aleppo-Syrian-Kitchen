/**
 * reviewTracker.ts
 *
 * Tracks recipe views and decides when to show the in-app rating prompt.
 *
 * Rules:
 *   - First prompt appears after the user has VIEWED 3 distinct recipes.
 *   - If the user dismisses without rating → wait for +5 more views before re-asking.
 *   - If the user rates (any number of stars) → never auto-prompt again on this device.
 *   - There is also a manual "Support the kitchen with a review" entry in the drawer
 *     that always opens the appropriate store URL.
 *
 * Stores everything under a single AsyncStorage key for compactness.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

const STORAGE_KEY = '@ask:review_tracker_v1';

const FIRST_PROMPT_AFTER = 3;     // first prompt after 3 recipe views
const DEFER_AFTER_DISMISS = 5;    // wait 5 more views after a "later" dismiss

// Public store URLs (provided by the project owner).
export const APP_STORE_URL =
  'https://apps.apple.com/app/id6762443271';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.ask.syr';

interface TrackerState {
  /** Set of distinct recipe IDs the user has viewed (kept as array for JSON). */
  viewedIds: string[];
  /** Whether the user has already rated (any rating). Once true → never re-prompt. */
  rated: boolean;
  /** View count when the prompt was last dismissed (for defer logic). */
  lastDismissedAt: number;
}

const DEFAULT: TrackerState = {
  viewedIds: [],
  rated: false,
  lastDismissedAt: 0,
};

async function readState(): Promise<TrackerState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      viewedIds: Array.isArray(parsed.viewedIds) ? parsed.viewedIds : [],
      rated: !!parsed.rated,
      lastDismissedAt: Number(parsed.lastDismissedAt) || 0,
    };
  } catch {
    return { ...DEFAULT };
  }
}

async function writeState(s: TrackerState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/**
 * Mark a recipe as "viewed". Returns whether the rating prompt should be
 * shown right now. Call this once per recipe screen open.
 */
export async function recordRecipeView(recipeId: string): Promise<boolean> {
  if (!recipeId) return false;
  const s = await readState();
  if (!s.viewedIds.includes(recipeId)) {
    s.viewedIds.push(recipeId);
    await writeState(s);
  }
  if (s.rated) return false;

  const count = s.viewedIds.length;
  // First-time threshold
  if (count >= FIRST_PROMPT_AFTER && s.lastDismissedAt === 0) return true;
  // Defer logic — wait DEFER_AFTER_DISMISS additional views
  if (count >= s.lastDismissedAt + DEFER_AFTER_DISMISS && s.lastDismissedAt > 0) {
    return true;
  }
  return false;
}

/**
 * User dismissed the prompt without rating ("later"). Defer next ask.
 */
export async function dismissPrompt(): Promise<void> {
  const s = await readState();
  s.lastDismissedAt = s.viewedIds.length;
  await writeState(s);
}

/**
 * User submitted a star rating. Mark as rated so we never auto-prompt again.
 */
export async function markRated(): Promise<void> {
  const s = await readState();
  s.rated = true;
  await writeState(s);
}

/** Open the appropriate store page for the user's platform. */
export async function openStorePage(): Promise<boolean> {
  const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Open the email client for low-rating internal feedback. */
export async function openFeedbackEmail(
  rating: number,
  language: 'ar' | 'en' | 'sv',
  recipeName?: string
): Promise<boolean> {
  const subjects = {
    ar: `ملاحظات على تطبيق المطبخ الحلبي — ${rating}/5`,
    en: `Aleppo Syrian Kitchen feedback — ${rating}/5`,
    sv: `Aleppo Syriskt Kök feedback — ${rating}/5`,
  };
  const bodies = {
    ar: `شاركيني رأيكِ بكل صراحة لتحسين التطبيق:\n\nالتقييم: ${rating}/5 نجوم\n${
      recipeName ? `الوصفة: ${recipeName}\n` : ''
    }\nاكتبي ملاحظاتكِ هنا:\n\n`,
    en: `Please share your honest feedback to help us improve:\n\nRating: ${rating}/5 stars\n${
      recipeName ? `Recipe: ${recipeName}\n` : ''
    }\nWrite your feedback here:\n\n`,
    sv: `Dela gärna med dig av dina ärliga åsikter så att vi kan förbättra appen:\n\nBetyg: ${rating}/5 stjärnor\n${
      recipeName ? `Recept: ${recipeName}\n` : ''
    }\nSkriv dina kommentarer här:\n\n`,
  };
  const subject = encodeURIComponent(subjects[language] || subjects.ar);
  const body = encodeURIComponent(bodies[language] || bodies.ar);
  const url = `mailto:askmalmo@gmail.com?subject=${subject}&body=${body}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Force-reset (developer debug helper). */
export async function resetReviewTracker(): Promise<void> {
  await writeState({ ...DEFAULT });
}
