// Backend image serving configuration
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://aleppo-culinary-app.preview.emergentagent.com';
const IMAGE_BASE_URL = `${API_BASE}/api/images`;

// Placeholder SVG data URI for when no image is available
const PLACEHOLDER_RECIPE = 'https://via.placeholder.com/400x300/FFD700/3A3A3A?text=ASK';
const PLACEHOLDER_CATEGORY = 'https://via.placeholder.com/300x200/FFD700/3A3A3A?text=ASK';

/**
 * Clean an image filename from the database and build a backend URL.
 * DB stores values like "Bamia.jpg", "Kebbe_Meshweyeh.jpeg", etc.
 * Some entries have corrupted data like extra characters or wrong slashes.
 */
export function getImageUrl(imagePath: string | null | undefined, type: 'recipe' | 'category' = 'recipe'): string {
  if (!imagePath) {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }

  // Clean the filename
  let filename = imagePath
    .replace(/^(images\/|Images\/|bilder\/)/gi, '') // Remove path prefixes
    .trim();

  // Try to extract a valid filename with extension
  // Match pattern: word characters, dots, dashes, underscores followed by image extension
  const match = filename.match(/([\w.\-_]+\.(jpg|jpeg|png|gif|webp))/i);
  if (match) {
    filename = match[1];
  } else {
    // Try fixing slash-based extensions like "Rez_Foul/jpg"
    const slashMatch = filename.match(/([\w.\-_]+)\/(jpg|jpeg|png|gif|webp)/i);
    if (slashMatch) {
      filename = `${slashMatch[1]}.${slashMatch[2]}`;
    } else {
      // Last resort: clean and add .jpg
      filename = filename.replace(/[^\w.\-_]/g, '').trim();
      if (filename && !filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        filename = filename + '.jpg';
      }
    }
  }

  if (!filename || filename === '.jpg') {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }

  return `${IMAGE_BASE_URL}/${encodeURIComponent(filename)}`;
}

export function getCategoryImage(category: { cover_image?: string; name_en?: string }): string {
  if (category.cover_image) {
    return getImageUrl(category.cover_image, 'category');
  }
  return PLACEHOLDER_CATEGORY;
}

export function getRecipeImage(recipe: { image?: string; name_en?: string }): string {
  if (recipe.image) {
    return getImageUrl(recipe.image, 'recipe');
  }
  return PLACEHOLDER_RECIPE;
}
