import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  Restaurant,
  Category,
  MenuItem,
  AdminDashboardStats,
  AdminRestaurantListItem,
  AdminRestaurantDetail,
  MenuViewDoc,
  QrScanDoc,
  SubscriptionInfo,
  SubscriptionInvoice,
} from '../types';

export interface FirestoreUser {
  uid: string;
  email: string;
  role: 'admin' | 'restaurant';
  status: 'active' | 'suspended';
  restaurantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreRestaurant {
  id: string;
  ownerUid: string;
  restaurantName: string;
  ownerName: string;
  slug: string;
  phone: string;
  address: string;
  logoUrl: string;
  coverUrl: string;
  customDomain: string;
  status: 'active' | 'suspended';
  primaryColor?: string;
  secondaryColor?: string;
  themeMode?: 'light' | 'dark';
  fontFamily?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCategory {
  id: string;
  restaurantId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface FirestoreMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isJain?: boolean;
  isNoOnionGarlic?: boolean;
  isVegan?: boolean;
  isBestseller?: boolean;
  isTodaysSpecial?: boolean;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Map Firestore User + Restaurant to app User object
export function mapToAppUser(u: FirestoreUser, p?: FirestoreRestaurant): User {
  const restId = u.restaurantId || p?.id || u.uid;
  return {
    id: u.uid,
    restaurantId: restId,
    owner_name: p?.ownerName || (u.email ? u.email.split('@')[0] : 'Restaurant Owner'),
    restaurant_name: p?.restaurantName || 'My Restaurant',
    email: u.email,
    role: u.role,
    status: u.status,
    slug: p?.slug || 'restaurant',
    phone: p?.phone || '',
    address: p?.address || '',
    logo_url: p?.logoUrl || '',
    cover_url: p?.coverUrl || '',
    created_at: u.createdAt,
    primary_color: p?.primaryColor || '#f43f5e',
    secondary_color: p?.secondaryColor || '#fbbf24',
    theme_mode: p?.themeMode || 'light',
    font_family: p?.fontFamily || 'Playfair Display',
  };
}

// Helper to sanitize slugs
export function sanitizeSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'restaurant';
}

// Check global slug uniqueness across restaurants
export async function checkSlugAvailability(slug: string, excludeRestaurantId?: string): Promise<boolean> {
  try {
    const q1 = query(collection(db, 'restaurants'), where('slug', '==', slug));
    const snap1 = await getDocs(q1);
    
    if (!snap1.empty) {
      if (excludeRestaurantId) {
        const isSelf = snap1.docs.every((d) => d.id === excludeRestaurantId || d.data().ownerUid === excludeRestaurantId);
        if (!isSelf) return false;
      } else {
        return false;
      }
    }

    const q2 = query(collection(db, 'restaurant_profiles'), where('slug', '==', slug));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      if (excludeRestaurantId) {
        const isSelf = snap2.docs.every((d) => d.id === excludeRestaurantId || d.data().ownerUid === excludeRestaurantId);
        if (!isSelf) return false;
      } else {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('Error checking slug:', e);
    return true;
  }
}

// Generate globally unique slug
export async function generateUniqueSlug(restaurantName: string, excludeRestaurantId?: string): Promise<string> {
  const baseSlug = sanitizeSlug(restaurantName);
  let finalSlug = baseSlug;
  let counter = 1;
  while (!(await checkSlugAvailability(finalSlug, excludeRestaurantId))) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return finalSlug;
}

// Get User Profile with separated Restaurant Data & Subscription
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return null;

    const userData = userSnap.data() as FirestoreUser;
    const restaurantId = userData.restaurantId || `rest_${uid}`;

    // Try reading from 'restaurants' collection first
    let restSnap = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restSnap.exists()) {
      // Fallback check by ownerUid or legacy 'restaurant_profiles'
      const restQ = query(collection(db, 'restaurants'), where('ownerUid', '==', uid));
      const restQSnap = await getDocs(restQ);
      if (!restQSnap.empty) {
        restSnap = restQSnap.docs[0];
      } else {
        restSnap = await getDoc(doc(db, 'restaurant_profiles', uid));
      }
    }

    const restData = restSnap.exists() ? (restSnap.data() as FirestoreRestaurant) : undefined;
    const appUser = mapToAppUser(userData, restData);

    if (userData.role === 'restaurant') {
      try {
        const sub = await getSubscriptionForRestaurant(appUser.restaurantId || appUser.id);
        appUser.subscription = sub;
      } catch (subErr) {
        console.warn('Subscription fetch warning:', subErr);
      }
    }

    return appUser;
  } catch (e) {
    console.warn('Notice fetching user profile from Firestore:', e);
    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('nexaris_session_user') : null;
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr) as User;
        if (savedUser.id === uid) return savedUser;
      } catch (_) {}
    }
    return null;
  }
}

