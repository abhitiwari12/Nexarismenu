import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db, User } from './src/server/db.js';

// Lazy initializer for Gemini API client
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const JWT_SECRET = process.env.JWT_SECRET || 'nexaris_super_secret_jwt_key_2026';
const PORT = 3000;

// Dynamic Cashfree Gateway Config Store
const CASHFREE_CONFIG_FILE = path.join(process.cwd(), 'data', 'cashfree_config.json');

const initialSecret = process.env.CASHFREE_SECRET_KEY || '';
const initialEnv = process.env.CASHFREE_ENVIRONMENT 
  ? process.env.CASHFREE_ENVIRONMENT.toUpperCase() 
  : (initialSecret.includes('_prod_') || initialSecret.includes('_pr_') ? 'PRODUCTION' : 'TEST');

let dynamicCashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID || '',
  secretKey: initialSecret,
  environment: initialEnv,
};

function loadCashfreeConfigFile() {
  try {
    if (fs.existsSync(CASHFREE_CONFIG_FILE)) {
      const raw = fs.readFileSync(CASHFREE_CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      if (saved.appId) dynamicCashfreeConfig.appId = saved.appId;
      if (saved.secretKey) dynamicCashfreeConfig.secretKey = saved.secretKey;
      if (saved.environment) dynamicCashfreeConfig.environment = saved.environment;
    }
  } catch (err) {
    console.error('Failed reading cashfree_config.json:', err);
  }
}

function saveCashfreeConfigFile() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CASHFREE_CONFIG_FILE, JSON.stringify(dynamicCashfreeConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing cashfree_config.json:', err);
  }
}

// Load saved Cashfree config on startup
loadCashfreeConfigFile();

function getActiveCashfreeKeys() {
  const appId = dynamicCashfreeConfig.appId || process.env.CASHFREE_APP_ID;
  const secretKey = dynamicCashfreeConfig.secretKey || process.env.CASHFREE_SECRET_KEY;
  let envMode = dynamicCashfreeConfig.environment;
  if (!envMode) {
    envMode = process.env.CASHFREE_ENVIRONMENT 
      ? process.env.CASHFREE_ENVIRONMENT.toUpperCase() 
      : (secretKey && (secretKey.includes('_prod_') || secretKey.includes('_pr_')) ? 'PRODUCTION' : 'TEST');
  }
  return { appId, secretKey, envMode };
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Middleware interface extension
export interface AuthRequest extends Request {
  user?: User;
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User account no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your restaurant account has been suspended. Please contact platform support.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Platform Admin access only.' });
    }
    next();
  });
};

