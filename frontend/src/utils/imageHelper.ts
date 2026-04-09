// Backend image serving configuration with local fallback
import { Platform } from 'react-native';
import imageMap from '../data/imageMap';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const IMAGE_BASE_URL = `${API_BASE}/api/images`;

// Placeholder SVG data URI for when no image is available
const PLACEHOLDER_RECIPE = 'https://via.placeholder.com/400x300/FFD700/3A3A3A?text=ASK';
const PLACEHOLDER_CATEGORY = 'https://via.placeholder.com/300x200/FFD700/3A3A3A?text=ASK';

/**
 * Clean an image filename from the database.
 */
function cleanFilename(imagePath: string): string {
  let filename = imagePath
    .replace(/^(images\/|Images\/|bilder\/)/gi, '')
    .trim();

  const match = filename.match(/([\w.\-_]+\.(jpg|jpeg|png|gif|webp))/i);
  if (match) {
    filename = match[1];
  } else {
    const slashMatch = filename.match(/([\w.\-_]+)\/(jpg|jpeg|png|gif|webp)/i);
    if (slashMatch) {
      filename = `${slashMatch[1]}.${slashMatch[2]}`;
    } else {
      filename = filename.replace(/[^\w.\-_]/g, '').trim();
      if (filename && !filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        filename = filename + '.jpg';
      }
    }
  }
  return filename;
}

/**
 * Get image source - returns local bundled image or URL
 * For native (APK), uses local bundled images
 * For web, uses backend URL
 */
export function getImageUrl(imagePath: string | null | undefined, type: 'recipe' | 'category' = 'recipe'): string | number {
  if (!imagePath) {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }

  const filename = cleanFilename(imagePath);

  if (!filename || filename === '.jpg') {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }

  // Try local image first (for APK/native builds)
  if (imageMap[filename]) {
    return imageMap[filename];
  }

  // Fallback to backend URL (for web preview)
  if (API_BASE) {
    return `${IMAGE_BASE_URL}/${encodeURIComponent(filename)}`;
  }

  return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
}

export function getCategoryImage(category: { cover_image?: string; name_en?: string }): string | number {
  if (category.cover_image) {
    return getImageUrl(category.cover_image, 'category');
  }
  return PLACEHOLDER_CATEGORY;
}

export function getRecipeImage(recipe: { image?: string; name_en?: string }): string | number {
  if (recipe.image) {
    return getImageUrl(recipe.image, 'recipe');
  }
  return PLACEHOLDER_RECIPE;
}

/**
 * Helper to get proper Image source prop (handles both local and URL images)
 */
export function getImageSource(imageResult: string | number): any {
  if (typeof imageResult === 'number') {
    return imageResult; // Local require() result
  }
  return { uri: imageResult }; // URL string
}