// ---------------- SUBSCRIPTION MANAGEMENT FUNCTIONS ----------------

export async function getSubscriptionForRestaurant(restaurantId: string): Promise<SubscriptionInfo> {
  try {
    const subRef = doc(db, 'subscriptions', restaurantId);
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      return snap.data() as SubscriptionInfo;
    }

    const now = new Date();
    const endDate = new Date(now.valueOf());
    endDate.setFullYear(endDate.getFullYear() + 1);

    const defaultSub: SubscriptionInfo = {
      id: `sub_${restaurantId}`,
      restaurantId,
      planName: 'Annual Pro Plan',
      price: 299,
      billingCycle: 'yearly',
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      paymentMethod: 'UPI / Direct Online Pass',
      transactionId: `TXN_${Date.now().toString().slice(-8)}`,
      updatedAt: now.toISOString(),
    };

    await setDoc(subRef, defaultSub);
    return defaultSub;
  } catch (e) {
    console.warn('Subscription fetch notice (this is normal when offline):', e);
    const now = new Date();
    const endDate = new Date(now.valueOf());
    endDate.setFullYear(endDate.getFullYear() + 1);
    return {
      id: `sub_${restaurantId}`,
      restaurantId,
      planName: 'Annual Pro Plan',
      price: 299,
      billingCycle: 'yearly',
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
    };
  }
}

export async function processAnnualSubscriptionPayment(
  restaurantId: string,
  restaurantName: string,
  paymentDetails: { paymentMethod: string; transactionId: string }
): Promise<{ subscription: SubscriptionInfo; invoice: SubscriptionInvoice }> {
  const now = new Date();
  const endDate = new Date(now.valueOf());
  endDate.setFullYear(endDate.getFullYear() + 1);

  const subData: SubscriptionInfo = {
    id: `sub_${restaurantId}`,
    restaurantId,
    restaurantName,
    planName: 'Annual Pro Plan',
    price: 299,
    billingCycle: 'yearly',
    status: 'active',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    autoRenew: true,
    paymentMethod: paymentDetails.paymentMethod,
    transactionId: paymentDetails.transactionId,
    updatedAt: now.toISOString(),
  };

  const invoiceId = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceData: SubscriptionInvoice = {
    id: invoiceId,
    restaurantId,
    restaurantName,
    amount: 299,
    status: 'paid',
    date: now.toISOString(),
    planName: 'Annual Pro Plan (Flat ₹299/yr)',
    billingPeriod: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    paymentMethod: paymentDetails.paymentMethod,
    transactionRef: paymentDetails.transactionId,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'subscriptions', restaurantId), subData);
  batch.set(doc(db, 'invoices', invoiceId), invoiceData);

  await batch.commit();

  return { subscription: subData, invoice: invoiceData };
}

