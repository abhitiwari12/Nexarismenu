import { User, Category, MenuItem, PublicMenuResponse, UniversalCategory, UniversalMenuPreset } from '../types';

// Universal Presets & Catalog API
export async function getUniversalCategoriesApi(): Promise<UniversalCategory[]> {
  const res = await fetch('/api/universal/categories');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch universal categories');
  return data.categories || [];
}

export async function getUniversalPresetsApi(universalCategoryId?: string): Promise<UniversalMenuPreset[]> {
  const url = universalCategoryId 
    ? `/api/universal/presets?universal_category_id=${encodeURIComponent(universalCategoryId)}`
    : '/api/universal/presets';
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch universal presets');
  return data.presets || [];
}

export async function adoptUniversalCategoryApi(universalCategoryId: string): Promise<Category> {
  const res = await fetchWithAuth('/api/universal/adopt-category', {
    method: 'POST',
    body: JSON.stringify({ universal_category_id: universalCategoryId }),
  });
  return res.category;
}

export async function adoptUniversalPresetApi(categoryId: string, presetId: string, customPrice?: number): Promise<MenuItem> {
  const res = await fetchWithAuth('/api/universal/adopt-preset', {
    method: 'POST',
    body: JSON.stringify({ category_id: categoryId, preset_id: presetId, custom_price: customPrice }),
  });
  return res.item;
}

const TOKEN_KEY = 'nexaris_jwt_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `API request failed with status ${response.status}`);
  }

  return data;
}

// Auth API
export async function registerApi(data: {
  owner_name: string;
  email: string;
  password: string;
  restaurant_name: string;
  slug: string;
  phone?: string;
  order_id?: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(res.token);
  return res;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(res.token);
  return res;
}

export async function getMeApi(): Promise<{ user: User }> {
  return fetchWithAuth('/api/auth/me');
}

export async function updateProfileApi(data: Partial<User>): Promise<{ user: User }> {
  return fetchWithAuth('/api/restaurant/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Category API
export async function getCategoriesApi(): Promise<Category[]> {
  const res = await fetchWithAuth('/api/categories');
  return res.categories;
}

export async function createCategoryApi(name: string): Promise<Category> {
  const res = await fetchWithAuth('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return res.category;
}

export async function updateCategoryApi(id: string, name: string): Promise<Category> {
  const res = await fetchWithAuth('/api/categories/' + id, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
  return res.category;
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await fetchWithAuth('/api/categories/' + id, {
    method: 'DELETE',
  });
}

// Menu Items API
export async function getMenuItemsApi(): Promise<MenuItem[]> {
  const res = await fetchWithAuth('/api/menu-items');
  return res.items;
}

export async function createMenuItemApi(data: Omit<MenuItem, 'id' | 'user_id' | 'created_at'>): Promise<MenuItem> {
  const res = await fetchWithAuth('/api/menu-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.item;
}

export async function updateMenuItemApi(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetchWithAuth('/api/menu-items/' + id, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.item;
}

export async function deleteMenuItemApi(id: string): Promise<void> {
  await fetchWithAuth('/api/menu-items/' + id, {
    method: 'DELETE',
  });
}

// Public Menu API
export async function fetchPublicMenuApi(slug: string): Promise<PublicMenuResponse> {
  const res = await fetch('/api/public/menu/' + slug);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Restaurant menu not found');
  }
  return data;
}

// PostgreSQL Database Management API
export async function getDbConfigApi(): Promise<{
  is_pg_connected: boolean;
  engine: string;
  config: any;
  masked_url: string;
  status: string;
}> {
  const res = await fetch('/api/db/config');
  return res.json();
}

export async function testDbConnectionApi(data: any): Promise<{
  success: boolean;
  message: string;
  version?: string;
  tables_count?: number;
  error?: string;
}> {
  const res = await fetch('/api/db/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function connectDbApi(data: any): Promise<{
  success: boolean;
  message: string;
  engine: string;
  error?: string;
}> {
  const res = await fetch('/api/db/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function disconnectDbApi(): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch('/api/db/disconnect', {
    method: 'POST',
  });
  return res.json();
}

export async function syncDbTablesApi(): Promise<{
  success: boolean;
  message: string;
  tables: string[];
  users_count: number;
  categories_count: number;
  menu_items_count: number;
  error?: string;
}> {
  const res = await fetch('/api/db/sync-tables', {
    method: 'POST',
  });
  return res.json();
}

// Cloudinary Image Upload Service
export async function uploadToCloudinaryApi(file: File): Promise<{ url: string; provider: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Image = reader.result as string;
        const res = await fetchWithAuth('/api/upload/cloudinary', {
          method: 'POST',
          body: JSON.stringify({ image: base64Image, folder: 'nexaris_menu_dishes' }),
        });
        resolve({ url: res.url, provider: res.provider || 'cloudinary' });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

// AI Menu Item Helpers
export async function generateAiDescriptionApi(params: {
  name: string;
  categoryName?: string;
  isVeg: boolean;
  keywords?: string;
  tone?: 'gourmet' | 'punchy' | 'storyteller' | 'health';
}): Promise<{ description: string; suggestedTags: string[] }> {
  return fetchWithAuth('/api/menu-items/generate-description', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