async function generateSlug(name: string): Promise<string> {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (!slug) slug = 'restaurant';

  let finalSlug = slug;
  let counter = 1;
  while (await db.findUserBySlug(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  return finalSlug;
}

// ---------------- API ROUTES ----------------

// PostgreSQL Configuration & Connection Routes
app.get('/api/db/config', async (req, res) => {
  try {
    const status = await db.getConfigStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch database configuration status.' });
  }
});

app.post('/api/db/test', async (req, res) => {
  try {
    const result = await db.testPgConnection(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error testing PostgreSQL connection.' });
  }
});

app.post('/api/db/connect', async (req, res) => {
  try {
    const result = await db.saveAndConnectPg(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error connecting to PostgreSQL database.' });
  }
});

app.post('/api/db/disconnect', async (req, res) => {
  try {
    const result = await db.disconnectPg();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to disconnect from PostgreSQL.' });
  }
});

app.post('/api/db/sync-tables', async (req, res) => {
  try {
    const result = await db.syncTablesAndData();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create and sync PostgreSQL tables.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nexaris API' });
});

// Register (with payment enforcement)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { owner_name, email, password, restaurant_name, phone, order_id, slug } = req.body;

    if (!owner_name || !email || !password || !restaurant_name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!slug || !slug.trim()) {
      return res.status(400).json({ error: 'Please enter a custom menu link (slug).' });
    }

    const sanitizedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!sanitizedSlug) {
      return res.status(400).json({ error: 'Please enter a valid menu link slug (only letters, numbers, and hyphens).' });
    }

    const existingSlugUser = await db.findUserBySlug(sanitizedSlug);
    if (existingSlugUser) {
      return res.status(400).json({ error: 'This custom menu link (slug) is already taken. Please try another one.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Determine Subscription Status & Expiration
    let subStatus = 'trial';
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 Days Free Trial

    if (order_id) {
      const { appId, secretKey, envMode } = getActiveCashfreeKeys();

      if (!appId || !secretKey) {
        return res.status(400).json({ error: 'Payment gateway is not configured. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY to accept registration payments.' });
      }

      const baseUrl = envMode === 'PRODUCTION' 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg';

      const cfResponse = await fetch(`${baseUrl}/orders/${order_id}`, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      if (!cfResponse.ok) {
        const cfError = await cfResponse.json().catch(() => ({}));
        return res.status(400).json({ error: `Payment verification failed on gateway: ${cfError.message || 'Unable to fetch order status'}` });
      }

      const cfData = await cfResponse.json();
      const isPaid = cfData.order_status === 'PAID';

      if (!isPaid) {
        return res.status(400).json({ error: `Payment not successful. Status: ${cfData.order_status || 'PENDING'}. Cannot register account.` });
      }

      subStatus = 'active';
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 Year Subscription
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newUser: User = {
      id: userId,
      restaurant_name,
      owner_name,
      email: email.toLowerCase(),
      password_hash,
      role: 'restaurant',
      status: 'active',
      slug: sanitizedSlug,
      phone: phone || '',
      address: '',
      logo_url: '',
      cover_url: '',
      created_at: new Date().toISOString(),
      subscription_status: subStatus,
      subscription_expires_at: expiresAt.toISOString(),
    };

    await db.createUser(newUser);

    // Create starter categories
    await db.createCategory({ id: `c_${Date.now()}_1`, user_id: userId, name: 'Starters', created_at: new Date().toISOString() });
    await db.createCategory({ id: `c_${Date.now()}_2`, user_id: userId, name: 'Main Course', created_at: new Date().toISOString() });
    await db.createCategory({ id: `c_${Date.now()}_3`, user_id: userId, name: 'Beverages', created_at: new Date().toISOString() });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    const { password_hash: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// Admin create restaurant
app.post('/api/admin/create-restaurant', authenticateAdmin, async (req, res) => {
  try {
    const { owner_name, email, password, restaurant_name } = req.body;

    if (!owner_name || !email || !password || !restaurant_name) {
      return res.status(400).json({ error: 'All fields (owner_name, email, password, restaurant_name) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const slug = await generateSlug(restaurant_name);

    const newUser: User = {
      id: userId,
      restaurant_name,
      owner_name,
      email: email.toLowerCase(),
      password_hash,
      role: 'restaurant',
      status: 'active',
      slug,
      phone: '',
      address: '',
      logo_url: '',
      cover_url: '',
      created_at: new Date().toISOString(),
    };

    await db.createUser(newUser);

    // Create starter categories
    await db.createCategory({ id: `c_${Date.now()}_1`, user_id: userId, name: 'Starters', created_at: new Date().toISOString() });
    await db.createCategory({ id: `c_${Date.now()}_2`, user_id: userId, name: 'Main Course', created_at: new Date().toISOString() });
    await db.createCategory({ id: `c_${Date.now()}_3`, user_id: userId, name: 'Beverages', created_at: new Date().toISOString() });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    const { password_hash: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your restaurant account has been suspended. Please contact platform support.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    const { password_hash: _, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed due to server error.' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password_hash: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Update Restaurant Profile
app.put('/api/restaurant/profile', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const { restaurant_name, owner_name, phone, address, logo_url, cover_url, slug, primary_color, secondary_color, theme_mode, font_family } = req.body;

  let newSlug = req.user.slug;
  if (slug && slug !== req.user.slug) {
    const cleanSlug = slug.toLowerCase().trim().replace(/[^\w-]/g, '');
    const existing = await db.findUserBySlug(cleanSlug);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'This URL slug is already taken by another restaurant.' });
    }
    newSlug = cleanSlug;
  }

  const updated = await db.updateUser(req.user.id, {
    restaurant_name: restaurant_name !== undefined ? restaurant_name : req.user.restaurant_name,
    owner_name: owner_name !== undefined ? owner_name : req.user.owner_name,
    phone: phone !== undefined ? phone : req.user.phone,
    address: address !== undefined ? address : req.user.address,
    logo_url: logo_url !== undefined ? logo_url : req.user.logo_url,
    cover_url: cover_url !== undefined ? cover_url : req.user.cover_url,
    slug: newSlug,
    primary_color: primary_color !== undefined ? primary_color : req.user.primary_color,
    secondary_color: secondary_color !== undefined ? secondary_color : req.user.secondary_color,
    theme_mode: theme_mode !== undefined ? theme_mode : req.user.theme_mode,
    font_family: font_family !== undefined ? font_family : req.user.font_family,
  });

  if (!updated) return res.status(404).json({ error: 'User not found' });

  const { password_hash: _, ...userWithoutPassword } = updated;
  res.json({ user: userWithoutPassword });
});

// Universal Categories & Presets API
app.get('/api/universal/categories', async (req, res) => {
  try {
    const categories = await db.getUniversalCategories();
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch universal categories' });
  }
});

app.get('/api/universal/presets', async (req, res) => {
  try {
    const { universal_category_id } = req.query;
    const presets = await db.getUniversalMenuPresets(universal_category_id as string);
    res.json({ presets });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch universal menu presets' });
  }
});

app.post('/api/universal/adopt-category', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { universal_category_id } = req.body;
  if (!universal_category_id) {
    return res.status(400).json({ error: 'universal_category_id is required' });
  }

  try {
    const category = await db.adoptUniversalCategory(req.user.id, universal_category_id);
    res.status(201).json({ category });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to adopt universal category' });
  }
});

app.post('/api/universal/adopt-preset', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { category_id, preset_id, custom_price } = req.body;
  if (!category_id || !preset_id) {
    return res.status(400).json({ error: 'category_id and preset_id are required' });
  }

  try {
    const price = custom_price !== undefined ? parseFloat(custom_price) : undefined;
    const item = await db.adoptUniversalPreset(req.user.id, category_id, preset_id, price);
    res.status(201).json({ item });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to adopt universal menu preset' });
  }
});

// Categories API
app.get('/api/categories', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const categories = await db.getCategories(req.user.id);
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  try {
    const existing = await db.findCategoryByName(req.user.id, name.trim());
    if (existing) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    const newCat = await db.createCategory({
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: req.user.id,
      name: name.trim(),
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ category: newCat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  try {
    const existing = await db.findCategoryByName(req.user.id, name.trim());
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'Another category with this name already exists.' });
    }

    const updated = await db.updateCategory(id, name.trim());
    if (!updated) return res.status(404).json({ error: 'Category not found.' });

    res.json({ category: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  try {
    const success = await db.deleteCategory(id);
    if (!success) return res.status(404).json({ error: 'Category not found.' });

    res.json({ message: 'Category deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

// Menu Items API
app.get('/api/menu-items', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const items = await db.getMenuItems(req.user.id);
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch menu items' });
  }
});

app.post('/api/menu-items', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { category_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available, calories } = req.body;

  if (!name || !name.trim() || !category_id) {
    return res.status(400).json({ error: 'Name and Category are required.' });
  }

  try {
    const existing = await db.findMenuItemByName(req.user.id, category_id, name.trim());
    if (existing) {
      return res.status(400).json({ error: 'A menu item with this name already exists in this category.' });
    }

    const newItem = await db.createMenuItem({
      id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: req.user.id,
      category_id,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price) || 0,
      image_url: image_url || '',
      is_veg: Boolean(is_veg),
      is_jain: Boolean(is_jain),
      is_no_onion_garlic: Boolean(is_no_onion_garlic),
      is_vegan: Boolean(is_vegan),
      is_bestseller: Boolean(is_bestseller),
      is_todays_special: Boolean(is_todays_special),
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      calories: calories !== undefined && calories !== null && calories !== '' ? Number(calories) : undefined,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ item: newItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create menu item' });
  }
});

app.put('/api/menu-items/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const { category_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available, calories } = req.body;

  try {
    const currentItem = await db.getMenuItemById(id);
    if (!currentItem) return res.status(404).json({ error: 'Menu item not found.' });

    const targetCategory = category_id || currentItem.category_id;
    const targetName = name !== undefined ? name.trim() : currentItem.name;

    const existing = await db.findMenuItemByName(req.user.id, targetCategory, targetName);
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'A menu item with this name already exists in this category.' });
    }

    const updated = await db.updateMenuItem(id, {
      ...(category_id && { category_id }),
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(price !== undefined && { price: Number(price) }),
      ...(image_url !== undefined && { image_url }),
      ...(is_veg !== undefined && { is_veg: Boolean(is_veg) }),
      ...(is_jain !== undefined && { is_jain: Boolean(is_jain) }),
      ...(is_no_onion_garlic !== undefined && { is_no_onion_garlic: Boolean(is_no_onion_garlic) }),
      ...(is_vegan !== undefined && { is_vegan: Boolean(is_vegan) }),
      ...(is_bestseller !== undefined && { is_bestseller: Boolean(is_bestseller) }),
      ...(is_todays_special !== undefined && { is_todays_special: Boolean(is_todays_special) }),
      ...(is_available !== undefined && { is_available: Boolean(is_available) }),
      calories: calories !== undefined ? (calories === null || calories === '' ? null as any : Number(calories)) : undefined,
    });

    if (!updated) return res.status(404).json({ error: 'Menu item not found.' });

    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update menu item' });
  }
});

app.delete('/api/menu-items/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  try {
    const success = await db.deleteMenuItem(id);
    if (!success) return res.status(404).json({ error: 'Menu item not found.' });

    res.json({ message: 'Menu item deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete menu item' });
  }
});

// AI Admin Menu Item Description & Tags Generator
app.post('/api/menu-items/generate-description', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  const { name, categoryName, isVeg, keywords, tone = 'gourmet' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Dish name is required to generate a description.' });
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are an elite Culinary Copywriter and Menu Designer. 
Your task is to write a highly compelling, mouth-watering menu description and recommend dynamic keywords/tags for a dish based on its metadata.

Input:
- Name: "${name}"
- Category: "${categoryName || 'Uncategorized'}"
- Classification: ${isVeg ? 'Vegetarian (Veg)' : 'Non-Vegetarian'}
- Special Ingredients/Keywords to include: "${keywords || 'None specified'}"
- Desired Tone: "${tone}"

Tone definitions:
- gourmet: Sophisticated, elegant, emphasizing preparation, fresh ingredients, texture, and flavor layers.
- punchy: Short, modern, bold, exciting, and direct.
- storyteller: Highlights origin, heritage, nostalgia, or chef-craftsmanship (e.g., "slow-simmered according to a secret family recipe...").
- health: Highlights nutritional value, wholesome ingredients, freshness, and light clean options.

Instructions:
1. Generate an enticing description matching the requested tone (approximately 15 to 40 words).
2. Generate 3 to 5 highly relevant culinary tags/keywords (e.g. ["Gluten-free", "Spicy", "Chef's Special", "Wood-fired", "Organic"]).
3. Ensure no placeholder text is returned. Do not reference the guidelines or AI in your output.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: "Generate description and keywords.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "The complete enticing description for the menu card."
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 to 5 matching descriptive food tags."
            }
          },
          required: ["description", "suggestedTags"]
        }
      }
    });

    const resultText = response.text || '';
    const parsedResult = JSON.parse(resultText);

    res.json(parsedResult);
  } catch (error: any) {
    console.error('AI Description Generator API Error:', error);
    res.status(500).json({ error: error.message || 'Gemini API not configured' });
  }
});

// Cloudinary Image Upload Endpoint
app.post('/api/upload/cloudinary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { image, folder = 'nexaris_menu' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data (base64 or URL) is required.' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // Use Cloudinary if configured
    if (cloudName && (uploadPreset || (apiKey && apiSecret))) {
      const timestamp = Math.floor(Date.now() / 1000);
      const formData = new URLSearchParams();
      formData.append('file', image);
      formData.append('folder', folder);

      if (uploadPreset) {
        formData.append('upload_preset', uploadPreset);
      } else if (apiKey && apiSecret) {
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        
        // Generate Cloudinary SHA-1 signature
        const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');
        formData.append('signature', signature);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Cloudinary upload API error:', data);
        return res.status(response.status).json({ error: data.error?.message || 'Cloudinary upload failed' });
      }

      return res.json({
        success: true,
        url: data.secure_url || data.url,
        public_id: data.public_id,
        provider: 'cloudinary',
      });
    }

    // Fallback: Return data URL if Cloudinary keys are not yet configured in environment
    return res.json({
      success: true,
      url: image,
      provider: 'cloudinary',
      message: 'Image uploaded. To host on Cloudinary CDN, set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in .env.',
    });
  } catch (error: any) {
    console.error('Cloudinary upload route error:', error);
    return res.status(500).json({ error: 'Image upload failed.' });
  }
});

// Subscription Sync Endpoints
app.post('/api/restaurant/subscription/renew', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const updated = await db.updateUser(req.user.id, {
      subscription_status: 'active',
      subscription_expires_at: nextYear.toISOString(),
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to renew subscription' });
  }
});

app.post('/api/restaurant/subscription/expire', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const updated = await db.updateUser(req.user.id, {
      subscription_status: 'expired',
      subscription_expires_at: yesterday.toISOString(),
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to expire subscription' });
  }
});

// QR Code Generator Endpoint
app.get('/api/qr', async (req, res) => {
  try {
    const targetUrl = (req.query.url as string) || '';
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL query parameter is required.' });
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    if (req.query.format === 'png') {
      const imgBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="menu-qr-code.png"');
      return res.send(imgBuffer);
    }

    return res.json({ qr_data_url: qrDataUrl, target_url: targetUrl });
  } catch (error: any) {
    console.error('QR code generation error:', error);
    return res.status(500).json({ error: 'Failed to generate QR code.' });
  }
});

// Public Menu Data Endpoint
app.get('/api/public/menu/:slug', async (req, res) => {
  const { slug } = req.params;
  const user = await db.findUserBySlug(slug);

  if (!user) {
    return res.status(404).json({ error: 'Restaurant not found or menu is unavailable.' });
  }

  // Check subscription status
  const now = new Date();
  const isExpired = user.subscription_status === 'expired' || 
    (user.subscription_expires_at && new Date(user.subscription_expires_at) < now);

  if (isExpired) {
    return res.status(403).json({
      error: 'This restaurant digital menu has been temporarily disabled because its subscription has ended. If you are the owner, please complete your subscription payment to reactivate it immediately.',
      subscription_expired: true,
      restaurant_id: user.id,
      restaurant_name: user.restaurant_name,
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      error: 'This restaurant menu has been suspended by the platform administrator.',
      suspended: true,
    });
  }

  const categories = await db.getCategories(user.id);
  const items = await db.getMenuItems(user.id);

  res.json({
    restaurant: {
      id: user.id,
      restaurant_name: user.restaurant_name,
      owner_name: user.owner_name,
      phone: user.phone || '',
      address: user.address || '',
      logo_url: user.logo_url || '',
      cover_url: user.cover_url || '',
      slug: user.slug,
      primary_color: user.primary_color,
      secondary_color: user.secondary_color,
      theme_mode: user.theme_mode,
      font_family: user.font_family,
    },
    categories,
    menu_items: items,
  });
});

// AI Smart Suggestions Endpoint
app.post('/api/public/menu-suggest', async (req, res) => {
  const { query, menuItems } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search/mood query is required.' });
  }

  if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
    return res.status(400).json({ error: 'Menu items are required for analysis.' });
  }

  try {
    const ai = getGeminiClient();

    // Map menu items to a smaller format to save token costs and preserve privacy
    const simplifiedMenu = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_veg: !!item.is_veg,
      is_available: !!item.is_available
    })).filter(item => item.is_available); // Recommend only available items!

    if (simplifiedMenu.length === 0) {
      return res.json({
        message: "I'd love to suggest something, but all matching dishes are currently out of stock!",
        suggestions: []
      });
    }

    const systemPrompt = `You are AI Food Finder, a friendly and highly intelligent culinary assistant for a restaurant's digital menu. 
Your goal is to parse a customer's craving, mood, dietary preference, or prompt, and match it with the best items from the restaurant's menu.

Below is the restaurant's simplified menu:
${JSON.stringify(simplifiedMenu, null, 2)}

Instructions:
1. Carefully analyze the customer's request: "${query}".
2. Select up to 4 items from the menu that match the request. If there are no good matches, select 1-2 items that are generally popular or close alternatives, and explain the connection.
3. For each selected item, write a highly descriptive, enticing, 1-sentence explanation of why it fits their prompt. Be warm, enthusiastic, and mouth-watering.
4. Calculate a realistic matching percentage (from 50% to 100%) based on how well it satisfies their specific prompt.
5. Provide a friendly introductory message summarizing your recommendations (e.g., "Here are some spicy delights that will warm you up!").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: "Match the menu items to my craving/request.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "A friendly, conversational greeting explaining why these dishes are chosen for the customer."
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemId: { type: Type.STRING, description: "The exact ID of the matching menu item" },
                  reason: { type: Type.STRING, description: "Delightful explanation of why this dish matches their request" },
                  matchPercentage: { type: Type.INTEGER, description: "Matching percentage score (50 to 100)" }
                },
                required: ["itemId", "reason", "matchPercentage"]
              }
            }
          },
          required: ["message", "suggestions"]
        }
      }
    });

    const resultText = response.text || '';
    const parsedResult = JSON.parse(resultText);

    res.json(parsedResult);
  } catch (error: any) {
    console.error('AI Suggestion API Error:', error);
    // Return a fallback friendly message if API fails or key is missing
    res.json({
      message: "AI Food Finder is currently resting, but you can explore our complete menu below! Try using our instant search bar to find exactly what you are craving.",
      suggestions: [],
      error: error.message || 'Gemini API not configured'
    });
  }
});

// ---------------- ADMIN API ROUTES ----------------

// Get Admin Overview Metrics
app.get('/api/admin/dashboard', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const stats = await db.getAdminStats();
  res.json(stats);
});

// List All Restaurants
app.get('/api/admin/restaurants', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const allRests = await db.getAllRestaurants();
  const restaurants = allRests.map(({ password_hash: _, ...rest }) => rest);
  res.json({ restaurants });
});

// Get Single Restaurant Detailed View
app.get('/api/admin/restaurants/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await db.findUserById(id);

  if (!user || user.role !== 'restaurant') {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const { password_hash: _, ...restaurant } = user;
  const categories = await db.getCategories(id);
  const items = await db.getMenuItems(id);

  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  const publicUrl = `${protocol}://${host}/#m/${user.slug}`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });
  } catch (e) {
    console.error('QR code err:', e);
  }

  res.json({
    restaurant,
    categories,
    menu_items: items,
    qr_code_url: qrCodeDataUrl,
    public_menu_url: publicUrl,
  });
});