export async function simulateSubscriptionExpiration(restaurantId: string): Promise<SubscriptionInfo> {
  const now = new Date();
  const yesterday = new Date(now.valueOf() - 24 * 60 * 60 * 1000);
  
  const subData: SubscriptionInfo = {
    id: `sub_${restaurantId}`,
    restaurantId,
    planName: 'Annual Pro Plan',
    price: 299,
    billingCycle: 'yearly',
    status: 'expired',
    startDate: new Date(now.valueOf() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: yesterday.toISOString(),
    autoRenew: false,
    paymentMethod: 'Simulation Tool',
    transactionId: `TXN_SIM_${Date.now().toString().slice(-6)}`,
    updatedAt: now.toISOString(),
  };

  await setDoc(doc(db, 'subscriptions', restaurantId), subData);
  return subData;
}

export async function getRestaurantInvoices(restaurantId: string): Promise<SubscriptionInvoice[]> {
  try {
    const q = query(collection(db, 'invoices'), where('restaurantId', '==', restaurantId));
    const snap = await getDocs(q);
    const invoices: SubscriptionInvoice[] = [];
    snap.forEach((d) => invoices.push(d.data() as SubscriptionInvoice));

    if (invoices.length === 0) {
      const now = new Date();
      const endDate = new Date(now.valueOf());
      endDate.setFullYear(endDate.getFullYear() + 1);
      const defaultInv: SubscriptionInvoice = {
        id: `INV-${now.getFullYear()}-1001`,
        restaurantId,
        restaurantName: 'Restaurant',
        amount: 299,
        status: 'paid',
        date: now.toISOString(),
        planName: 'Annual Pro Plan (Flat ₹299/yr)',
        billingPeriod: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        paymentMethod: 'UPI / Online Payment',
        transactionRef: `TXN_${restaurantId.substring(0, 6)}_${now.getFullYear()}`,
      };
      return [defaultInv];
    }
    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error('Error fetching invoices:', e);
    return [];
  }
}

export async function updateSubscriptionStatusAdmin(
  restaurantId: string,
  newStatus: 'active' | 'trialing' | 'expired' | 'canceled'
): Promise<void> {
  const subRef = doc(db, 'subscriptions', restaurantId);
  await setDoc(subRef, { status: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
}

// Create Initial User Record and Separated Restaurant Entity
export async function createUserRecord(
  uid: string,
  email: string,
  ownerName: string,
  restaurantName: string,
  role: 'admin' | 'restaurant' = 'restaurant'
): Promise<User> {
  try {
    const now = new Date().toISOString();
    const restaurantId = `rest_${uid}`;
    const slug = await generateUniqueSlug(restaurantName, restaurantId);

    const userData: FirestoreUser = {
      uid,
      email: email.toLowerCase(),
      role,
      status: 'active',
      restaurantId,
      createdAt: now,
      updatedAt: now,
    };

    const restaurantData: FirestoreRestaurant = {
      id: restaurantId,
      ownerUid: uid,
      restaurantName,
      ownerName,
      slug,
      phone: '',
      address: '',
      logoUrl: '',
      coverUrl: '',
      customDomain: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), userData);
    batch.set(doc(db, 'restaurants', restaurantId), restaurantData);
    // Synced legacy collection write for backwards compatibility
    batch.set(doc(db, 'restaurant_profiles', uid), restaurantData);

    // If new restaurant, create default starter categories referenced by restaurantId
    if (role === 'restaurant') {
      const cat1Id = `c_${Date.now()}_1`;
      const cat2Id = `c_${Date.now()}_2`;
      const cat3Id = `c_${Date.now()}_3`;

      batch.set(doc(db, 'categories', cat1Id), {
        id: cat1Id,
        restaurantId,
        name: 'Starters',
        displayOrder: 1,
        createdAt: now,
      });

      batch.set(doc(db, 'categories', cat2Id), {
        id: cat2Id,
        restaurantId,
        name: 'Main Course',
        displayOrder: 2,
        createdAt: now,
      });

      batch.set(doc(db, 'categories', cat3Id), {
        id: cat3Id,
        restaurantId,
        name: 'Beverages',
        displayOrder: 3,
        createdAt: now,
      });
    }

    await batch.commit();

    return mapToAppUser(userData, restaurantData);
  } catch (e) {
    return handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
  }
}

// Update Separated Restaurant Profile
export async function updateRestaurantProfile(
  uid: string,
  data: Partial<User>
): Promise<User> {
  try {
    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data() as FirestoreUser;

    const restaurantId = userData?.restaurantId || `rest_${uid}`;
    const restRef = doc(db, 'restaurants', restaurantId);
    const restSnap = await getDoc(restRef);

    let currentRest = restSnap.exists() ? (restSnap.data() as FirestoreRestaurant) : null;
    if (!currentRest) {
      const legacySnap = await getDoc(doc(db, 'restaurant_profiles', uid));
      if (legacySnap.exists()) {
        currentRest = legacySnap.data() as FirestoreRestaurant;
      }
    }

    let newSlug = currentRest?.slug || 'restaurant';
    if (data.slug && data.slug !== currentRest?.slug) {
      const isAvailable = await checkSlugAvailability(data.slug, restaurantId);
      if (!isAvailable) {
        throw new Error('This URL slug is already taken by another restaurant.');
      }
      newSlug = sanitizeSlug(data.slug);
    }

    const updatedRestaurant: FirestoreRestaurant = {
      id: restaurantId,
      ownerUid: uid,
      restaurantName: data.restaurant_name ?? currentRest?.restaurantName ?? 'My Restaurant',
      ownerName: data.owner_name ?? currentRest?.ownerName ?? 'Owner',
      slug: newSlug,
      phone: data.phone ?? currentRest?.phone ?? '',
      address: data.address ?? currentRest?.address ?? '',
      logoUrl: data.logo_url ?? currentRest?.logoUrl ?? '',
      coverUrl: data.cover_url ?? currentRest?.coverUrl ?? '',
      customDomain: currentRest?.customDomain || '',
      status: currentRest?.status || 'active',
      primaryColor: data.primary_color ?? currentRest?.primaryColor ?? '#f43f5e',
      secondaryColor: data.secondary_color ?? currentRest?.secondaryColor ?? '#fbbf24',
      themeMode: data.theme_mode ?? currentRest?.themeMode ?? 'light',
      fontFamily: data.font_family ?? currentRest?.fontFamily ?? 'Playfair Display',
      createdAt: currentRest?.createdAt || now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(restRef, updatedRestaurant, { merge: true });
    batch.set(doc(db, 'restaurant_profiles', uid), updatedRestaurant, { merge: true });
    await batch.commit();

    return mapToAppUser(userData, updatedRestaurant);
  } catch (e: any) {
    if (e.message.includes('slug is already taken')) throw e;
    return handleFirestoreError(e, OperationType.UPDATE, `restaurants/${uid}`);
  }
}

// ---------------- CATEGORIES CRUD ----------------

export async function fetchCategories(id: string): Promise<Category[]> {
  try {
    // Try querying by restaurantId or id (supports both user id and restaurant id)
    const restaurantId = id.startsWith('rest_') ? id : `rest_${id}`;
    
    let q = query(
      collection(db, 'categories'),
      where('restaurantId', '==', restaurantId)
    );
    let snapshot = await getDocs(q);

    if (snapshot.empty && id !== restaurantId) {
      // Fallback check for legacy uid references
      q = query(
        collection(db, 'categories'),
        where('restaurantId', '==', id)
      );
      snapshot = await getDocs(q);
    }

    const categories: Category[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as FirestoreCategory;
      categories.push({
        id: data.id,
        restaurant_id: data.restaurantId,
        restaurantId: data.restaurantId,
        user_id: data.restaurantId,
        name: data.name,
        created_at: data.createdAt,
      });
    });

    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
  } catch (e) {
    console.error('Error fetching categories:', e);
    return [];
  }
}

export async function createCategory(id: string, name: string): Promise<Category> {
  try {
    const restaurantId = id.startsWith('rest_') ? id : `rest_${id}`;
    const catId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newCat: FirestoreCategory = {
      id: catId,
      restaurantId,
      name: name.trim(),
      displayOrder: Date.now(),
      createdAt: now,
    };

    await setDoc(doc(db, 'categories', catId), newCat);

    return {
      id: catId,
      restaurant_id: restaurantId,
      restaurantId,
      user_id: restaurantId,
      name: newCat.name,
      created_at: now,
    };
  } catch (e) {
    return handleFirestoreError(e, OperationType.CREATE, 'categories');
  }
}

export async function updateCategory(catId: string, name: string): Promise<Category> {
  try {
    const catRef = doc(db, 'categories', catId);
    await updateDoc(catRef, { name: name.trim() });
    const snap = await getDoc(catRef);
    const data = snap.data() as FirestoreCategory;

    return {
      id: data.id,
      restaurant_id: data.restaurantId,
      restaurantId: data.restaurantId,
      user_id: data.restaurantId,
      name: data.name,
      created_at: data.createdAt,
    };
  } catch (e) {
    return handleFirestoreError(e, OperationType.UPDATE, `categories/${catId}`);
  }
}

export async function deleteCategory(catId: string, id: string): Promise<void> {
  try {
    const restaurantId = id.startsWith('rest_') ? id : `rest_${id}`;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'categories', catId));

    // Delete associated menu items
    const itemsQ = query(
      collection(db, 'menu_items'),
      where('categoryId', '==', catId),
      where('restaurantId', '==', restaurantId)
    );
    const itemsSnap = await getDocs(itemsQ);
    itemsSnap.forEach((itemDoc) => {
      batch.delete(itemDoc.ref);
    });

    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `categories/${catId}`);
  }
}

