import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar, AdminTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { CategoryManager } from './components/CategoryManager';
import { MenuItemManager } from './components/MenuItemManager';
import { RestaurantSettings } from './components/RestaurantSettings';
import { SubscriptionManager } from './components/SubscriptionManager';
import { PublicMenuView } from './components/PublicMenuView';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { ContactUs } from './components/ContactUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import { OrderStatusModal } from './components/OrderStatusModal';
import { MenuItem, Category } from './types';
import { getCategoriesApi, getMenuItemsApi } from './services/api';
import { Utensils } from 'lucide-react';

function MainAppContent() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Path and Hash route parsing for /menu/{slug}, /login, /signup
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [authViewMode, setAuthViewMode] = useState<'login' | 'register' | null>(null);
  const [isContactPage, setIsContactPage] = useState<boolean>(false);
  const [isPrivacyPage, setIsPrivacyPage] = useState<boolean>(false);
  const [isTermsPage, setIsTermsPage] = useState<boolean>(false);

  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace('#', '');

      const searchParams = new URLSearchParams(window.location.search);
      const queryMenu = searchParams.get('menu') || searchParams.get('slug');

      setIsContactPage(pathname === '/contact');
      setIsPrivacyPage(pathname === '/privacy');
      setIsTermsPage(pathname === '/terms');

      if (pathname === '/login' || hash === 'login') {
        setAuthViewMode('login');
      } else if (pathname === '/signup' || pathname === '/register' || hash === 'signup' || hash === 'register') {
        setAuthViewMode('register');
      } else {
        setAuthViewMode(null);
      }

      if (pathname.startsWith('/menu/')) {
        const slug = pathname.replace(/^\/menu\//, '').split('?')[0];
        setPublicSlug(slug || null);
      } else if (pathname.startsWith('/m/')) {
        const slug = pathname.replace(/^\/m\//, '').split('?')[0];
        window.history.replaceState({}, '', `/menu/${slug}`);
        setPublicSlug(slug || null);
      } else if (hash.startsWith('m/') || hash.startsWith('menu/')) {
        const slug = hash.replace(/^menu\//, '').replace(/^m\//, '').split('?')[0];
        window.history.replaceState({}, '', `/menu/${slug}`);
        setPublicSlug(slug);
      } else if (queryMenu) {
        setPublicSlug(queryMenu);
      } else {
        setPublicSlug(null);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAuth = (mode: 'login' | 'register' = 'login') => {
    window.history.pushState({}, '', mode === 'register' ? '/signup' : '/login');
    window.dispatchEvent(new Event('popstate'));
  };

  const navigateToMenu = (slug: string) => {
    window.history.pushState({}, '', `/menu/${slug}`);
    window.dispatchEvent(new Event('popstate'));
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // Fetch admin data when logged in
  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [cats, items] = await Promise.all([
        getCategoriesApi(),
        getMenuItemsApi(),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (e) {
      console.error('Failed to fetch admin menu data:', e);
    } finally {
      setDataLoading(false);
    }
  };

  // If a public menu route is active, render customer PublicMenuView
  if (publicSlug) {
    return (
      <PublicMenuView
        slug={publicSlug}
        onBackToAdmin={() => {
          navigateHome();
        }}
      />
    );
  }

  if (isContactPage) {
    return <ContactUs />;
  }

  if (isPrivacyPage) {
    return <PrivacyPolicy />;
  }

  if (isTermsPage) {
    return <TermsAndConditions />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center mx-auto animate-spin">
            <Utensils className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Initializing Nexaris...</p>
        </div>
      </div>
    );
  }

  // Dedicated Auth Page View (/login or /signup) for unauthenticated users
  if (!user && authViewMode) {
    return (
      <AuthPage
        initialMode={authViewMode}
        onNavigateHome={navigateHome}
      />
    );
  }

  // Unauthenticated user -> Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
        <Navbar
          onOpenAuthModal={(mode) => {
            navigateToAuth(mode || 'login');
          }}
          onNavigatePublic={(slug) => {
            navigateToMenu(slug);
          }}
        />

        <main className="flex-1">
          <LandingPage
            onOpenAuth={(tab) => {
              navigateToAuth(tab);
            }}
            onViewDemoMenu={(slug) => {
              navigateToMenu(slug || 'velvet-bean');
            }}
          />
        </main>
      </div>
    );
  }

  // Platform Admin User -> Admin Panel Dashboard
  if (user.role === 'admin') {
    return (
      <AdminPanel />
    );
  }

  // Authenticated Restaurant Admin
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar
        onNavigatePublic={(slug) => {
          navigateToMenu(slug);
        }}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onViewPublic={() => {
            navigateToMenu(user.slug);
          }}
          itemsCount={menuItems.length}
          categoriesCount={categories.length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              items={menuItems}
              categories={categories}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewPublic={() => {
                navigateToMenu(user.slug);
              }}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              items={menuItems}
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'items' && (
            <MenuItemManager
              items={menuItems}
              categories={categories}
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'settings' && <RestaurantSettings />}

          {activeTab === 'billing' && <SubscriptionManager />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [orderStatusId, setOrderStatusId] = useState<string | null>(null);

  useEffect(() => {
    const checkOrderStatus = () => {
      const searchParams = new URLSearchParams(window.location.search);
      let foundOrderId = searchParams.get('order_id') || searchParams.get('cf_order_id');
      
      if (!foundOrderId && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        foundOrderId = hashParams.get('order_id') || hashParams.get('cf_order_id');
      }
      if (!foundOrderId && (window.location.hash.startsWith('#order-status') || window.location.hash.startsWith('order-status'))) {
        const hashParts = window.location.hash.split('order_id=');
        if (hashParts.length > 1) {
          foundOrderId = hashParts[1].split('&')[0];
        }
      }
      if (foundOrderId) {
        setOrderStatusId(foundOrderId);
      }
    };

    checkOrderStatus();
    window.addEventListener('popstate', checkOrderStatus);
    window.addEventListener('hashchange', checkOrderStatus);
    return () => {
      window.removeEventListener('popstate', checkOrderStatus);
      window.removeEventListener('hashchange', checkOrderStatus);
    };
  }, []);

  const handleCloseOrderStatus = () => {
    setOrderStatusId(null);
    const pathname = window.location.pathname;
    const cleanHash = window.location.hash.split('?')[0].replace(/^#order-status$/, '').replace(/^#order-status$/, '');
    const targetUrl = pathname + (cleanHash ? cleanHash : '');
    window.history.replaceState({}, '', targetUrl || '/');
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
        {orderStatusId && (
          <OrderStatusModal orderId={orderStatusId} onClose={handleCloseOrderStatus} />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
