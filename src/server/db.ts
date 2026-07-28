import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { getDemoRestaurantsData as getDemoRestaurantsDataFromModule } from './demoData';

export type UserRole = 'admin' | 'restaurant';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  slug: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  cover_url?: string;
  created_at: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  primary_color?: string;
  secondary_color?: string;
  theme_mode?: 'light' | 'dark';
  font_family?: string;
}

export interface UniversalCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface UniversalMenuPreset {
  id: string;
  universal_category_id: string;
  name: string;
  description: string;
  suggested_price: number;
  image_url: string;
  is_veg: boolean;
  is_jain?: boolean;
  is_no_onion_garlic?: boolean;
  is_vegan?: boolean;
  cuisine: string;
}

export interface Category {
  id: string;
  user_id: string;
  rest_id?: string;
  universal_category_id?: string;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  user_id: string;
  rest_id?: string;
  category_id: string;
  master_item_id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_jain?: boolean;
  is_no_onion_garlic?: boolean;
  is_vegan?: boolean;
  is_bestseller?: boolean;
  is_todays_special?: boolean;
  is_available: boolean;
  calories?: number;
  grams?: number;
  created_at: string;
}

export interface DBData {
  users: User[];
  categories: Category[];
  menu_items: MenuItem[];
  universal_categories?: UniversalCategory[];
  universal_menu_presets?: UniversalMenuPreset[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexaris_db.json');
const PG_CONFIG_FILE = path.join(DATA_DIR, 'postgres_config.json');

export interface PostgresConfigInput {
  connection_string?: string;
  host?: string;
  port?: number | string;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export const DEFAULT_UNIVERSAL_CATEGORIES: UniversalCategory[] = [
  { id: 'ucat_starters', name: 'Starters & Appetizers', description: 'Small bites, crisp salads & sharing plates to begin your meal.', icon: 'Utensils' },
  { id: 'ucat_pizzas', name: 'Wood-Fired Pizzas', description: 'Artisanal sourdough pizzas baked in high-temperature wood oven.', icon: 'Pizza' },
  { id: 'ucat_pastas', name: 'Handcrafted Pastas', description: 'Fresh house-made egg pasta with rich artisanal sauces.', icon: 'CookingPot' },
  { id: 'ucat_burgers', name: 'Artisan Burgers & Wraps', description: 'Prime beef, buttermilk chicken & plant-based burgers.', icon: 'Sandwich' },
  { id: 'ucat_salads', name: 'Fresh Bowls & Salads', description: 'Nutritious grain bowls, crisp organic greens & zesty dressings.', icon: 'Salad' },
  { id: 'ucat_tacos', name: 'Tacos & Mexican Street Food', description: 'Slow-braised meats, hand-pressed tortillas & fresh salsas.', icon: 'Flame' },
  { id: 'ucat_ramen', name: 'Ramen & Noodle Bowls', description: 'Slow-simmered 18-hour broths with fresh artisan noodles.', icon: 'Soup' },
  { id: 'ucat_sushi', name: 'Sushi, Sashimi & Rolls', description: 'Sustainably sourced fish & hand-rolled specialty maki.', icon: 'Fish' },
  { id: 'ucat_curries', name: 'Tandoori & Indian Curries', description: 'Aromatic spices, slow-cooked gravy & charcoal tandoor breads.', icon: 'Flame' },
  { id: 'ucat_desserts', name: 'Artisanal Desserts', description: 'Indulgent cakes, authentic gelatos & sweet chef specialties.', icon: 'IceCream' },
  { id: 'ucat_beverages', name: 'Craft Drinks & Juices', description: 'Cold-pressed fresh fruit juices, iced teas & artisanal sodas.', icon: 'Coffee' },
  { id: 'ucat_cocktails', name: 'Signature Cocktails & Wine', description: 'Handcrafted cocktails, mocktails & sommelier wine selection.', icon: 'Wine' },
  { id: 'ucat_breakfast', name: 'Breakfast & Brunch', description: 'Fluffy pancakes, avocado toasts, eggs benedict & pastries.', icon: 'Croissant' },
  { id: 'ucat_kids', name: 'Kid\'s Special Menu', description: 'Wholesome, delicious smaller portions for younger guests.', icon: 'Smile' },
];

export const DEFAULT_UNIVERSAL_MENU_PRESETS: UniversalMenuPreset[] = [
  // Starters
  {
    id: 'upreset_bruschetta',
    universal_category_id: 'ucat_starters',
    name: 'Artisanal Truffle Bruschetta',
    description: 'Grilled sourdough rubbed with garlic, vine-ripened tomatoes, fresh basil, and white truffle drizzle.',
    suggested_price: 12.50,
    image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    cuisine: 'Italian',
  },
  {
    id: 'upreset_calamari',
    universal_category_id: 'ucat_starters',
    name: 'Crispy Calamari Fritti',
    description: 'Lightly battered wild-caught squid with charred lemon and roasted garlic aioli.',
    suggested_price: 14.50,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Seafood',
  },
  {
    id: 'upreset_guacamole',
    universal_category_id: 'ucat_starters',
    name: 'Tableside Fresh Guacamole',
    description: 'Hass avocados mashed with lime, cilantro, jalapeno, diced red onion, served with warm blue corn chips.',
    suggested_price: 11.50,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    is_vegan: true,
    cuisine: 'Mexican',
  },
  // Pizzas
  {
    id: 'upreset_margherita',
    universal_category_id: 'ucat_pizzas',
    name: 'Classic Margherita D.O.P.',
    description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil leaves, and extra virgin olive oil.',
    suggested_price: 16.00,
    image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    cuisine: 'Italian',
  },
  {
    id: 'upreset_truffle_pizza',
    universal_category_id: 'ucat_pizzas',
    name: 'Truffle Mushroom & Fontina Pizza',
    description: 'White base with fontina, caramelized onions, wild cremini mushrooms, and black truffle oil drizzle.',
    suggested_price: 19.50,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    cuisine: 'Italian',
  },
  {
    id: 'upreset_pepperoni',
    universal_category_id: 'ucat_pizzas',
    name: 'Spicy Calabrian Pepperoni Pizza',
    description: 'Crispy cupping pepperoni, mozzarella, hot honey drizzle, and crushed Calabrian chili flakes.',
    suggested_price: 18.00,
    image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Italian',
  },
  // Pastas
  {
    id: 'upreset_bolognese',
    universal_category_id: 'ucat_pastas',
    name: 'Handcrafted Tagliatelle Bolognese',
    description: 'Slow-simmered prime beef ragù over fresh ribbon egg tagliatelle with aged Parmigiano-Reggiano.',
    suggested_price: 21.00,
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281216?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Italian',
  },
  {
    id: 'upreset_alfredo',
    universal_category_id: 'ucat_pastas',
    name: 'Fettuccine Alfredo & Pan-Seared Chicken',
    description: 'Creamy garlic parmesan cream sauce, egg fettuccine, and juicy herb-marinated chicken breast.',
    suggested_price: 19.50,
    image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Italian',
  },
  // Burgers
  {
    id: 'upreset_wagyu_burger',
    universal_category_id: 'ucat_burgers',
    name: 'Signature Wagyu Truffle Burger',
    description: 'American Wagyu beef, truffle aioli, aged sharp cheddar, caramelized onions, butter lettuce on brioche.',
    suggested_price: 18.50,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'American',
  },
  {
    id: 'upreset_fried_chicken',
    universal_category_id: 'ucat_burgers',
    name: 'Crispy Buttermilk Fried Chicken Sandwich',
    description: 'Nashville spiced fried chicken thigh, spicy mayo, tangy dill pickles, cabbage slaw on brioche.',
    suggested_price: 15.50,
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'American',
  },
  // Tacos
  {
    id: 'upreset_birria_tacos',
    universal_category_id: 'ucat_tacos',
    name: 'Slow-Cooked Birria Beef Tacos',
    description: 'Crisp corn tortillas filled with tender braised beef chuck, melted Oaxaca cheese, cilantro, consommé dip.',
    suggested_price: 15.50,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Mexican',
  },
  // Ramen
  {
    id: 'upreset_tonkotsu_ramen',
    universal_category_id: 'ucat_ramen',
    name: 'Tonkotsu Black Garlic Ramen',
    description: 'Rich 18-hour pork bone broth, black garlic oil, tender chashu pork belly, ajitama egg, bamboo shoots.',
    suggested_price: 17.50,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Japanese',
  },
  // Sushi
  {
    id: 'upreset_dragon_roll',
    universal_category_id: 'ucat_sushi',
    name: 'Dragon Eel & Avocado Roll',
    description: 'Shrimp tempura and cucumber topped with sliced barbecue eel, fresh avocado, unagi glaze, sesame.',
    suggested_price: 18.00,
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Japanese',
  },
  // Curries
  {
    id: 'upreset_butter_chicken',
    universal_category_id: 'ucat_curries',
    name: 'Old Delhi Butter Chicken',
    description: 'Tandoori marinated chicken thighs simmered in a velvety tomato, butter, cashews, fenugreek cream sauce.',
    suggested_price: 18.50,
    image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
    is_veg: false,
    cuisine: 'Indian',
  },
  {
    id: 'upreset_tikka_masala',
    universal_category_id: 'ucat_curries',
    name: 'Paneer Tikka Masala',
    description: 'Char-grilled cottage cheese cubes cooked in a vibrant spiced onion-tomato cream sauce with fresh cilantro.',
    suggested_price: 16.50,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    cuisine: 'Indian',
  },
  // Desserts
  {
    id: 'upreset_tiramisu',
    universal_category_id: 'ucat_desserts',
    name: 'Traditional Italian Tiramisu',
    description: 'Espresso-soaked ladyfinger biscuits layered with rich mascarpone cream and cocoa powder.',
    suggested_price: 9.50,
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    cuisine: 'Italian',
  },
  // Beverages
  {
    id: 'upreset_matcha_latte',
    universal_category_id: 'ucat_beverages',
    name: 'Iced Ceremonial Matcha Oat Latte',
    description: 'Kyoto ceremonial grade matcha whisked with Madagascar vanilla bean and oat milk over ice.',
    suggested_price: 6.50,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    is_veg: true,
    is_vegan: true,
    cuisine: 'Beverage',
  },
];

class DatabaseManager {
  private pool: Pool | null = null;
  private isPg: boolean = false;
  private jsonDbData: DBData = { users: [], categories: [], menu_items: [], universal_categories: DEFAULT_UNIVERSAL_CATEGORIES, universal_menu_presets: DEFAULT_UNIVERSAL_MENU_PRESETS };
  private activePgConfig: PostgresConfigInput | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Initialize JSON storage first so in-memory fallback and data directory always exist
    this.initJsonDb();

    let dbUrl: string | undefined;

    // 1. Check saved config file in /data/postgres_config.json first
    if (fs.existsSync(PG_CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(PG_CONFIG_FILE, 'utf-8');
        const saved = JSON.parse(raw) as PostgresConfigInput;
        this.activePgConfig = saved;
        dbUrl = this.buildConnectionString(saved);
      } catch (err) {
        console.error('Failed reading postgres_config.json:', err);
      }
    }

    // 2. Fall back to process.env.DATABASE_URL if saved config not present
    if (!dbUrl) {
      dbUrl = process.env.DATABASE_URL;
    }

    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      try {
        const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
        const sslSetting = this.activePgConfig?.ssl !== undefined 
          ? (this.activePgConfig.ssl ? { rejectUnauthorized: false } : false)
          : (isLocal ? false : { rejectUnauthorized: false });

        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: sslSetting,
          connectionTimeoutMillis: 5000,
        });

        // Test connection & setup schema
        await this.pool.query('SELECT 1');
        this.isPg = true;
        console.log('✅ Connected successfully to PostgreSQL');

        await this.initPgTables();
      } catch (err: any) {
        if (dbUrl.includes('railway.internal') || err?.message?.includes('EAI_AGAIN') || err?.message?.includes('ENOTFOUND')) {
          console.error('⚠️ PostgreSQL connection failed: The hostname "postgres.railway.internal" is a private Railway internal domain and cannot be accessed from outside Railway.');
          console.error('👉 Fix: Please use Railway\'s Public Domain URL (e.g., roundhouse.proxy.rlwy.net) from Railway -> PostgreSQL -> Connect -> Public Networking.');
        } else {
          console.error('⚠️ PostgreSQL connection failed, falling back to local storage:', err);
        }
        this.isPg = false;
      }
    } else {
      console.log('ℹ️ PostgreSQL credentials not detected. Using local file storage.');
    }
  }

  public buildConnectionString(config: PostgresConfigInput): string {
    if (config.connection_string && config.connection_string.trim()) {
      return config.connection_string.trim();
    }

    const host = config.host || 'localhost';
    const port = config.port || 5432;
    const dbName = config.database || 'postgres';
    const user = config.user || 'postgres';
    const password = config.password || '';
    const ssl = config.ssl ?? true;

    const encodedPass = encodeURIComponent(password);
    const sslParam = ssl ? '?sslmode=require' : '?sslmode=disable';

    return `postgresql://${user}:${encodedPass}@${host}:${port}/${dbName}${sslParam}`;
  }

  // Helper method for masking connection string password
  private maskUrl(url: string): string {
    try {
      return url.replace(/\/\/(.*):(.*)@/, (match, u, p) => `//${u}:••••••••@`);
    } catch {
      return url;
    }
  }

  private async initPgTables() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS universal_categories (
          id VARCHAR(255) PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT DEFAULT '',
          icon TEXT DEFAULT 'Utensils'
        );

        CREATE TABLE IF NOT EXISTS universal_menu_presets (
          id VARCHAR(255) PRIMARY KEY,
          universal_category_id VARCHAR(255) REFERENCES universal_categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          suggested_price NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
          image_url TEXT DEFAULT '',
          is_veg BOOLEAN DEFAULT true,
          is_jain BOOLEAN DEFAULT false,
          is_no_onion_garlic BOOLEAN DEFAULT false,
          is_vegan BOOLEAN DEFAULT false,
          cuisine TEXT DEFAULT 'General'
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          restaurant_name TEXT NOT NULL,
          owner_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'restaurant',
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          slug TEXT UNIQUE NOT NULL,
          phone TEXT DEFAULT '',
          address TEXT DEFAULT '',
          logo_url TEXT DEFAULT '',
          cover_url TEXT DEFAULT '',
          primary_color VARCHAR(50) DEFAULT '#f43f5e',
          secondary_color VARCHAR(50) DEFAULT '#fbbf24',
          theme_mode VARCHAR(50) DEFAULT 'light',
          font_family VARCHAR(100) DEFAULT 'Playfair Display',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          subscription_status VARCHAR(50) DEFAULT 'active',
          subscription_expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year')
        );

        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          universal_category_id VARCHAR(255) REFERENCES universal_categories(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS menu_items (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          category_id VARCHAR(255) REFERENCES categories(id) ON DELETE CASCADE,
          master_item_id VARCHAR(255) REFERENCES universal_menu_presets(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
          image_url TEXT DEFAULT '',
          is_veg BOOLEAN DEFAULT true,
          is_jain BOOLEAN DEFAULT false,
          is_no_onion_garlic BOOLEAN DEFAULT false,
          is_vegan BOOLEAN DEFAULT false,
          is_bestseller BOOLEAN DEFAULT false,
          is_todays_special BOOLEAN DEFAULT false,
          is_available BOOLEAN DEFAULT true,
          calories INTEGER DEFAULT NULL,
          grams INTEGER DEFAULT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Add columns if missing in existing database instances
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year');
        ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '#f43f5e';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50) DEFAULT '#fbbf24';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(50) DEFAULT 'light';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Playfair Display';
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS universal_category_id VARCHAR(255);
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS master_item_id VARCHAR(255);
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_jain BOOLEAN DEFAULT false;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_no_onion_garlic BOOLEAN DEFAULT false;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT false;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_todays_special BOOLEAN DEFAULT false;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT NULL;
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS grams INTEGER DEFAULT NULL;
        ALTER TABLE universal_menu_presets ADD COLUMN IF NOT EXISTS is_jain BOOLEAN DEFAULT false;
        ALTER TABLE universal_menu_presets ADD COLUMN IF NOT EXISTS is_no_onion_garlic BOOLEAN DEFAULT false;
        ALTER TABLE universal_menu_presets ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT false;

        UPDATE menu_items SET is_jain = false WHERE is_jain IS NULL;
        UPDATE menu_items SET is_no_onion_garlic = false WHERE is_no_onion_garlic IS NULL;
        UPDATE menu_items SET is_vegan = false WHERE is_vegan IS NULL;
        UPDATE menu_items SET is_bestseller = false WHERE is_bestseller IS NULL;
        UPDATE menu_items SET is_todays_special = false WHERE is_todays_special IS NULL;
        UPDATE universal_menu_presets SET is_jain = false WHERE is_jain IS NULL;
        UPDATE universal_menu_presets SET is_no_onion_garlic = false WHERE is_no_onion_garlic IS NULL;
        UPDATE universal_menu_presets SET is_vegan = false WHERE is_vegan IS NULL;

        -- Delete duplicate categories prior to index creation if any exist
        DELETE FROM categories c1
        USING categories c2
        WHERE c1.id > c2.id 
          AND c1.user_id = c2.user_id 
          AND LOWER(TRIM(c1.name)) = LOWER(TRIM(c2.name));

        -- Delete duplicate menu items prior to index creation if any exist
        DELETE FROM menu_items m1
        USING menu_items m2
        WHERE m1.id > m2.id 
          AND m1.user_id = m2.user_id 
          AND m1.category_id = m2.category_id 
          AND LOWER(TRIM(m1.name)) = LOWER(TRIM(m2.name));

        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug_lower ON users (LOWER(slug));
        CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_lower ON categories (user_id, LOWER(TRIM(name)));
        CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_user_cat_name_lower ON menu_items (user_id, category_id, LOWER(TRIM(name)));
      `);

      // Seed universal categories and presets if empty
      await this.seedPgUniversalPresets();

      // Seed or update admin & demo defaults in PostgreSQL
      await this.seedPgDefaults();
    } catch (err) {
      console.error('Error initializing PostgreSQL tables:', err);
    }
  }

  private async seedPgUniversalPresets() {
    if (!this.pool) return;
    try {
      for (const ucat of DEFAULT_UNIVERSAL_CATEGORIES) {
        await this.pool.query(
          `INSERT INTO universal_categories (id, name, description, icon)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon`,
          [ucat.id, ucat.name, ucat.description, ucat.icon || 'Utensils']
        );
      }

      for (const rawPreset of DEFAULT_UNIVERSAL_MENU_PRESETS) {
        const preset = rawPreset as any;
        await this.pool.query(
          `INSERT INTO universal_menu_presets (id, universal_category_id, name, description, suggested_price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, cuisine)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             universal_category_id = EXCLUDED.universal_category_id,
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             suggested_price = EXCLUDED.suggested_price,
             image_url = EXCLUDED.image_url,
             is_veg = EXCLUDED.is_veg,
             is_jain = EXCLUDED.is_jain,
             is_no_onion_garlic = EXCLUDED.is_no_onion_garlic,
             is_vegan = EXCLUDED.is_vegan,
             cuisine = EXCLUDED.cuisine`,
          [preset.id, preset.universal_category_id, preset.name, preset.description, preset.suggested_price, preset.image_url, preset.is_veg, preset.is_jain || false, preset.is_no_onion_garlic || false, preset.is_vegan || false, preset.cuisine || 'General']
        );
      }
    } catch (err) {
      console.error('Error seeding PG Universal Presets:', err);
    }
  }

  private async seedPgDefaults() {
    if (!this.pool) return;
    const adminPasswordHash = bcrypt.hashSync('@bhiNTiwari1211', 10);
    const demoPasswordHash = bcrypt.hashSync('password123', 10);

    const adminUser = {
      id: 'u_admin_platform_owner',
      restaurant_name: 'Nexaris HQ Admin',
      owner_name: 'Platform Owner',
      email: 'admin@nexarismenu.online',
      password_hash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      slug: 'nexaris-admin',
      phone: '+1 (800) 555-0199',
      address: 'Nexaris Platform Headquarters, San Francisco, CA',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      cover_url: '',
    };

    await this.pool.query(
      `INSERT INTO users (id, restaurant_name, owner_name, email, password_hash, role, status, slug, phone, address, logo_url, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email`,
      [adminUser.id, adminUser.restaurant_name, adminUser.owner_name, adminUser.email, adminUser.password_hash, adminUser.role, adminUser.status, adminUser.slug, adminUser.phone, adminUser.address, adminUser.logo_url, adminUser.cover_url]
    );

    // Also explicitly ensure password_hash is updated for any existing admin email in Postgres
    await this.pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = 'admin@nexarismenu.online' OR email = 'admin@nexaris.com' OR id = 'u_admin_platform_owner'`,
      [adminPasswordHash]
    );

    const demoRestaurants = getDemoRestaurantsData(demoPasswordHash);

    for (const rest of demoRestaurants) {
      await this.pool.query(
        `INSERT INTO users (id, restaurant_name, owner_name, email, password_hash, role, status, slug, phone, address, logo_url, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [rest.user.id, rest.user.restaurant_name, rest.user.owner_name, rest.user.email, rest.user.password_hash, rest.user.role, rest.user.status, rest.user.slug, rest.user.phone, rest.user.address, rest.user.logo_url, rest.user.cover_url]
      );

      for (const cat of rest.categories) {
        await this.pool.query(
          `INSERT INTO categories (id, user_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [cat.id, rest.user.id, cat.name]
        );
      }

      for (const rawItem of rest.items) {
        const item = rawItem as any;
        await this.pool.query(
          `INSERT INTO menu_items (id, user_id, category_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, rest.user.id, item.category_id, item.name, item.description, item.price, item.image_url, item.is_veg, item.is_jain || false, item.is_no_onion_garlic || false, item.is_vegan || false, item.is_bestseller || false, item.is_todays_special || false, item.is_available]
        );
      }
    }
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('⚠️ Failed creating DATA_DIR:', err);
    }
  }

  private initJsonDb() {
    this.ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.jsonDbData = JSON.parse(raw);
        this.ensureDemoDataInJson();
        this.cleanupJsonDuplicates();
        this.saveJsonDb();
      } catch {
        this.jsonDbData = this.getJsonDefaults();
        this.saveJsonDb();
      }
    } else {
      this.jsonDbData = this.getJsonDefaults();
      this.saveJsonDb();
    }
  }

  private ensureDemoDataInJson() {
    if (!this.jsonDbData) return;
    const defaults = this.getJsonDefaults();

    // Ensure all demo users exist
    for (const u of defaults.users) {
      if (!this.jsonDbData.users.some(existing => existing.id === u.id || existing.slug === u.slug)) {
        this.jsonDbData.users.push(u);
      }
    }

    // Ensure all demo categories exist
    for (const c of defaults.categories) {
      if (!this.jsonDbData.categories.some(existing => existing.id === c.id)) {
        this.jsonDbData.categories.push(c);
      }
    }

    // Ensure all demo menu items exist
    for (const item of defaults.menu_items) {
      if (!this.jsonDbData.menu_items.some(existing => existing.id === item.id)) {
        this.jsonDbData.menu_items.push(item);
      }
    }
  }

  private cleanupJsonDuplicates() {
    if (!this.jsonDbData) return;

    // Deduplicate users by email & id
    const seenEmails = new Set<string>();
    const seenUserIds = new Set<string>();
    const cleanUsers: User[] = [];

    for (const u of this.jsonDbData.users || []) {
      const emailLower = (u.email || '').toLowerCase().trim();
      if (!seenEmails.has(emailLower) && !seenUserIds.has(u.id)) {
        seenEmails.add(emailLower);
        seenUserIds.add(u.id);
        cleanUsers.push(u);
      }
    }
    this.jsonDbData.users = cleanUsers;

    // Deduplicate categories by user_id + name
    const seenCats = new Set<string>();
    const cleanCats: Category[] = [];

    for (const c of this.jsonDbData.categories || []) {
      const key = `${c.user_id}_${(c.name || '').toLowerCase().trim()}`;
      if (!seenCats.has(key)) {
        seenCats.add(key);
        cleanCats.push(c);
      }
    }
    this.jsonDbData.categories = cleanCats;

    // Deduplicate menu items by user_id + category_id + name
    const seenItems = new Set<string>();
    const cleanItems: MenuItem[] = [];

    for (const i of this.jsonDbData.menu_items || []) {
      const key = `${i.user_id}_${i.category_id}_${(i.name || '').toLowerCase().trim()}`;
      if (!seenItems.has(key)) {
        seenItems.add(key);
        cleanItems.push(i);
      }
    }
    this.jsonDbData.menu_items = cleanItems;
  }

  private saveJsonDb() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.jsonDbData, null, 2), 'utf-8');
    } catch (err) {
      console.error('⚠️ Could not write to DB_FILE (continuing with in-memory data):', err);
    }
  }

  private getJsonDefaults(): DBData {
    const adminPasswordHash = bcrypt.hashSync('@bhiNTiwari1211', 10);
    const demoPasswordHash = bcrypt.hashSync('password123', 10);

    const users: User[] = [
      {
        id: 'u_admin_platform_owner',
        restaurant_name: 'Nexaris HQ Admin',
        owner_name: 'Platform Owner',
        email: 'admin@nexarismenu.online',
        password_hash: adminPasswordHash,
        role: 'admin',
        status: 'active',
        slug: 'nexaris-admin',
        phone: '+1 (800) 555-0199',
        address: 'Nexaris Platform Headquarters, San Francisco, CA',
        logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        cover_url: '',
        created_at: new Date().toISOString(),
      }
    ];

    const categories: Category[] = [];
    const menu_items: MenuItem[] = [];

    const demoRestaurants = getDemoRestaurantsData(demoPasswordHash);

    for (const rest of demoRestaurants) {
      users.push({
        ...rest.user,
        created_at: new Date().toISOString(),
      });

      for (const cat of rest.categories) {
        categories.push({
          id: cat.id,
          user_id: rest.user.id,
          name: cat.name,
          created_at: new Date().toISOString(),
        });
      }

      for (const item of rest.items) {
        menu_items.push({
          ...item,
          user_id: rest.user.id,
          created_at: new Date().toISOString(),
        });
      }
    }

    return { users, categories, menu_items };
  }

  // --- PUBLIC API METHODS (ASYNC COMPATIBLE) ---

  async ensureDemoUserSeeded(slug: string): Promise<void> {
    const demoPasswordHash = bcrypt.hashSync('password123', 10);
    const demoRestaurants = getDemoRestaurantsData(demoPasswordHash);
    const rest = demoRestaurants.find(r => r.user.slug.toLowerCase() === slug.toLowerCase());
    if (!rest) return;

    const slugLower = slug.toLowerCase();
    let primary = '#f43f5e'; // rose-500
    let secondary = '#fbbf24'; // amber-400
    let mode: 'light' | 'dark' = 'light';
    let font = 'Playfair Display';

    if (slugLower === 'velvet-bean') {
      primary = '#7c2d12'; // brown coffee amber-900
      secondary = '#eab308'; // yellow-500
      font = 'Poppins';
    } else if (slugLower === 'grand-pavilion') {
      primary = '#1e3a8a'; // dark royal blue
      secondary = '#ca8a04'; // gold
      font = 'Playfair Display';
    } else if (slugLower === 'lambroisie') {
      primary = '#881337'; // deep burgundy
      secondary = '#f59e0b'; // amber-500
      font = 'Lora';
    } else if (slugLower === 'bella-italia') {
      primary = '#dc2626'; // red-600
      secondary = '#16a34a'; // green-600
      font = 'Montserrat';
    } else if (slugLower === 'dakshin-bhavan') {
      primary = '#047857'; // emerald-700
      secondary = '#eab308'; // yellow-500
      font = 'Poppins';
    } else if (slugLower === 'charni-road-chaat') {
      primary = '#ea580c'; // orange-600
      secondary = '#16a34a'; // green-600
      font = 'Montserrat';
    } else if (slugLower === 'golden-dragon') {
      primary = '#991b1b'; // red-800
      secondary = '#eab308'; // yellow-500
      font = 'Playfair Display';
    } else if (slugLower === 'sweet-surrender') {
      primary = '#db2777'; // pink-600
      secondary = '#2563eb'; // blue-600
      font = 'Montserrat';
    }

    if (this.isPg && this.pool) {
      try {
        // Insert user
        await this.pool.query(
          `INSERT INTO users (id, restaurant_name, owner_name, email, password_hash, role, status, slug, phone, address, logo_url, cover_url, primary_color, secondary_color, theme_mode, font_family)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO UPDATE SET
             restaurant_name = EXCLUDED.restaurant_name,
             owner_name = EXCLUDED.owner_name,
             slug = EXCLUDED.slug,
             phone = EXCLUDED.phone,
             address = EXCLUDED.address,
             logo_url = EXCLUDED.logo_url,
             cover_url = EXCLUDED.cover_url,
             primary_color = EXCLUDED.primary_color,
             secondary_color = EXCLUDED.secondary_color,
             theme_mode = EXCLUDED.theme_mode,
             font_family = EXCLUDED.font_family`,
          [rest.user.id, rest.user.restaurant_name, rest.user.owner_name, rest.user.email, rest.user.password_hash, rest.user.role, rest.user.status, rest.user.slug, rest.user.phone, rest.user.address, rest.user.logo_url, rest.user.cover_url, primary, secondary, mode, font]
        );

        // Insert categories
        for (const cat of rest.categories) {
          await this.pool.query(
            `INSERT INTO categories (id, user_id, name)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO NOTHING`,
            [cat.id, rest.user.id, cat.name]
          );
        }

        // Insert items
        for (const rawItem of rest.items) {
          const item = rawItem as any;
          await this.pool.query(
            `INSERT INTO menu_items (id, user_id, category_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               price = EXCLUDED.price,
               image_url = EXCLUDED.image_url,
               is_veg = EXCLUDED.is_veg,
               is_jain = EXCLUDED.is_jain,
               is_no_onion_garlic = EXCLUDED.is_no_onion_garlic,
               is_vegan = EXCLUDED.is_vegan,
               is_bestseller = EXCLUDED.is_bestseller,
               is_todays_special = EXCLUDED.is_todays_special,
               is_available = EXCLUDED.is_available`,
            [item.id, rest.user.id, item.category_id, item.name, item.description, item.price, item.image_url, item.is_veg, item.is_jain || false, item.is_no_onion_garlic || false, item.is_vegan || false, item.is_bestseller || false, item.is_todays_special || false, item.is_available]
          );
        }
      } catch (err) {
        console.error('Failed to seed demo restaurant in PostgreSQL:', err);
      }
    }

    // Also check JSON database
    const hasUser = this.jsonDbData.users.some(u => u.slug.toLowerCase() === slug.toLowerCase());
    if (!hasUser) {
      this.jsonDbData.users.push({
        ...rest.user,
        primary_color: primary,
        secondary_color: secondary,
        theme_mode: mode,
        font_family: font,
        created_at: new Date().toISOString(),
      });
    }

    for (const cat of rest.categories) {
      if (!this.jsonDbData.categories.some(c => c.id === cat.id)) {
        this.jsonDbData.categories.push({
          id: cat.id,
          user_id: rest.user.id,
          name: cat.name,
          created_at: new Date().toISOString(),
        });
      }
    }

    for (const item of rest.items) {
      if (!this.jsonDbData.menu_items.some(i => i.id === item.id)) {
        this.jsonDbData.menu_items.push({
          ...item,
          user_id: rest.user.id,
          created_at: new Date().toISOString(),
        });
      }
    }
    this.saveJsonDb();
  }

  // Users
  async findUserByEmail(email: string): Promise<User | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0];
    }
    return this.jsonDbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string): Promise<User | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0];
    }
    return this.jsonDbData.users.find(u => u.id === id);
  }

  async findUserBySlug(slug: string): Promise<User | undefined> {
    const demoSlugs = [
      'velvet-bean',
      'grand-pavilion',
      'lambroisie',
      'bella-italia',
      'dakshin-bhavan',
      'charni-road-chaat',
      'golden-dragon',
      'sweet-surrender'
    ];
    if (demoSlugs.includes(slug.toLowerCase())) {
      await this.ensureDemoUserSeeded(slug);
    }
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE LOWER(slug) = LOWER($1)', [slug]);
      return res.rows[0];
    }
    return this.jsonDbData.users.find(u => u.slug.toLowerCase() === slug.toLowerCase());
  }

  async createUser(user: User): Promise<User> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO users (id, restaurant_name, owner_name, email, password_hash, role, status, slug, phone, address, logo_url, cover_url, subscription_status, subscription_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           restaurant_name = EXCLUDED.restaurant_name,
           owner_name = EXCLUDED.owner_name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           slug = EXCLUDED.slug,
           phone = EXCLUDED.phone,
           address = EXCLUDED.address,
           logo_url = EXCLUDED.logo_url,
           cover_url = EXCLUDED.cover_url,
           subscription_status = EXCLUDED.subscription_status,
           subscription_expires_at = EXCLUDED.subscription_expires_at`,
        [
          user.id,
          user.restaurant_name,
          user.owner_name,
          user.email,
          user.password_hash,
          user.role || 'restaurant',
          user.status || 'active',
          user.slug,
          user.phone || '',
          user.address || '',
          user.logo_url || '',
          user.cover_url || '',
          user.subscription_status || 'active',
          user.subscription_expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        ]
      );
    }
    const idx = this.jsonDbData.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.jsonDbData.users[idx] = user;
    } else {
      this.jsonDbData.users.push(user);
    }
    this.saveJsonDb();
    return user;
  }

  async updateUser(id: string, updateData: Partial<Omit<User, 'id' | 'email' | 'password_hash' | 'created_at'>>): Promise<User | undefined> {
    let pgUpdated: User | undefined;
    if (this.isPg && this.pool) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updateData)) {
        if (val !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const res = await this.pool.query(query, values);
        pgUpdated = res.rows[0];
      }
    }

    const user = this.jsonDbData.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updateData);
      this.saveJsonDb();
    }
    return pgUpdated || user;
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
      return res.rows;
    }
    return this.jsonDbData.categories.filter(c => c.user_id === userId);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      return res.rows[0];
    }
    return this.jsonDbData.categories.find(c => c.id === id);
  }

  async findCategoryByName(userId: string, name: string): Promise<Category | undefined> {
    const cleanName = name.trim().toLowerCase();
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT * FROM categories WHERE user_id = $1 AND LOWER(TRIM(name)) = $2',
          [userId, cleanName]
        );
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        console.error('PG findCategoryByName error:', err);
      }
    }
    return this.jsonDbData.categories.find(
      c => c.user_id === userId && (c.name || '').trim().toLowerCase() === cleanName
    );
  }

  // Universal Categories & Presets
  async getUniversalCategories(): Promise<UniversalCategory[]> {
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM universal_categories ORDER BY name ASC');
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        console.error('PG getUniversalCategories error:', err);
      }
    }
    return this.jsonDbData.universal_categories || DEFAULT_UNIVERSAL_CATEGORIES;
  }

  async getUniversalMenuPresets(universalCategoryId?: string): Promise<UniversalMenuPreset[]> {
    if (this.isPg && this.pool) {
      try {
        if (universalCategoryId) {
          const res = await this.pool.query('SELECT * FROM universal_menu_presets WHERE universal_category_id = $1 ORDER BY name ASC', [universalCategoryId]);
          return res.rows.map(r => ({ ...r, suggested_price: parseFloat(r.suggested_price) }));
        }
        const res = await this.pool.query('SELECT * FROM universal_menu_presets ORDER BY name ASC');
        return res.rows.map(r => ({ ...r, suggested_price: parseFloat(r.suggested_price) }));
      } catch (err) {
        console.error('PG getUniversalMenuPresets error:', err);
      }
    }
    const presets = this.jsonDbData.universal_menu_presets || DEFAULT_UNIVERSAL_MENU_PRESETS;
    if (universalCategoryId) {
      return presets.filter(p => p.universal_category_id === universalCategoryId);
    }
    return presets;
  }

  async adoptUniversalCategory(userId: string, universalCategoryId: string): Promise<Category> {
    const universalCats = await this.getUniversalCategories();
    const ucat = universalCats.find(c => c.id === universalCategoryId);
    if (!ucat) {
      throw new Error('Universal category not found');
    }

    const existing = await this.findCategoryByName(userId, ucat.name);
    if (existing) {
      return existing;
    }

    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      rest_id: userId,
      universal_category_id: ucat.id,
      name: ucat.name,
      created_at: new Date().toISOString(),
    };

    if (this.isPg && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO categories (id, user_id, universal_category_id, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
          [newCat.id, newCat.user_id, newCat.universal_category_id, newCat.name]
        );
      } catch (err) {
        console.error('PG adoptUniversalCategory error:', err);
      }
    }

    this.jsonDbData.categories.push(newCat);
    this.saveJsonDb();

    return newCat;
  }

  async adoptUniversalPreset(userId: string, categoryId: string, presetId: string, customPrice?: number): Promise<MenuItem> {
    const presets = await this.getUniversalMenuPresets();
    const preset = presets.find(p => p.id === presetId) as any;
    if (!preset) {
      throw new Error('Universal preset item not found');
    }

    const price = customPrice !== undefined && !isNaN(customPrice) && customPrice >= 0 
      ? customPrice 
      : preset.suggested_price;

    const newItem: any = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      rest_id: userId,
      category_id: categoryId,
      master_item_id: preset.id,
      name: preset.name,
      description: preset.description,
      price: price,
      image_url: preset.image_url,
      is_veg: preset.is_veg,
      is_jain: preset.is_jain || false,
      is_no_onion_garlic: preset.is_no_onion_garlic || false,
      is_vegan: preset.is_vegan || false,
      is_available: true,
      created_at: new Date().toISOString(),
    };

    if (this.isPg && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO menu_items (id, user_id, category_id, master_item_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING`,
          [newItem.id, newItem.user_id, newItem.category_id, newItem.master_item_id, newItem.name, newItem.description, newItem.price, newItem.image_url, newItem.is_veg, newItem.is_jain, newItem.is_no_onion_garlic, newItem.is_vegan, newItem.is_bestseller || false, newItem.is_todays_special || false, newItem.is_available]
        );
      } catch (err) {
        console.error('PG adoptUniversalPreset error:', err);
      }
    }

    this.jsonDbData.menu_items.push(newItem);
    this.saveJsonDb();

    return newItem;
  }

  async createCategory(category: Category): Promise<Category> {
    const existing = await this.findCategoryByName(category.user_id, category.name);
    if (existing) {
      return existing; // Return existing to prevent duplicate entry
    }

    const cleanCat = { ...category, name: category.name.trim(), rest_id: category.user_id };

    if (this.isPg && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO categories (id, user_id, universal_category_id, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
          [cleanCat.id, cleanCat.user_id, cleanCat.universal_category_id || null, cleanCat.name]
        );
      } catch (err) {
        console.error('PG createCategory error:', err);
      }
    }

    if (!this.jsonDbData.categories.some(c => c.id === cleanCat.id)) {
      this.jsonDbData.categories.push(cleanCat);
      this.saveJsonDb();
    }

    return cleanCat;
  }

  async updateCategory(id: string, name: string): Promise<Category | undefined> {
    const cleanName = name.trim();
    let pgUpdated: Category | undefined;

    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query(
          'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
          [cleanName, id]
        );
        pgUpdated = res.rows[0];
      } catch (err) {
        console.error('PG updateCategory error:', err);
      }
    }

    const cat = this.jsonDbData.categories.find(c => c.id === id);
    if (cat) {
      cat.name = cleanName;
      this.saveJsonDb();
    }
    return pgUpdated || cat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    let deleted = false;
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
        deleted = (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('PG deleteCategory error:', err);
      }
    }

    const initialLen = this.jsonDbData.categories.length;
    this.jsonDbData.categories = this.jsonDbData.categories.filter(c => c.id !== id);
    this.jsonDbData.menu_items = this.jsonDbData.menu_items.filter(i => i.category_id !== id);
    this.saveJsonDb();

    return deleted || (this.jsonDbData.categories.length < initialLen);
  }

  // Menu Items
  async getMenuItems(userId: string): Promise<MenuItem[]> {
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM menu_items WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
        return res.rows.map(r => ({
          ...r,
          price: parseFloat(r.price),
          is_veg: Boolean(r.is_veg),
          is_jain: Boolean(r.is_jain),
          is_no_onion_garlic: Boolean(r.is_no_onion_garlic),
          is_vegan: Boolean(r.is_vegan),
          is_bestseller: Boolean(r.is_bestseller),
          is_todays_special: Boolean(r.is_todays_special)
        }));
      } catch (err) {
        console.error('PG getMenuItems error:', err);
      }
    }
    return this.jsonDbData.menu_items.filter(i => i.user_id === userId);
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (res.rows[0]) return {
          ...res.rows[0],
          price: parseFloat(res.rows[0].price),
          is_veg: Boolean(res.rows[0].is_veg),
          is_jain: Boolean(res.rows[0].is_jain),
          is_no_onion_garlic: Boolean(res.rows[0].is_no_onion_garlic),
          is_vegan: Boolean(res.rows[0].is_vegan),
          is_bestseller: Boolean(res.rows[0].is_bestseller),
          is_todays_special: Boolean(res.rows[0].is_todays_special)
        };
      } catch (err) {
        console.error('PG getMenuItemById error:', err);
      }
    }
    return this.jsonDbData.menu_items.find(i => i.id === id);
  }

  async findMenuItemByName(userId: string, categoryId: string, name: string): Promise<MenuItem | undefined> {
    const cleanName = name.trim().toLowerCase();
    if (this.isPg && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT * FROM menu_items WHERE user_id = $1 AND category_id = $2 AND LOWER(TRIM(name)) = $3',
          [userId, categoryId, cleanName]
        );
        if (res.rows[0]) return {
          ...res.rows[0],
          price: parseFloat(res.rows[0].price),
          is_veg: Boolean(res.rows[0].is_veg),
          is_jain: Boolean(res.rows[0].is_jain),
          is_no_onion_garlic: Boolean(res.rows[0].is_no_onion_garlic),
          is_vegan: Boolean(res.rows[0].is_vegan),
          is_bestseller: Boolean(res.rows[0].is_bestseller),
          is_todays_special: Boolean(res.rows[0].is_todays_special)
        };
      } catch (err) {
        console.error('PG findMenuItemByName error:', err);
      }
    }
    return this.jsonDbData.menu_items.find(
      i => i.user_id === userId && i.category_id === categoryId && (i.name || '').trim().toLowerCase() === cleanName
    );
  }

  async createMenuItem(item: MenuItem): Promise<MenuItem> {
    const existing = await this.findMenuItemByName(item.user_id, item.category_id, item.name);
    if (existing) {
      return existing; // Return existing to prevent duplicate entry
    }

    const cleanItem: MenuItem = {
      ...item,
      name: item.name.trim(),
      description: item.description ? item.description.trim() : '',
    };

    if (this.isPg && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO menu_items (id, user_id, category_id, master_item_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available, calories, grams)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             image_url = EXCLUDED.image_url,
             is_veg = EXCLUDED.is_veg,
             is_jain = EXCLUDED.is_jain,
             is_no_onion_garlic = EXCLUDED.is_no_onion_garlic,
             is_vegan = EXCLUDED.is_vegan,
             is_bestseller = EXCLUDED.is_bestseller,
             is_todays_special = EXCLUDED.is_todays_special,
             is_available = EXCLUDED.is_available,
             calories = EXCLUDED.calories,
             grams = EXCLUDED.grams`,
          [
            cleanItem.id,
            cleanItem.user_id,
            cleanItem.category_id,
            cleanItem.master_item_id || null,
            cleanItem.name,
            cleanItem.description,
            cleanItem.price,
            cleanItem.image_url || '',
            cleanItem.is_veg,
            cleanItem.is_jain || false,
            cleanItem.is_no_onion_garlic || false,
            cleanItem.is_vegan || false,
            cleanItem.is_bestseller || false,
            cleanItem.is_todays_special || false,
            cleanItem.is_available,
            cleanItem.calories !== undefined ? Number(cleanItem.calories) : null,
            cleanItem.grams !== undefined ? Number(cleanItem.grams) : null
          ]
        );
      } catch (err) {
        console.error('PG createMenuItem error:', err);
      }
    }

    if (!this.jsonDbData.menu_items.some(i => i.id === cleanItem.id)) {
      this.jsonDbData.menu_items.push(cleanItem);
      this.saveJsonDb();
    }

    return cleanItem;
  }

  async updateMenuItem(id: string, updateData: Partial<Omit<MenuItem, 'id' | 'user_id' | 'created_at'>>): Promise<MenuItem | undefined> {
    let pgUpdated: MenuItem | undefined;

    if (this.isPg && this.pool) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updateData)) {
        if (val !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const res = await this.pool.query(query, values);
        if (res.rows[0]) {
          pgUpdated = { ...res.rows[0], price: parseFloat(res.rows[0].price) };
        }
      }
    }

    const item = this.jsonDbData.menu_items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updateData);
      this.saveJsonDb();
    }
    return pgUpdated || item;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    let deleted = false;
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
      deleted = (res.rowCount ?? 0) > 0;
    }

    const initialLen = this.jsonDbData.menu_items.length;
    this.jsonDbData.menu_items = this.jsonDbData.menu_items.filter(i => i.id !== id);
    this.saveJsonDb();

    return deleted || (this.jsonDbData.menu_items.length < initialLen);
  }

  // Admin Methods
  async getAllRestaurants() {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(`
        SELECT u.*,
          (SELECT COUNT(*) FROM categories c WHERE c.user_id = u.id) as categories_count,
          (SELECT COUNT(*) FROM menu_items i WHERE i.user_id = u.id) as items_count
        FROM users u
        WHERE u.role = 'restaurant'
        ORDER BY u.created_at DESC
      `);
      return res.rows.map(r => ({
        ...r,
        categories_count: parseInt(r.categories_count, 10),
        items_count: parseInt(r.items_count, 10),
      }));
    }

    return this.jsonDbData.users
      .filter(u => u.role === 'restaurant')
      .map(u => ({
        ...u,
        categories_count: this.jsonDbData.categories.filter(c => c.user_id === u.id).length,
        items_count: this.jsonDbData.menu_items.filter(i => i.user_id === u.id).length,
      }));
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User | undefined> {
    let pgUpdated: User | undefined;
    if (this.isPg && this.pool) {
      const res = await this.pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      pgUpdated = res.rows[0];
    }
    const user = this.jsonDbData.users.find(u => u.id === id);
    if (user) {
      user.status = status;
      this.saveJsonDb();
    }
    return pgUpdated || user;
  }

  async deleteUserAndData(id: string): Promise<boolean> {
    let deleted = false;
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
      deleted = (res.rowCount ?? 0) > 0;
    }
    const userIndex = this.jsonDbData.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      this.jsonDbData.users.splice(userIndex, 1);
      this.jsonDbData.categories = this.jsonDbData.categories.filter(c => c.user_id !== id);
      this.jsonDbData.menu_items = this.jsonDbData.menu_items.filter(i => i.user_id !== id);
      this.saveJsonDb();
      deleted = true;
    }
    return deleted;
  }

  async getAdminStats() {
    if (this.isPg && this.pool) {
      const restCount = await this.pool.query("SELECT COUNT(*) FROM users WHERE role = 'restaurant'");
      const catCount = await this.pool.query("SELECT COUNT(*) FROM categories");
      const itemCount = await this.pool.query("SELECT COUNT(*) FROM menu_items");
      const todayCount = await this.pool.query("SELECT COUNT(*) FROM users WHERE role = 'restaurant' AND created_at >= CURRENT_DATE");

      return {
        total_restaurants: parseInt(restCount.rows[0].count, 10),
        total_categories: parseInt(catCount.rows[0].count, 10),
        total_menu_items: parseInt(itemCount.rows[0].count, 10),
        new_restaurants_today: parseInt(todayCount.rows[0].count, 10),
        database_engine: 'PostgreSQL (Railway)',
      };
    }

    const restaurants = this.jsonDbData.users.filter(u => u.role === 'restaurant');
    const todayStr = new Date().toISOString().split('T')[0];
    const newToday = restaurants.filter(u => u.created_at && u.created_at.startsWith(todayStr)).length;

    return {
      total_restaurants: restaurants.length,
      total_categories: this.jsonDbData.categories.length,
      total_menu_items: this.jsonDbData.menu_items.length,
      new_restaurants_today: newToday,
      database_engine: 'Local JSON File DB',
    };
  }

  // --- POSTGRES DYNAMIC CONFIGURATION & TEST METHODS ---

  async getConfigStatus() {
    let currentConnUrl = '';
    if (this.activePgConfig) {
      currentConnUrl = this.buildConnectionString(this.activePgConfig);
    } else if (process.env.DATABASE_URL) {
      currentConnUrl = process.env.DATABASE_URL;
    }

    return {
      is_pg_connected: this.isPg,
      engine: this.isPg ? 'PostgreSQL (Railway/Remote)' : 'Local JSON File DB',
      config: this.activePgConfig ? {
        connection_string: this.activePgConfig.connection_string ? this.maskUrl(this.activePgConfig.connection_string) : '',
        host: this.activePgConfig.host || '',
        port: this.activePgConfig.port || 5432,
        database: this.activePgConfig.database || '',
        user: this.activePgConfig.user || '',
        ssl: this.activePgConfig.ssl ?? true,
        has_password: Boolean(this.activePgConfig.password),
      } : null,
      masked_url: currentConnUrl ? this.maskUrl(currentConnUrl) : '',
      status: this.isPg ? 'connected' : 'disconnected',
    };
  }

  async testPgConnection(config: PostgresConfigInput): Promise<{ success: boolean; message: string; version?: string; tables_count?: number; error?: string }> {
    const connUrl = this.buildConnectionString(config);
    if (!connUrl.startsWith('postgres://') && !connUrl.startsWith('postgresql://')) {
      return { success: false, message: 'Invalid URL scheme', error: 'Invalid connection string format. Must start with postgres:// or postgresql://' };
    }

    const testPool = new Pool({
      connectionString: connUrl,
      ssl: config.ssl ?? true ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 7000,
    });

    try {
      const verRes = await testPool.query('SELECT version();');
      const tableRes = await testPool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';");
      
      const pgVersion = verRes.rows[0]?.version || 'PostgreSQL';
      const tablesCount = parseInt(tableRes.rows[0]?.count || '0', 10);

      await testPool.end();

      return {
        success: true,
        message: 'PostgreSQL connection test successful!',
        version: pgVersion,
        tables_count: tablesCount,
      };
    } catch (err: any) {
      try { await testPool.end(); } catch {}
      console.error('PostgreSQL Test Connection Error:', err);

      let errMsg = err.message || 'Failed to connect to PostgreSQL database.';
      if (connUrl.includes('railway.internal') || errMsg.includes('EAI_AGAIN') || errMsg.includes('ENOTFOUND')) {
        errMsg = 'The domain "postgres.railway.internal" is an internal Railway hostname that only works inside Railway\'s private network.\n\nTo connect from an external application, please copy the Public Connection URL from Railway (Railway Dashboard -> PostgreSQL Service -> Connect tab -> "Public Networking" / "Public Domain", e.g. postgresql://postgres:PASSWORD@roundhouse.proxy.rlwy.net:PORT/railway).';
      }

      return {
        success: false,
        message: 'Connection test failed',
        error: errMsg,
      };
    }
  }

  async saveAndConnectPg(config: PostgresConfigInput): Promise<{ success: boolean; message: string; engine: string; error?: string }> {
    // Test first
    const testRes = await this.testPgConnection(config);
    if (!testRes.success) {
      return { success: false, message: 'Connection failed', engine: 'Local JSON File DB', error: testRes.error };
    }

    // Save config
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PG_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      this.activePgConfig = config;

      const connUrl = this.buildConnectionString(config);
      process.env.DATABASE_URL = connUrl;

      // Close old pool if any
      if (this.pool) {
        try { await this.pool.end(); } catch {}
      }

      // Re-initialize active pool
      this.pool = new Pool({
        connectionString: connUrl,
        ssl: config.ssl ?? true ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 7000,
      });

      await this.pool.query('SELECT 1');
      this.isPg = true;

      // Ensure tables exist and push all records to PostgreSQL
      await this.initPgTables();
      await this.syncTablesAndData();

      return {
        success: true,
        message: 'PostgreSQL database connected and set active!',
        engine: 'PostgreSQL (Railway/Remote)',
      };
    } catch (err: any) {
      this.isPg = false;
      return {
        success: false,
        message: 'Failed to switch database engine',
        engine: 'Local JSON File DB',
        error: err.message,
      };
    }
  }

  async syncTablesAndData(): Promise<{
    success: boolean;
    message: string;
    tables: string[];
    users_count: number;
    categories_count: number;
    menu_items_count: number;
    error?: string;
  }> {
    if (!this.isPg || !this.pool) {
      return {
        success: false,
        message: 'PostgreSQL is not currently connected.',
        tables: [],
        users_count: 0,
        categories_count: 0,
        menu_items_count: 0,
        error: 'Please connect to a valid PostgreSQL database first.',
      };
    }

    try {
      // 1. Create tables & indexes if not existing
      await this.initPgTables();

      // 2. Sync all local users to PostgreSQL
      for (const u of this.jsonDbData.users) {
        await this.pool.query(
          `INSERT INTO users (id, restaurant_name, owner_name, email, password_hash, role, status, slug, phone, address, logo_url, cover_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             restaurant_name = EXCLUDED.restaurant_name,
             owner_name = EXCLUDED.owner_name,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             slug = EXCLUDED.slug,
             phone = EXCLUDED.phone,
             address = EXCLUDED.address,
             logo_url = EXCLUDED.logo_url,
             cover_url = EXCLUDED.cover_url`,
          [u.id, u.restaurant_name, u.owner_name, u.email, u.password_hash, u.role || 'restaurant', u.status || 'active', u.slug, u.phone || '', u.address || '', u.logo_url || '', u.cover_url || '']
        );
      }

      // 3. Sync all categories to PostgreSQL
      for (const c of this.jsonDbData.categories) {
        await this.pool.query(
          `INSERT INTO categories (id, user_id, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [c.id, c.user_id, (c.name || '').trim()]
        );
      }

      // 4. Sync universal presets to PostgreSQL
      for (const p of this.jsonDbData.universal_menu_presets || DEFAULT_UNIVERSAL_MENU_PRESETS) {
        await this.pool.query(
          `INSERT INTO universal_menu_presets (id, universal_category_id, name, description, suggested_price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, cuisine)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             universal_category_id = EXCLUDED.universal_category_id,
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             suggested_price = EXCLUDED.suggested_price,
             image_url = EXCLUDED.image_url,
             is_veg = EXCLUDED.is_veg,
             is_jain = EXCLUDED.is_jain,
             is_no_onion_garlic = EXCLUDED.is_no_onion_garlic,
             is_vegan = EXCLUDED.is_vegan,
             cuisine = EXCLUDED.cuisine`,
          [p.id, p.universal_category_id, p.name, p.description, p.suggested_price, p.image_url, p.is_veg, p.is_jain || false, p.is_no_onion_garlic || false, p.is_vegan || false, p.cuisine || 'General']
        );
      }

      // 5. Sync all menu items to PostgreSQL
      for (const i of this.jsonDbData.menu_items) {
        await this.pool.query(
          `INSERT INTO menu_items (id, user_id, category_id, master_item_id, name, description, price, image_url, is_veg, is_jain, is_no_onion_garlic, is_vegan, is_bestseller, is_todays_special, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             image_url = EXCLUDED.image_url,
             is_veg = EXCLUDED.is_veg,
             is_jain = EXCLUDED.is_jain,
             is_no_onion_garlic = EXCLUDED.is_no_onion_garlic,
             is_vegan = EXCLUDED.is_vegan,
             is_bestseller = EXCLUDED.is_bestseller,
             is_todays_special = EXCLUDED.is_todays_special,
             is_available = EXCLUDED.is_available`,
          [i.id, i.user_id, i.category_id, i.master_item_id || null, (i.name || '').trim(), (i.description || '').trim(), i.price, i.image_url || '', i.is_veg, i.is_jain || false, i.is_no_onion_garlic || false, i.is_vegan || false, i.is_bestseller || false, i.is_todays_special || false, i.is_available]
        );
      }

      // 6. Query counts
      const usersRes = await this.pool.query('SELECT COUNT(*) FROM users');
      const catsRes = await this.pool.query('SELECT COUNT(*) FROM categories');
      const itemsRes = await this.pool.query('SELECT COUNT(*) FROM menu_items');

      const usersCount = parseInt(usersRes.rows[0].count, 10);
      const catsCount = parseInt(catsRes.rows[0].count, 10);
      const itemsCount = parseInt(itemsRes.rows[0].count, 10);

      return {
        success: true,
        message: 'PostgreSQL tables (users, categories, menu_items) created and synchronized successfully with all data!',
        tables: ['users', 'categories', 'menu_items'],
        users_count: usersCount,
        categories_count: catsCount,
        menu_items_count: itemsCount,
      };
    } catch (err: any) {
      console.error('Failed syncing PostgreSQL tables:', err);
      return {
        success: false,
        message: 'Failed to create or synchronize PostgreSQL tables.',
        tables: [],
        users_count: 0,
        categories_count: 0,
        menu_items_count: 0,
        error: err.message || 'Database SQL execution error',
      };
    }
  }

  async disconnectPg(): Promise<{ success: boolean; message: string }> {
    if (fs.existsSync(PG_CONFIG_FILE)) {
      try { fs.unlinkSync(PG_CONFIG_FILE); } catch {}
    }
    this.activePgConfig = null;
    if (this.pool) {
      try { await this.pool.end(); } catch {}
      this.pool = null;
    }
    this.isPg = false;
    this.initJsonDb();
    return { success: true, message: 'Disconnected from PostgreSQL. Reverted to Local File DB.' };
  }
}
export const db = new DatabaseManager();

export function getDemoRestaurantsData(demoPasswordHash: string) {
  return getDemoRestaurantsDataFromModule(demoPasswordHash);
}