// ---------------- MENU ITEMS CRUD ----------------

export async function fetchMenuItems(id: string): Promise<MenuItem[]> {
  try {
    const restaurantId = id.startsWith('rest_') ? id : `rest_${id}`;
    let q = query(
      collection(db, 'menu_items'),
      where('restaurantId', '==', restaurantId)
    );
    let snapshot = await getDocs(q);

    if (snapshot.empty && id !== restaurantId) {
      q = query(
        collection(db, 'menu_items'),
        where('restaurantId', '==', id)
      );
      snapshot = await getDocs(q);
    }

    const items: MenuItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as FirestoreMenuItem;
      items.push({
        id: data.id,
        restaurant_id: data.restaurantId,
        restaurantId: data.restaurantId,
        user_id: data.restaurantId,
        category_id: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.imageUrl,
        is_veg: data.isVeg,
        is_jain: data.isJain || false,
        is_no_onion_garlic: data.isNoOnionGarlic || false,
        is_vegan: data.isVegan || false,
        is_bestseller: data.isBestseller || false,
        is_todays_special: data.isTodaysSpecial || false,
        is_available: data.isAvailable,
        created_at: data.createdAt,
      });
    });

    return items;
  } catch (e) {
    console.error('Error fetching menu items:', e);
    return [];
  }
}

