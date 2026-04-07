// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dwiaupvek';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Placeholder images for fallback
const PLACEHOLDER_RECIPE = 'https://via.placeholder.com/300x200/FFD700/3A3A3A?text=Recipe';
const PLACEHOLDER_CATEGORY = 'https://via.placeholder.com/300x200/FFD700/3A3A3A?text=Category';

export function getImageUrl(imagePath: string | null | undefined, type: 'recipe' | 'category' = 'recipe'): string {
  if (!imagePath) {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }
  
  // Clean the filename - remove path prefixes
  let filename = imagePath
    .replace(/^(images\/|Images\/|bilder\/)/i, '')
    .trim();
  
  if (!filename) {
    return type === 'category' ? PLACEHOLDER_CATEGORY : PLACEHOLDER_RECIPE;
  }
  
  // Remove file extension for Cloudinary (it handles it automatically)
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  // Build Cloudinary URL with optimizations
  // f_auto: automatic format selection
  // q_auto: automatic quality
  // w_400: width 400px for recipes, w_300 for categories
  const width = type === 'category' ? 300 : 400;
  
  return `${CLOUDINARY_BASE_URL}/f_auto,q_auto,w_${width}/${nameWithoutExt}`;
}

export function getCategoryImage(category: { cover_image?: string; name_en?: string }): string {
  if (category.cover_image) {
    return getImageUrl(category.cover_image, 'category');
  }
  // Fallback with category name
  const name = encodeURIComponent(category.name_en || 'Category');
  return `https://via.placeholder.com/300x200/FFD700/3A3A3A?text=${name}`;
}

export function getRecipeImage(recipe: { image?: string; name_en?: string }): string {
  if (recipe.image) {
    return getImageUrl(recipe.image, 'recipe');
  }
  // Fallback with recipe name
  const name = encodeURIComponent(recipe.name_en || 'Recipe');
  return `https://via.placeholder.com/300x200/FFD700/3A3A3A?text=${name}`;
}
