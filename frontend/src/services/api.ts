import axios from 'axios';
import Constants from 'expo-constants';

// Local data imports (bundled with the app)
import localCategories from '../data/categories.json';
import localRecipes from '../data/recipes.json';
import localAbout from '../data/about.json';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Category {
  id: string;
  cat_id: string;
  cover_image: string;
  name_ar: string;
  name_en: string;
  name_sv: string;
}

export interface Recipe {
  id: string;
  recipe_id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  name_sv: string;
  time_ar?: string;
  time_en?: string;
  time_sv?: string;
  ingredients_ar?: string;
  ingredients_en?: string;
  ingredients_sv?: string;
  instructions_ar?: string;
  instructions_en?: string;
  instructions_sv?: string;
  servings_ar?: string;
  servings_en?: string;
  servings_sv?: string;
  decoration_ar?: string;
  decoration_en?: string;
  decoration_sv?: string;
  secrets_ar?: string;
  secrets_en?: string;
  secrets_sv?: string;
  pro_tips_ar?: string;
  pro_tips_en?: string;
  pro_tips_sv?: string;
  image?: string;
}

export interface AboutInfo {
  title_ar: string;
  title_en: string;
  title_sv: string;
  slogan_ar: string;
  slogan_en: string;
  slogan_sv: string;
  about_ar: string;
  about_en: string;
  about_sv: string;
}

export interface Feedback {
  name: string;
  email: string;
  message: string;
}

// Categories - local data with API fallback
export const getCategories = async (): Promise<Category[]> => {
  try {
    if (API_BASE) {
      const response = await api.get('/categories');
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  return localCategories as Category[];
};

export const getCategory = async (catId: string): Promise<Category> => {
  try {
    if (API_BASE) {
      const response = await api.get(`/categories/${catId}`);
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  const cat = (localCategories as Category[]).find(c => c.cat_id === catId || c.id === catId);
  if (!cat) throw new Error('Category not found');
  return cat;
};

// Recipes - local data with API fallback
export const getRecipes = async (categoryId?: string): Promise<Recipe[]> => {
  try {
    if (API_BASE) {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await api.get('/recipes', { params });
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  const recipes = localRecipes as Recipe[];
  if (categoryId) {
    return recipes.filter(r => r.category_id === categoryId);
  }
  return recipes;
};

export const getRecipe = async (recipeId: string): Promise<Recipe> => {
  try {
    if (API_BASE) {
      const response = await api.get(`/recipes/${recipeId}`);
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  const recipe = (localRecipes as Recipe[]).find(r => r.id === recipeId);
  if (!recipe) throw new Error('Recipe not found');
  return recipe;
};

// About - local data with API fallback
export const getAbout = async (): Promise<AboutInfo> => {
  try {
    if (API_BASE) {
      const response = await api.get('/about');
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  return localAbout as AboutInfo;
};

// Contact
export const getContact = async () => {
  try {
    if (API_BASE) {
      const response = await api.get('/contact');
      return response.data;
    }
  } catch (e) {
    console.log('API unavailable, using local data');
  }
  return {};
};

// Feedback
export const submitFeedback = async (feedback: Feedback): Promise<void> => {
  if (API_BASE) {
    await api.post('/feedback', feedback);
  }
};

export default api;