export async function createMenuItem(id: string, payload: Partial<MenuItem>): Promise<MenuItem> {
  try {
    const restaurantId = id.startsWith('rest_') ? id : `rest_${id}`;
    const itemId = `i_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newItem: FirestoreMenuItem = {
      id: itemId,
      restaurantId,
      categoryId: payload.category_id || '',
      name: payload.name?.trim() || 'Untitled Dish',
      description: payload.description?.trim() || '',
      price: Number(payload.price) || 0,
      imageUrl: payload.image_url || '',
      isVeg: Boolean(payload.is_veg),
      isJain: Boolean(payload.is_jain),
      isNoOnionGarlic: Boolean(payload.is_no_onion_garlic),
      isVegan: Boolean(payload.is_vegan),
      isBestseller: Boolean(payload.is_bestseller),
      isTodaysSpecial: Boolean(payload.is_todays_special),
      isAvailable: payload.is_available !== undefined ? Boolean(payload.is_available) : true,
      displayOrder: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'menu_items', itemId), newItem);

    return {
      id: itemId,
      restaurant_id: restaurantId,
      restaurantId,
      user_id: restaurantId,
      category_id: newItem.categoryId,
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      image_url: newItem.imageUrl,
      is_veg: newItem.isVeg,
      is_jain: newItem.isJain || false,
      is_no_onion_garlic: newItem.isNoOnionGarlic || false,
      is_vegan: newItem.isVegan || false,
      is_bestseller: newItem.isBestseller || false,
      is_todays_special: newItem.isTodaysSpecial || false,
      is_available: newItem.isAvailable,
      created_at: now,
    };
  } catch (e) {
    return handleFirestoreError(e, OperationType.CREATE, 'menu_items');
  }
}

export async function updateMenuItem(itemId: string, payload: Partial<MenuItem>): Promise<MenuItem> {
  try {
    const itemRef = doc(db, 'menu_items', itemId);
    const now = new Date().toISOString();

    const updates: Record<string, any> = { updatedAt: now };

    if (payload.category_id !== undefined) updates.categoryId = payload.category_id;
    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.price !== undefined) updates.price = Number(payload.price);
    if (payload.image_url !== undefined) updates.imageUrl = payload.image_url;
    if (payload.is_veg !== undefined) updates.isVeg = Boolean(payload.is_veg);
    if (payload.is_jain !== undefined) updates.isJain = Boolean(payload.is_jain);
    if (payload.is_no_onion_garlic !== undefined) updates.isNoOnionGarlic = Boolean(payload.is_no_onion_garlic);
    if (payload.is_vegan !== undefined) updates.isVegan = Boolean(payload.is_vegan);
    if (payload.is_bestseller !== undefined) updates.isBestseller = Boolean(payload.is_bestseller);
    if (payload.is_todays_special !== undefined) updates.isTodaysSpecial = Boolean(payload.is_todays_special);
    if (payload.is_available !== undefined) updates.isAvailable = Boolean(payload.is_available);

    await updateDoc(itemRef, updates);

    const snap = await getDoc(itemRef);
    const data = snap.data() as FirestoreMenuItem;

    return {
      id: data.id,
      restaurant_id: data.restaurantId,
      restaurantId: data.restaurantId,
      user_id: data.restaurantId,
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      image_url: data.imageUrl,
      is_veg: data.isVeg,
      is_jain: data.isJain || false,
      is_no_onion_garlic: data.isNoOnionGarlic || false,
      is_vegan: data.isVegan || false,
      is_bestseller: data.isBestseller || false,
      is_todays_special: data.isTodaysSpecial || false,
      is_available: data.isAvailable,
      created_at: data.createdAt,
    };
  } catch (e) {
    return handleFirestoreError(e, OperationType.UPDATE, `menu_items/${itemId}`);
  }
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'menu_items', itemId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `menu_items/${itemId}`);
  }
}

// ---------------- PUBLIC MENU FETCHING & ANALYTICS ----------------

export async function fetchPublicMenuBySlug(slug: string) {
  try {
    let q = query(collection(db, 'restaurants'), where('slug', '==', slug));
    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      q = query(collection(db, 'restaurant_profiles'), where('slug', '==', slug));
      snapshot = await getDocs(q);
    }

    if (snapshot.empty) {
      throw new Error('Restaurant menu not found.');
    }

    const restDoc = snapshot.docs[0];
    const restaurant = restDoc.data() as FirestoreRestaurant;
    const restId = restaurant.id || restDoc.id;

    // Check user/restaurant active status
    const userDocRef = doc(db, 'users', restaurant.ownerUid);
    const userSnap = await getDoc(userDocRef);
    if (
      restaurant.status === 'suspended' ||
      (userSnap.exists() && userSnap.data()?.status === 'suspended')
    ) {
      throw new Error('This restaurant account is currently suspended.');
    }

    // Fetch categories and items by restaurantId
    const [categories, menuItems] = await Promise.all([
      fetchCategories(restId),
      fetchMenuItems(restId),
    ]);

    return {
      restaurant: {
        id: restId,
        restaurant_name: restaurant.restaurantName,
        owner_name: restaurant.ownerName,
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        logo_url: restaurant.logoUrl || '',
        cover_url: restaurant.coverUrl || '',
        slug: restaurant.slug,
      },
      categories,
      menu_items: menuItems,
    };
  } catch (e: any) {
    throw e;
  }
}

// Record menu views and QR scans analytics
export async function recordMenuView(restaurantId: string, slug: string, isQr: boolean = false) {
  try {
    const timestamp = new Date().toISOString();
    const viewId = `mv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const viewData: MenuViewDoc = {
      id: viewId,
      restaurantId,
      slug,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    };

    await setDoc(doc(db, 'menu_views', viewId), viewData);

    if (isQr) {
      const scanId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const scanData: QrScanDoc = {
        id: scanId,
        restaurantId,
        slug,
        timestamp,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };
      await setDoc(doc(db, 'qr_scans', scanId), scanData);
    }
  } catch (e) {
    console.warn('Failed to record menu view analytics:', e);
  }
}

