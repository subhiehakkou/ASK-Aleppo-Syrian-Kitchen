import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://aleppo-culinary-app.preview.emergentagent.com';

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

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategory = async (catId: string): Promise<Category> => {
  const response = await api.get(`/categories/${catId}`);
  return response.data;
};

// Recipes
export const getRecipes = async (categoryId?: string): Promise<Recipe[]> => {
  const params = categoryId ? { category_id: categoryId } : {};
  const response = await api.get('/recipes', { params });
  return response.data;
};

export const getRecipe = async (recipeId: string): Promise<Recipe> => {
  const response = await api.get(`/recipes/${recipeId}`);
  return response.data;
};

// About
export const getAbout = async (): Promise<AboutInfo> => {
  const response = await api.get('/about');
  return response.data;
};

// Contact
export const getContact = async () => {
  const response = await api.get('/contact');
  return response.data;
};

// Feedback
export const submitFeedback = async (feedback: Feedback): Promise<void> => {
  await api.post('/feedback', feedback);
};

export default api;