// Update Restaurant Status (Suspend / Activate)
app.patch('/api/admin/restaurants/:id/status', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const updated = await db.updateUserStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const { password_hash: _, ...restaurant } = updated;
  res.json({ restaurant, message: `Restaurant ${status === 'active' ? 'activated' : 'suspended'} successfully.` });
});

// Delete Restaurant
app.delete('/api/admin/restaurants/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const success = await db.deleteUserAndData(id);

  if (!success) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  res.json({ message: 'Restaurant and all associated menu data deleted successfully.' });
});

// ---------------- CASHFREE PAYMENT GATEWAY API ROUTES ----------------

// Admin PG Key Management
app.get('/api/cashfree/admin-config', (req, res) => {
  const { appId, secretKey, envMode } = getActiveCashfreeKeys();
  res.json({
    appId: appId || '',
    secretKey: secretKey ? (secretKey.slice(0, 6) + '••••••••••••') : '',
    hasSecret: Boolean(secretKey),
    environment: envMode,
    configured: Boolean(appId && secretKey),
  });
});

app.post('/api/cashfree/admin-config', (req, res) => {
  const { appId, secretKey, environment } = req.body;
  if (appId !== undefined) dynamicCashfreeConfig.appId = appId.trim();
  if (secretKey && !secretKey.includes('••••')) dynamicCashfreeConfig.secretKey = secretKey.trim();
  if (environment) dynamicCashfreeConfig.environment = environment.toUpperCase();

  saveCashfreeConfigFile();

  const active = getActiveCashfreeKeys();
  res.json({
    success: true,
    message: 'Cashfree Gateway credentials updated successfully and saved to configuration file.',
    configured: Boolean(active.appId && active.secretKey),
    environment: active.envMode,
  });
});