// ---------------- ADMIN ACTIONS ----------------

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const itemsSnap = await getDocs(collection(db, 'menu_items'));

    let totalRestaurants = 0;
    let newToday = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    usersSnap.forEach((d) => {
      const data = d.data() as FirestoreUser;
      if (data.role === 'restaurant') {
        totalRestaurants++;
        if (data.createdAt) {
          const created = new Date(data.createdAt);
          if (created >= oneDayAgo) newToday++;
        }
      }
    });

    return {
      total_restaurants: totalRestaurants,
      total_categories: categoriesSnap.size,
      total_menu_items: itemsSnap.size,
      new_restaurants_today: newToday,
    };
  } catch (e) {
    console.error('Error getting admin stats:', e);
    return {
      total_restaurants: 0,
      total_categories: 0,
      total_menu_items: 0,
      new_restaurants_today: 0,
    };
  }
}

export async function getAllRestaurantsForAdmin(): Promise<AdminRestaurantListItem[]> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const restsSnap = await getDocs(collection(db, 'restaurants'));
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const itemsSnap = await getDocs(collection(db, 'menu_items'));

    const restsMap = new Map<string, FirestoreRestaurant>();
    restsSnap.forEach((d) => {
      const r = d.data() as FirestoreRestaurant;
      restsMap.set(r.ownerUid, r);
      restsMap.set(r.id, r);
    });

    const catCounts = new Map<string, number>();
    categoriesSnap.forEach((d) => {
      const rId = d.data().restaurantId;
      catCounts.set(rId, (catCounts.get(rId) || 0) + 1);
    });

    const itemCounts = new Map<string, number>();
    itemsSnap.forEach((d) => {
      const rId = d.data().restaurantId;
      itemCounts.set(rId, (itemCounts.get(rId) || 0) + 1);
    });

    const list: AdminRestaurantListItem[] = [];

    usersSnap.forEach((d) => {
      const u = d.data() as FirestoreUser;
      if (u.role === 'restaurant') {
        const restId = u.restaurantId || `rest_${u.uid}`;
        const p = restsMap.get(restId) || restsMap.get(u.uid);
        const userObj = mapToAppUser(u, p);
        list.push({
          ...userObj,
          categories_count: catCounts.get(restId) || catCounts.get(u.uid) || 0,
          items_count: itemCounts.get(restId) || itemCounts.get(u.uid) || 0,
        });
      }
    });

    return list;
  } catch (e) {
    console.error('Error listing admin restaurants:', e);
    return [];
  }
}

