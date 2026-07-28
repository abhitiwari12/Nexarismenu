export type UserRole = 'admin' | 'restaurant';
export type UserStatus = 'active' | 'suspended';

export interface SubscriptionInfo {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  planName: string;
  price: number;
  billingCycle: 'yearly';
  status: 'active' | 'trialing' | 'expired' | 'canceled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  transactionId?: string;
  updatedAt?: string;
}

export interface SubscriptionInvoice {
  id: string;
  restaurantId: string;
  restaurantName: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  planName: string;
  billingPeriod: string;
  paymentMethod: string;
  transactionRef: string;
}

export interface User {
  id: string;
  restaurantId?: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  slug: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  cover_url?: string;
  created_at?: string;
  subscription?: SubscriptionInfo;
  primary_color?: string;
  secondary_color?: string;
  theme_mode?: 'light' | 'dark';
  font_family?: string;
}

export interface Restaurant {
  id: string;
  ownerUid: string;
  restaurantName: string;
  ownerName: string;
  slug: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  customDomain?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
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
  restaurant_id?: string;
  restaurantId?: string;
  user_id: string;
  rest_id?: string;
  universal_category_id?: string;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id?: string;
  restaurantId?: string;
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

export interface PublicRestaurant {
  id: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  address: string;
  logo_url: string;
  cover_url: string;
  slug: string;
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurant;
  categories: Category[];
  menu_items: MenuItem[];
}

export interface AdminDashboardStats {
  total_restaurants: number;
  total_categories: number;
  total_menu_items: number;
  new_restaurants_today: number;
}

export interface AdminRestaurantListItem extends User {
  categories_count: number;
  items_count: number;
}

export interface AdminRestaurantDetail {
  restaurant: User;
  categories: Category[];
  menu_items: MenuItem[];
  qr_code_url: string;
  public_menu_url: string;
}

// Analytics Collections
export interface MenuViewDoc {
  id: string;
  restaurantId: string;
  slug: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export interface QrScanDoc {
  id: string;
  restaurantId: string;
  slug: string;
  timestamp: string;
  userAgent?: string;
}

// Future Expansion Collections
export interface Subscription {
  id: string;
  restaurantId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
  maxMenuItems: number;
  maxCategories: number;
}

export interface AnalyticsRecord {
  id: string;
  restaurantId: string;
  date: string;
  totalViews: number;
  totalQrScans: number;
}

export interface DomainDoc {
  id: string;
  restaurantId: string;
  domainName: string;
  verified: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: 'manager' | 'waiter' | 'kitchen';
  createdAt: string;
}

export interface OrderDoc {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: { itemId: string; name: string; price: number; quantity: number; notes?: string; isVeg?: boolean }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'CASH_ON_TABLE';
  paymentMethod: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'CASH';
  transactionId?: string;
  gatewayProvider?: 'Cashfree' | 'Simulator' | 'Razorpay';
  status: 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface PaymentGatewayTransaction {
  orderId: string;
  transactionRef: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  paymentMethod: string;
  provider: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  receiptUrl?: string;
}

export interface DinerCartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface TableDoc {
  id: string;
  restaurantId: string;
  tableNumber: string;
  qrCodeUrl?: string;
  capacity?: number;
  createdAt: string;
}