// Get Cashfree PG Config & Status
app.get('/api/cashfree/config', (req, res) => {
  const { appId, secretKey, envMode } = getActiveCashfreeKeys();
  const isConfigured = Boolean(appId && secretKey);

  res.json({
    configured: isConfigured,
    environment: envMode,
    app_id: appId ? `${appId.slice(0, 4)}...${appId.slice(-4)}` : null,
    api_version: '2023-08-01',
    currency: 'INR',
    payment_methods: [
      'Cashfree UPI / GPay / PhonePe / Paytm / BHIM',
      'Cards (Visa, Mastercard, RuPay, Amex)',
      'NetBanking (50+ Indian Banks)',
      'Cashfree Wallets & Buy Now Pay Later',
    ],
    sdk_url: envMode === 'PRODUCTION'
      ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
      : 'https://sdk.cashfree.com/js/v3/cashfree.js',
  });
});

// Create Cashfree Payment Order
app.post('/api/cashfree/create-order', async (req, res) => {
  try {
    const {
      order_amount,
      amount,
      customer_name,
      customerName,
      customer_email,
      customerEmail,
      customer_phone,
      customerPhone,
      order_note,
      description,
    } = req.body;

    const finalAmount = order_amount ?? amount;
    const finalCustomerName = customer_name || customerName || 'Guest Gourmet';
    const finalCustomerEmail = customer_email || customerEmail || 'guest@example.com';
    const finalCustomerPhone = customer_phone || customerPhone || '9999999999';
    const finalOrderNote = order_note || description || 'Nexaris Digital Menu Order';

    if (!finalAmount || Number(finalAmount) <= 0) {
      return res.status(400).json({ error: 'Valid order amount is required.' });
    }

    const { appId, secretKey, envMode } = getActiveCashfreeKeys();

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const customerId = `cust_${Date.now()}`;

    const originHeader = req.headers.origin || req.headers.referer || `${req.protocol}://${req.get('host')}` || process.env.APP_URL || 'http://localhost:3000';
    const cleanOrigin = originHeader.replace(/\/$/, '').split('#')[0].split('?')[0];

    // If Cashfree keys are configured in .env, call Cashfree PG API v3
    if (!appId || !secretKey) {
      return res.status(400).json({
        error: 'Cashfree Payment Gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY to accept live payments.'
      });
    }

    const baseUrl = envMode === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';

    const payload = {
      order_id: orderId,
      order_amount: Number(finalAmount).toFixed(2),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: finalCustomerPhone,
      },
      order_meta: {
        return_url: `${cleanOrigin}/#order-status?order_id={order_id}`,
        notify_url: `${cleanOrigin}/api/cashfree/webhook`,
      },
      order_note: finalOrderNote,
    };

    const cfResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(payload),
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      console.warn('Cashfree API call returned error:', cfData);
      return res.status(cfResponse.status).json({
        error: cfData.message || 'Failed to initiate Cashfree payment order.'
      });
    }

    return res.json({
      success: true,
      order_id: cfData.order_id,
      payment_session_id: cfData.payment_session_id,
      order_status: cfData.order_status,
      cf_order: cfData,
      sandbox: envMode !== 'PRODUCTION',
    });
  } catch (error: any) {
    console.error('Cashfree order creation exception:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during Cashfree order creation.'
    });
  }
});