export async function getRestaurantDetailForAdmin(restaurantId: string): Promise<AdminRestaurantDetail | null> {
  try {
    const user = await getUserProfile(restaurantId);
    if (!user) return null;

    const [categories, menuItems] = await Promise.all([
      fetchCategories(restaurantId),
      fetchMenuItems(restaurantId),
    ]);

    const publicUrl = `${window.location.origin}/menu/${user.slug}`;

    return {
      restaurant: user,
      categories,
      menu_items: menuItems,
      qr_code_url: '',
      public_menu_url: publicUrl,
    };
  } catch (e) {
    console.error('Error getting restaurant detail:', e);
    return null;
  }
}

export async function updateRestaurantStatus(
  restaurantId: string,
  status: 'active' | 'suspended'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', restaurantId);
    await updateDoc(userRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
    
    // Also update restaurants status
    const restId = restaurantId.startsWith('rest_') ? restaurantId : `rest_${restaurantId}`;
    await updateDoc(doc(db, 'restaurants', restId), { status }).catch(() => {});
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${restaurantId}`);
  }
}

export async function deleteRestaurantAndData(restaurantId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const restId = restaurantId.startsWith('rest_') ? restaurantId : `rest_${restaurantId}`;

    batch.delete(doc(db, 'users', restaurantId));
    batch.delete(doc(db, 'restaurants', restId));
    batch.delete(doc(db, 'restaurant_profiles', restaurantId));

    const catQ = query(collection(db, 'categories'), where('restaurantId', 'in', [restaurantId, restId]));
    const catSnap = await getDocs(catQ);
    catSnap.forEach((d) => batch.delete(d.ref));

    const itemQ = query(collection(db, 'menu_items'), where('restaurantId', 'in', [restaurantId, restId]));
    const itemSnap = await getDocs(itemQ);
    itemSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${restaurantId}`);
  }
}

