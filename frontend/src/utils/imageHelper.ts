// Google Drive folder ID
const GDRIVE_FOLDER_ID = '1s45Hum24BsF1OdQxCbeGugI8sNxTeR_D';

// Map of known image filenames to their Google Drive file IDs
// This will be populated with actual file IDs
const IMAGE_MAP: Record<string, string> = {};

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/FFD700/1A1A1A?text=Recipe';

// Category placeholder with food icon
const CATEGORY_PLACEHOLDER = 'https://via.placeholder.com/300x200/FFFFF0/FFD700?text=Category';

export function getImageUrl(imagePath: string | null | undefined, type: 'recipe' | 'category' = 'recipe'): string {
  if (!imagePath) {
    return type === 'category' ? CATEGORY_PLACEHOLDER : PLACEHOLDER_IMAGE;
  }
  
  // Clean the filename
  const filename = imagePath
    .replace(/^(images\/|Images\/|bilder\/)/i, '')
    .trim();
  
  if (!filename) {
    return type === 'category' ? CATEGORY_PLACEHOLDER : PLACEHOLDER_IMAGE;
  }
  
  // Check if we have a mapped file ID
  if (IMAGE_MAP[filename]) {
    return `https://drive.google.com/uc?export=view&id=${IMAGE_MAP[filename]}`;
  }
  
  // For now, use placeholder with the recipe/category name
  const encodedName = encodeURIComponent(filename.replace(/\.[^/.]+$/, ''));
  if (type === 'category') {
    return `https://via.placeholder.com/300x200/FFFFF0/DAA520?text=${encodedName}`;
  }
  return `https://via.placeholder.com/300x200/FFD700/1A1A1A?text=${encodedName}`;
}

export function getCategoryImage(category: { cover_image?: string; name_en?: string }): string {
  if (category.cover_image) {
    return getImageUrl(category.cover_image, 'category');
  }
  const name = encodeURIComponent(category.name_en || 'Category');
  return `https://via.placeholder.com/300x200/FFFFF0/DAA520?text=${name}`;
}

export function getRecipeImage(recipe: { image?: string; name_en?: string }): string {
  if (recipe.image) {
    return getImageUrl(recipe.image, 'recipe');
  }
  const name = encodeURIComponent(recipe.name_en || 'Recipe');
  return `https://via.placeholder.com/300x200/FFD700/1A1A1A?text=${name}`;
}