// Verify Cashfree Payment Status (POST API)
app.post('/api/cashfree/verify-order', async (req, res) => {
  try {
    const { order_id, payment_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'order_id is required' });
    }

    const { appId, secretKey, envMode } = getActiveCashfreeKeys();

    if (!appId || !secretKey) {
      return res.status(400).json({
        success: false,
        error: 'Cashfree Payment Gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY to verify live payments.'
      });
    }

    const baseUrl = envMode === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';

    const cfResponse = await fetch(`${baseUrl}/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    const cfData = await cfResponse.json();
    if (!cfResponse.ok) {
      console.warn('Cashfree verification API returned error:', cfData);
      return res.status(cfResponse.status).json({
        success: false,
        error: cfData.message || 'Payment verification failed on Cashfree.'
      });
    }

    const isPaid = cfData.order_status === 'PAID';
    return res.json({
      success: isPaid,
      order_id,
      order_status: cfData.order_status || 'PENDING',
      transaction_ref: payment_id || cfData.cf_order_id || cfData.order_id || `CF_${Date.now()}`,
      amount: cfData.order_amount || 0,
      currency: cfData.order_currency || 'INR',
      verified_at: new Date().toISOString(),
      cf_data: cfData,
    });
  } catch (error: any) {
    console.error('Cashfree verification exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during payment verification.'
    });
  }
});

// Verify Cashfree Payment Status (GET API)
app.get('/api/cashfree/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { appId, secretKey, envMode } = getActiveCashfreeKeys();

    if (!appId || !secretKey) {
      return res.status(400).json({
        error: 'Cashfree Payment Gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY to verify live payments.'
      });
    }

    const baseUrl = envMode === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';

    const cfResponse = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });

    const cfData = await cfResponse.json();
    if (!cfResponse.ok) {
      return res.status(cfResponse.status).json({
        error: cfData.message || 'Payment verification failed on Cashfree.'
      });
    }

    return res.json({
      order_id: orderId,
      order_status: cfData.order_status,
      payment_status: cfData.order_status === 'PAID' ? 'SUCCESS' : 'PENDING',
      cf_data: cfData,
    });
  } catch (error: any) {
    console.error('Cashfree verification GET exception:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during payment status verification.'
    });
  }
});

// Cashfree Webhook Handler
app.post('/api/cashfree/webhook', (req, res) => {
  console.log('Received Cashfree Webhook:', req.body);
  res.status(200).json({ status: 'OK' });
});

// ---------------- VITE & SERVING STATIC FILES ----------------

async function startServer() {
  // Ensure uploads directory exists
  const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve local uploads folder statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nexaris Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