// ---------------- FUTURE EXPANSION COLLECTIONS INITIALIZERS ----------------

export async function initializeEmptyCollections() {
  const emptyCollections = ['subscriptions', 'plans', 'analytics', 'domains', 'staff', 'orders', 'tables'];
  return emptyCollections;
}

// Seed Demo Restaurant & Demo Admin if not present
export async function seedDemoDataIfEmpty() {
  try {
    const bellaDocSnap = await getDoc(doc(db, 'users', 'demo_bella_italia_uid'));
    if (bellaDocSnap.exists()) return;

    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) return;

    // 1. Demo Restaurant (Bella Italia)
    const bellaUid = 'demo_bella_italia_uid';
    await createUserRecord(bellaUid, 'demo@bellaitalia.com', 'Marco Rossi', 'Bella Italia', 'restaurant');
    await updateRestaurantProfile(bellaUid, {
      slug: 'bella-italia',
      phone: '+1 (555) 382-9102',
      address: '142 Via Roma, Little Italy',
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    });

    const cat1 = await createCategory(bellaUid, 'Wood-Fired Pizzas');
    const cat2 = await createCategory(bellaUid, 'Handcrafted Pasta');
    const cat3 = await createCategory(bellaUid, 'Italian Desserts');

    await createMenuItem(bellaUid, {
      category_id: cat1.id,
      name: 'Margherita Speciale',
      description: 'San Marzano tomato sauce, fresh buffalo mozzarella, basil leaves, extra virgin olive oil.',
      price: 16.50,
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
      is_veg: true,
      is_available: true,
    });

    await createMenuItem(bellaUid, {
      category_id: cat1.id,
      name: 'Diavola Pepperoni',
      description: 'Spicy Calabrian salami, mozzarella, chili oil, San Marzano tomatoes.',
      price: 18.00,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      is_veg: false,
      is_available: true,
    });

    await createMenuItem(bellaUid, {
      category_id: cat2.id,
      name: 'Truffle Tagliatelle',
      description: 'Handmade egg pasta, black truffle paste, Parmigiano Reggiano cream sauce.',
      price: 22.00,
      image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281878?auto=format&fit=crop&w=600&q=80',
      is_veg: true,
      is_available: true,
    });

    await createMenuItem(bellaUid, {
      category_id: cat3.id,
      name: 'Classic Tiramisu',
      description: 'Espresso-soaked ladyfingers, whipped mascarpone, cocoa powder.',
      price: 9.50,
      image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      is_veg: true,
      is_available: true,
    });

    // 2. Demo Admin User
    const adminUid = 'demo_admin_uid';
    await createUserRecord(adminUid, 'admin@nexarismenu.online', 'Platform Admin', 'Nexaris Operations', 'admin');

  } catch (e) {
    console.warn('Seed demo data info:', e);
  }
}

