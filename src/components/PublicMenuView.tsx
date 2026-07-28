import React, { useState, useEffect } from 'react';
import {
  Phone,
  MapPin,
  Search,
  Utensils,
  ArrowLeft,
  AlertCircle,
  Share2,
  Check,
  X,
  Maximize2,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  Lock,
  List,
  Compass,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { PublicMenuResponse } from '../types';
import { fetchPublicMenuApi } from '../services/api';
import { NexarisLogo } from './NexarisLogo';
import { PublicMenuLightbox } from './PublicMenuLightbox';

interface PublicMenuViewProps {
  slug: string;
  onBackToAdmin?: () => void;
}

export const PublicMenuView: React.FC<PublicMenuViewProps> = ({ slug, onBackToAdmin }) => {
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg' | 'jain' | 'no-onion-garlic' | 'vegan' | 'bestseller' | 'todays-special'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; price: number } | null>(null);
  const [lightboxItemId, setLightboxItemId] = useState<string | null>(null);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState<boolean>(false);

  const primaryColor = data?.restaurant?.primary_color || '#f43f5e';
  const secondaryColor = data?.restaurant?.secondary_color || '#fbbf24';
  const isDark = data?.restaurant?.theme_mode === 'dark';
  const fontFamily = data?.restaurant?.font_family || 'Playfair Display';

  useEffect(() => {
    if (fontFamily) {
      const fontId = 'dynamic-restaurant-font';
      let linkEl = document.getElementById(fontId) as HTMLLinkElement;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = fontId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      const fontNameEncoded = encodeURIComponent(fontFamily);
      linkEl.href = `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@300;400;500;600;700;800;900&display=swap`;
    }
  }, [fontFamily]);

  useEffect(() => {
    const styleId = 'dynamic-theme-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --primary-theme: ${primaryColor};
        --secondary-theme: ${secondaryColor};
      }
      .font-custom-theme {
        font-family: "${fontFamily}", system-ui, -apple-system, sans-serif !important;
      }
      .bg-custom-theme {
        background-color: ${isDark ? '#090d16' : '#f8fafc'} !important;
      }
      .bg-card-custom-theme {
        background-color: ${isDark ? '#111827' : '#ffffff'} !important;
        border-color: ${isDark ? '#1f2937' : '#f1f5f9'} !important;
      }
      .text-title-custom-theme {
        color: ${isDark ? '#f9fafb' : '#0f172a'} !important;
      }
      .text-muted-custom-theme {
        color: ${isDark ? '#9ca3af' : '#64748b'} !important;
      }
      .border-custom-theme {
        border-color: ${isDark ? '#1f2937' : '#e2e8f0'} !important;
      }
      .input-custom-theme {
        background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
        border-color: ${isDark ? '#374151' : '#cbd5e1'} !important;
        color: ${isDark ? '#f9fafb' : '#0f172a'} !important;
      }
    `;
  }, [primaryColor, secondaryColor, fontFamily, isDark]);

  // Smart AI Suggestions State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(true);
  const [aiResponse, setAiResponse] = useState<{
    message: string;
    suggestions: Array<{ itemId: string; reason: string; matchPercentage: number }>;
  } | null>(null);
  const [highlightedDishId, setHighlightedDishId] = useState<string | null>(null);

  // Tray / Shortlist State
  const [tray, setTray] = useState<Array<{ id: string; quantity: number }>>(() => {
    try {
      const saved = localStorage.getItem(`nexaris-tray-${slug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isTrayOpen, setIsTrayOpen] = useState<boolean>(false);
  const [waiterNote, setWaiterNote] = useState<string>(() => {
    try {
      return localStorage.getItem(`nexaris-tray-note-${slug}`) || '';
    } catch {
      return '';
    }
  });
  const [showSummaryScreen, setShowSummaryScreen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(`nexaris-tray-${slug}`, JSON.stringify(tray));
    } catch (err) {
      console.error('Failed to save tray to localStorage', err);
    }
  }, [tray, slug]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexaris-tray-note-${slug}`, waiterNote);
    } catch (err) {
      console.error('Failed to save waiter note to localStorage', err);
    }
  }, [waiterNote, slug]);

  const addToTray = (id: string) => {
    setTray((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id, quantity: 1 }];
    });
  };

  const removeFromTray = (id: string) => {
    setTray((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
    });
  };

  const deleteFromTray = (id: string) => {
    setTray((prev) => prev.filter((i) => i.id !== id));
  };

  const clearTray = () => {
    setTray([]);
  };

  useEffect(() => {
    loadPublicMenu();
  }, [slug]);

  const loadPublicMenu = async () => {
    setLoading(true);
    setError(null);
    setIsSubscriptionExpired(false);
    try {
      const res = await fetch('/api/public/menu/' + slug);
      const result = await res.json();
      if (!res.ok) {
        if (result.subscription_expired) {
          setIsSubscriptionExpired(true);
          setError(result.error || 'This restaurant digital menu has been temporarily disabled because its subscription is over.');
          return;
        }
        throw new Error(result.error || 'Unable to load digital menu.');
      }
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Unable to load digital menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getAiSuggestions = async (queryText: string) => {
    if (!queryText || !queryText.trim() || !data) return;
    setAiLoading(true);
    setAiResponse(null);
    setIsAiExpanded(true);
    try {
      const response = await fetch('/api/public/menu-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          menuItems: data.menu_items
        }),
      });
      const result = await response.json();
      setAiResponse(result);
    } catch (err) {
      console.error('Failed to get AI suggestions:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTagClick = (tagQuery: string) => {
    setAiQuery(tagQuery);
    getAiSuggestions(tagQuery);
  };

  const scrollToDish = (itemId: string) => {
    if (!data) return;
    const item = data.menu_items.find(i => i.id === itemId);
    if (item) {
      setActiveCategory('all');
      setDietaryFilter('all');
      setSearchTerm('');
      
      setTimeout(() => {
        const element = document.getElementById(`dish-${itemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedDishId(itemId);
          setTimeout(() => {
            setHighlightedDishId(null);
          }, 3500);
        }
      }, 120);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    setIsCategoriesMenuOpen(false);
    
    setTimeout(() => {
      const element = document.getElementById(`category-sec-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-indigo-200">
            <Utensils className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading digital menu...</p>
        </div>
      </div>
    );
  }

  if (isSubscriptionExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Digital Menu Temporarily Offline</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This restaurant digital menu is temporarily offline because its active subscription or free trial period has ended.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 border border-slate-100 space-y-2 text-left">
            <p className="font-semibold text-slate-700">Are you the restaurant owner?</p>
            <p>Please log into your Nexaris control panel, go to the Subscription tab, and activate or renew your annual Pro membership to restore instant public access immediately.</p>
          </div>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-100 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Menu Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'This digital menu is not available.'}</p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const { restaurant, categories, menu_items } = data;

  const trayCount = tray.reduce((sum, item) => sum + item.quantity, 0);

  const trayDetails = tray
    .map((tItem) => {
      const item = menu_items.find((mi) => mi.id === tItem.id);
      return item ? { item, quantity: tItem.quantity } : null;
    })
    .filter((x): x is { item: typeof menu_items[0]; quantity: number } => x !== null);

  const totalPrice = trayDetails.reduce((sum, d) => sum + d.item.price * d.quantity, 0);
  const totalCalories = trayDetails.reduce((sum, d) => sum + (d.item.calories || 0) * d.quantity, 0);
  const totalGrams = trayDetails.reduce((sum, d) => sum + (d.item.grams || 0) * d.quantity, 0);

  // Filter items based on search and veg/non-veg filter
  const filteredItems = menu_items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDietary =
      dietaryFilter === 'all' ||
      (dietaryFilter === 'veg' && item.is_veg) ||
      (dietaryFilter === 'non-veg' && !item.is_veg) ||
      (dietaryFilter === 'jain' && item.is_jain) ||
      (dietaryFilter === 'no-onion-garlic' && item.is_no_onion_garlic) ||
      (dietaryFilter === 'vegan' && item.is_vegan) ||
      (dietaryFilter === 'bestseller' && item.is_bestseller) ||
      (dietaryFilter === 'todays-special' && item.is_todays_special);

    return matchesSearch && matchesDietary;
  });

  // Group items by category for the full view (always show all categories to allow smooth scrolling/jumping)
  const displayCategories = categories;

  return (
    <div className="min-h-screen bg-custom-theme font-custom-theme pb-24 relative transition-colors duration-300">
      {/* Top Banner & Header */}
      <div className="relative bg-slate-900 text-white max-w-md mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl shadow-2xl overflow-hidden sm:rounded-b-3xl">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-56 bg-slate-800">
          {restaurant.cover_url ? (
            <img
              src={restaurant.cover_url}
              alt={restaurant.restaurant_name}
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900" />
          )}

          {/* Share / Back Floating Buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="p-2 rounded-full bg-slate-900/70 text-white backdrop-blur-md hover:bg-slate-900 transition shadow-md cursor-pointer"
                  title="Back to Admin"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-slate-900/70 text-white backdrop-blur-md hover:bg-slate-900 transition shadow-md flex items-center gap-1.5 px-3 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="text-xs font-semibold">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Restaurant Profile Content */}
        <div className="p-5 sm:p-6 relative bg-card-custom-theme text-title-custom-theme border-b border-custom-theme">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card-custom-theme p-1.5 shadow-xl border border-custom-theme shrink-0">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.restaurant_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div
                  className="w-full h-full text-white rounded-xl flex items-center justify-center font-extrabold text-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {restaurant.restaurant_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer animate-in"
                  style={{
                    backgroundColor: primaryColor + '12',
                    borderColor: primaryColor + '25',
                    color: primaryColor,
                  }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
              {restaurant.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer animate-in"
                  style={{
                    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                    borderColor: isDark ? '#374151' : '#e2e8f0',
                    color: isDark ? '#f9fafb' : '#334155',
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-title-custom-theme tracking-tight">
              {restaurant.restaurant_name}
            </h1>
            {restaurant.address && (
              <p className="text-xs text-muted-custom-theme mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{restaurant.address}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl px-4 mt-4 space-y-4">
        {/* Search & Veg/Non-Veg Filter Bar */}
        <div className="bg-card-custom-theme rounded-2xl p-3 shadow-sm border border-custom-theme space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 input-custom-theme"
            />
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-custom-theme pt-2">
            <span className="text-xs font-bold text-muted-custom-theme uppercase tracking-wider shrink-0">Preference:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDietaryFilter('all')}
                className="px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                style={{
                  backgroundColor: dietaryFilter === 'all' ? primaryColor : (isDark ? '#1f2937' : '#f1f5f9'),
                  color: dietaryFilter === 'all' ? '#ffffff' : (isDark ? '#d1d5db' : '#4b5563'),
                }}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter('todays-special')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 shadow-2xs"
                style={{
                  backgroundColor: dietaryFilter === 'todays-special' ? primaryColor + '20' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'todays-special' ? primaryColor : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: primaryColor,
                }}
              >
                <Sparkles className="w-3 h-3" style={{ color: primaryColor, fill: primaryColor }} />
                <span>Today's Special</span>
              </button>
              <button
                onClick={() => setDietaryFilter('bestseller')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 shadow-2xs"
                style={{
                  backgroundColor: dietaryFilter === 'bestseller' ? secondaryColor + '20' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'bestseller' ? secondaryColor : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: isDark ? '#ffffff' : '#78350f',
                }}
              >
                <Star className="w-3 h-3" style={{ color: secondaryColor, fill: secondaryColor }} />
                <span>Bestsellers</span>
              </button>
              <button
                onClick={() => setDietaryFilter('veg')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: dietaryFilter === 'veg' ? '#04785718' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'veg' ? '#059669' : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: '#059669',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Veg Only</span>
              </button>
              <button
                onClick={() => setDietaryFilter('non-veg')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: dietaryFilter === 'non-veg' ? '#b91c1c18' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'non-veg' ? '#dc2626' : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: '#dc2626',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Non-Veg</span>
              </button>
              <button
                onClick={() => setDietaryFilter('jain')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: dietaryFilter === 'jain' ? '#d9770618' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'jain' ? '#d97706' : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: '#d97706',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Jain</span>
              </button>
              <button
                onClick={() => setDietaryFilter('no-onion-garlic')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: dietaryFilter === 'no-onion-garlic' ? '#7c3aed18' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'no-onion-garlic' ? '#7c3aed' : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: '#7c3aed',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>No Onion Garlic</span>
              </button>
              <button
                onClick={() => setDietaryFilter('vegan')}
                className="px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: dietaryFilter === 'vegan' ? '#0d948818' : (isDark ? '#111827' : '#ffffff'),
                  borderColor: dietaryFilter === 'vegan' ? '#0d9488' : (isDark ? '#1f2937' : '#e2e8f0'),
                  color: '#0d9488',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Vegan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Smart AI Suggestions Panel */}
        <div
          className="rounded-2xl p-4 shadow-xs border space-y-4 transition-colors duration-300"
          style={{
            backgroundColor: isDark ? '#111827' : primaryColor + '08',
            borderColor: primaryColor + '20',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-md shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-4 h-4 animate-pulse text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-title-custom-theme flex items-center gap-1.5">
                  AI Food Finder
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
                  >
                    Gemini
                  </span>
                </h3>
                <p className="text-[11px] text-muted-custom-theme">
                  What are you in the mood for? Let our AI match your craving with our menu.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAiExpanded(!isAiExpanded)}
              className="p-1.5 rounded-lg text-muted-custom-theme hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isAiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isAiExpanded && (
            <div className="space-y-4 pt-1 border-t border-custom-theme">
              {/* Quick Mood/Cravings Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-muted-custom-theme tracking-wider">
                  Quick Cravings & Moods:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🌶️ Spicy Cravings', query: 'something spicy and bold' },
                    { label: '🌿 Healthy & Light', query: 'light, healthy, or low-calorie' },
                    { label: '🥤 Cool Drinks', query: 'refreshing cold drinks or mocktails' },
                    { label: '🧁 Sweet Indulgence', query: 'desserts and sweet treats' },
                    { label: '🧀 Rich & Cheesy', query: 'cheesy or rich comfort food' },
                    { label: '🧒 Kids Friendly', query: 'mild, kids-friendly options' }
                  ].map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => handleTagClick(tag.query)}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 rounded-xl bg-card-custom-theme disabled:opacity-50 text-[11px] font-extrabold text-title-custom-theme hover:text-indigo-700 dark:hover:text-indigo-400 transition border border-custom-theme shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat-style prompt input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask AI: 'something spicy', 'healthy lunch', 'sweet dessert'..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aiQuery.trim() && getAiSuggestions(aiQuery)}
                  disabled={aiLoading}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 disabled:opacity-75 input-custom-theme"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <button
                  onClick={() => aiQuery.trim() && getAiSuggestions(aiQuery)}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-4 py-2 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {aiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Ask AI</span>
                </button>
              </div>

              {/* Loading State */}
              {aiLoading && (
                <div className="p-6 bg-card-custom-theme rounded-2xl border border-custom-theme flex flex-col items-center justify-center text-center space-y-3.5 animate-pulse">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center animate-spin"
                    style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-title-custom-theme">AI is searching the menu...</p>
                    <p className="text-[10px] text-muted-custom-theme mt-0.5">Finding the perfect items to match your craving.</p>
                  </div>
                </div>
              )}

              {/* AI Recommendations Output */}
              {aiResponse && !aiLoading && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* conversational bubble */}
                  <div
                    className="p-3 text-white rounded-2xl text-xs leading-relaxed shadow-xs relative"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div
                      className="absolute -top-1.5 left-4 w-3 h-3 rotate-45"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <p className="font-medium">{aiResponse.message}</p>
                  </div>

                  {/* recommended cards list */}
                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {aiResponse.suggestions.map((suggestion) => {
                        const item = menu_items.find((i) => i.id === suggestion.itemId);
                        if (!item) return null;

                        return (
                          <div
                            key={suggestion.itemId}
                            className="bg-card-custom-theme rounded-xl p-3 border hover:border-custom-theme transition shadow-2xs flex items-center justify-between gap-3"
                            style={{ borderColor: primaryColor + '18' }}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="text-[10px] font-black px-1.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
                                  {suggestion.matchPercentage}% Match
                                </span>
                                <span className="text-xs font-extrabold text-title-custom-theme line-clamp-1">
                                  {item.name}
                                </span>
                                <span className="text-[11px] font-black text-title-custom-theme">
                                  ₹{item.price.toFixed(2)}
                                </span>
                                {item.calories !== undefined && item.calories !== null && (
                                  <span className="text-[10px] text-muted-custom-theme font-medium shrink-0">
                                    ({item.calories} kcal)
                                  </span>
                                )}
                                {item.grams !== undefined && item.grams !== null && (
                                  <span className="text-[10px] text-muted-custom-theme font-medium shrink-0">
                                    ({item.grams} gms)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-custom-theme italic">
                                "{suggestion.reason}"
                              </p>
                            </div>

                            <button
                              onClick={() => scrollToDish(suggestion.itemId)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                              style={{ backgroundColor: primaryColor + '12', color: primaryColor }}
                            >
                              <span>View</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-card-custom-theme rounded-xl text-xs text-muted-custom-theme border border-custom-theme">
                      No matching dishes found in stock. Try asking for something else!
                    </div>
                  )}

                  {/* Reset Suggestions */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setAiResponse(null);
                        setAiQuery('');
                      }}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear AI suggestions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Dishes Sections */}
        {filteredItems.length === 0 ? (
          <div className="bg-card-custom-theme rounded-2xl p-10 text-center text-slate-400 border border-custom-theme">
            <Utensils className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No dishes found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayCategories.map((category) => {
              const catItems = filteredItems.filter((i) => i.category_id === category.id);
              if (catItems.length === 0) return null;

              return (
                <div key={category.id} id={`category-sec-${category.id}`} className="space-y-3 scroll-mt-24">
                  <div className="flex items-center gap-2 pb-1 border-b border-custom-theme">
                    <h2 className="text-lg font-black text-title-custom-theme">{category.name}</h2>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
                    >
                      {catItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {catItems.map((item) => {
                      return (
                        <div
                          key={item.id}
                          id={`dish-${item.id}`}
                          className={`bg-card-custom-theme rounded-2xl p-3.5 border transition-all duration-500 shadow-2xs flex gap-3.5 scroll-mt-24 ${
                            highlightedDishId === item.id ? 'scale-[1.01] shadow-md z-10' : ''
                          }`}
                          style={{
                            borderColor: highlightedDishId === item.id
                              ? primaryColor
                              : !item.is_available
                                ? (isDark ? '#1f2937' : '#e2e8f0')
                                : item.is_todays_special
                                  ? primaryColor
                                  : item.is_bestseller
                                    ? secondaryColor
                                    : (isDark ? '#1f2937' : '#f1f5f9'),
                            opacity: item.is_available ? 1 : 0.75,
                            boxShadow: highlightedDishId === item.id ? `0 0 0 4px ${primaryColor}25` : 'none',
                            backgroundImage: item.is_available && item.is_todays_special
                              ? `linear-gradient(to right, ${primaryColor}08, transparent)`
                              : item.is_available && item.is_bestseller
                                ? `linear-gradient(to right, ${secondaryColor}08, transparent)`
                                : 'none',
                          }}
                        >
                          {/* Image */}
                          <div
                            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 shrink-0 overflow-hidden group ${
                              item.image_url ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => {
                              if (item.image_url) {
                                setLightboxItemId(item.id);
                              }
                            }}
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Utensils className="w-6 h-6" />
                              </div>
                            )}

                            {item.image_url && (
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                              </div>
                            )}

                            {!item.is_available && (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-center p-1">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider bg-amber-600 px-1.5 py-0.5 rounded">
                                  Sold Out
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dish Details */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <div className="flex items-center gap-1.5">
                                  {/* Veg/Non-Veg Icon Dot */}
                                  <div
                                    className={`w-3.5 h-3.5 rounded-sm border p-0.5 flex items-center justify-center shrink-0 ${
                                      item.is_veg ? 'border-emerald-600' : 'border-red-600'
                                    }`}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        item.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                                      }`}
                                    />
                                  </div>
                                  <h3 className="text-sm font-extrabold text-title-custom-theme line-clamp-1">
                                    {item.name}
                                  </h3>
                                </div>
                                {item.is_bestseller && (
                                  <span className="text-[9px] font-black text-amber-900 bg-amber-300 px-1.5 py-0.5 rounded border border-amber-400 uppercase tracking-wide leading-none shrink-0 flex items-center gap-0.5 shadow-2xs">
                                    <Star className="w-2.5 h-2.5 fill-amber-900" />
                                    Bestseller
                                  </span>
                                )}
                                {item.is_todays_special && (
                                  <span className="text-[9px] font-black text-rose-900 bg-rose-200 px-1.5 py-0.5 rounded border border-rose-300 uppercase tracking-wide leading-none shrink-0 flex items-center gap-0.5 shadow-2xs">
                                    <Sparkles className="w-2.5 h-2.5 fill-rose-900" />
                                    Today's Special
                                  </span>
                                )}
                                {item.is_jain && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide leading-none shrink-0">
                                    Jain
                                  </span>
                                )}
                                {item.is_no_onion_garlic && (
                                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 uppercase tracking-wide leading-none shrink-0">
                                    No Onion Garlic
                                  </span>
                                )}
                                {item.is_vegan && (
                                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 uppercase tracking-wide leading-none shrink-0">
                                    Vegan
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-muted-custom-theme line-clamp-2 mt-0.5">
                                {item.description || 'Prepared fresh on order.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-custom-theme">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-extrabold text-title-custom-theme" style={{ color: primaryColor }}>
                                  ₹{item.price.toFixed(2)}
                                </span>
                                {item.calories !== undefined && item.calories !== null && (
                                  <span className="text-[10px] text-muted-custom-theme font-medium">
                                    • {item.calories} kcal
                                  </span>
                                )}
                                {item.grams !== undefined && item.grams !== null && (
                                  <span className="text-[10px] text-muted-custom-theme font-medium">
                                    • {item.grams} gms
                                  </span>
                                )}
                              </div>

                              {item.is_available ? (
                                <div className="shrink-0">
                                  {(() => {
                                    const tItem = tray.find((t) => t.id === item.id);
                                    const qty = tItem ? tItem.quantity : 0;
                                    if (qty === 0) {
                                      return (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToTray(item.id);
                                          }}
                                          className="text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-3xs transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                                          style={{ backgroundColor: primaryColor }}
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Add</span>
                                        </button>
                                      );
                                    }
                                    return (
                                      <div
                                        className="flex items-center border rounded-xl overflow-hidden shadow-4xs"
                                        style={{
                                          backgroundColor: primaryColor + '12',
                                          borderColor: primaryColor + '35',
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromTray(item.id);
                                          }}
                                          className="px-2.5 py-1 transition font-black text-xs cursor-pointer select-none"
                                          style={{ color: primaryColor }}
                                        >
                                          -
                                        </button>
                                        <span className="px-1 text-xs font-black w-4 text-center select-none" style={{ color: primaryColor }}>
                                          {qty}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToTray(item.id);
                                          }}
                                          className="px-2.5 py-1 transition font-black text-xs cursor-pointer select-none"
                                          style={{ color: primaryColor }}
                                        >
                                          +
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Public Footer */}
      <footer className="mt-12 py-6 text-center text-xs text-slate-400 space-y-2 border-t border-slate-200/60 dark:border-slate-800">
        <div className="flex justify-center">
          <NexarisLogo size="sm" showTagline={true} />
        </div>
        <p className="text-[11px] text-slate-400">
          Digital QR Menu Platform •{' '}
          <a
            href="https://nexarismenu.online"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline hover:text-indigo-600 transition"
          >
            nexarismenu.online
          </a>
        </p>
      </footer>

      {/* Floating Buttons: Menu & My Tray */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {trayCount > 0 && (
          <button
            onClick={() => setIsTrayOpen(true)}
            className="text-white transition-all duration-300 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 font-extrabold text-xs tracking-wider uppercase border cursor-pointer hover:scale-105 active:scale-95 animate-bounce-subtle"
            style={{ backgroundColor: primaryColor, borderColor: primaryColor + '40' }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Tray ({trayCount})</span>
          </button>
        )}

        <button
          onClick={() => setIsCategoriesMenuOpen(!isCategoriesMenuOpen)}
          className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 font-extrabold text-xs tracking-wider uppercase border border-slate-700/50 cursor-pointer hover:scale-105 active:scale-95"
        >
          <List className="w-4 h-4" />
          <span>Menu</span>
        </button>

        {isCategoriesMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
              onClick={() => setIsCategoriesMenuOpen(false)}
            />
            {/* Popover / Sheet */}
            <div className="absolute bottom-14 right-0 w-64 bg-card-custom-theme rounded-2xl shadow-2xl border border-custom-theme p-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-custom-theme mb-2">
                <span className="text-xs font-bold text-muted-custom-theme uppercase tracking-wider">Select Category</span>
                <button
                  onClick={() => setIsCategoriesMenuOpen(false)}
                  className="p-1 rounded-lg text-muted-custom-theme hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeCategory === 'all'
                      ? ''
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-title-custom-theme'
                  }`}
                  style={activeCategory === 'all' ? { backgroundColor: primaryColor + '18', color: primaryColor } : {}}
                >
                  <span>All Items</span>
                  <span className="text-[10px] font-semibold bg-custom-theme text-muted-custom-theme px-1.5 py-0.5 rounded-full">
                    {menu_items.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = menu_items.filter((i) => i.category_id === cat.id).length;
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? ''
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-title-custom-theme'
                      }`}
                      style={isSelected ? { backgroundColor: primaryColor + '18', color: primaryColor } : {}}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] font-semibold bg-custom-theme text-muted-custom-theme px-1.5 py-0.5 rounded-full shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sliding Tray Drawer Sheet */}
      {isTrayOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsTrayOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-card-custom-theme shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-custom-theme">
            {/* Drawer Header */}
            <div className="p-4 bg-card-custom-theme border-b border-custom-theme flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-title-custom-theme text-base">My Tray</h3>
                  <p className="text-[11px] text-muted-custom-theme font-semibold uppercase tracking-wider">{trayCount} {trayCount === 1 ? 'item' : 'items'} selected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {trayCount > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your tray?")) {
                        clearTray();
                      }
                    }}
                    className="p-1.5 rounded-xl text-muted-custom-theme hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    title="Clear Tray"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsTrayOpen(false)}
                  className="p-1.5 rounded-xl text-muted-custom-theme hover:text-title-custom-theme hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-custom-theme">
              {trayDetails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: primaryColor + '12', color: primaryColor }}
                  >
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-title-custom-theme text-sm">Your tray is empty</p>
                    <p className="text-xs text-muted-custom-theme max-w-xs leading-relaxed">
                      Browse our digital menu and add delicious dishes to your tray to curate your shortlist.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTrayOpen(false)}
                    className="mt-2 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer hover:scale-105 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Explore Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Tray Items List */}
                  <div className="space-y-2">
                    {trayDetails.map(({ item, quantity }) => {
                      return (
                        <div key={item.id} className="bg-card-custom-theme rounded-2xl p-3 border border-custom-theme shadow-3xs flex items-center gap-3">
                          {/* Small Square Image */}
                          <div className="w-14 h-14 rounded-xl bg-custom-theme overflow-hidden shrink-0 border border-custom-theme">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-custom-theme">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <div className={`w-2.5 h-2.5 rounded-xs border p-0.5 flex items-center justify-center shrink-0 ${
                                item.is_veg ? 'border-emerald-600' : 'border-red-600'
                              }`}>
                                <div className={`w-1 h-1 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                              </div>
                              <h4 className="font-extrabold text-xs text-title-custom-theme truncate">{item.name}</h4>
                            </div>
                            <p className="text-[11px] text-muted-custom-theme font-bold mt-0.5">
                              ₹{item.price.toFixed(2)} x {quantity}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.calories !== undefined && item.calories !== null && (
                                <span className="text-[9px] text-muted-custom-theme font-medium">
                                  {item.calories * quantity} kcal
                                </span>
                              )}
                              {item.grams !== undefined && item.grams !== null && (
                                <span className="text-[9px] text-muted-custom-theme font-medium">
                                  • {item.grams * quantity} gms
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Counter */}
                          <div
                            className="flex items-center border rounded-xl overflow-hidden shrink-0"
                            style={{
                              backgroundColor: primaryColor + '12',
                              borderColor: primaryColor + '35',
                            }}
                          >
                            <button
                              onClick={() => removeFromTray(item.id)}
                              className="px-2 py-1 transition font-black text-xs cursor-pointer select-none"
                              style={{ color: primaryColor }}
                            >
                              -
                            </button>
                            <span className="px-1 text-xs font-black w-5 text-center select-none" style={{ color: primaryColor }}>
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToTray(item.id)}
                              className="px-2 py-1 transition font-black text-xs cursor-pointer select-none"
                              style={{ color: primaryColor }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Instructions / Notes to Waiter */}
                  <div className="bg-card-custom-theme rounded-2xl p-3.5 border border-custom-theme space-y-1.5 shadow-3xs">
                    <label className="block text-[10px] font-black text-muted-custom-theme uppercase tracking-wider">
                      Notes / Customization
                    </label>
                    <textarea
                      value={waiterNote}
                      onChange={(e) => setWaiterNote(e.target.value)}
                      placeholder="e.g. Make it extra spicy, No onions, Less salt..."
                      className="w-full h-16 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 resize-none input-custom-theme text-title-custom-theme"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer Summary & Actions */}
            {trayDetails.length > 0 && (
              <div className="bg-white border-t border-slate-200 p-4 space-y-3 shrink-0">
                <div className="space-y-1.5">
                  {/* Energy/Volume Metrics */}
                  {(totalCalories > 0 || totalGrams > 0) && (
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                      <span>Total Metrics</span>
                      <div className="flex gap-2">
                        {totalCalories > 0 && <span>{totalCalories} kcal</span>}
                        {totalGrams > 0 && <span>• {totalGrams} gms</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Value</span>
                    <span className="text-xl font-black text-slate-900">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-right text-slate-400 font-medium italic">
                    *Excludes taxes and other charges
                  </p>
                </div>

                {/* primary action buttons */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setShowSummaryScreen(true)}
                    className="w-full text-white font-extrabold text-xs py-3 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="w-4 h-4" />
                    <span>Show Shortlist to Waiter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Show Shortlist Receipt Modal */}
      {showSummaryScreen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-card-custom-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-custom-theme animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Receipt Top */}
            <div
              className="p-5 text-white flex items-center justify-between shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">My Order Shortlist</h3>
                  <p className="text-[10px] text-white/80">Show this to the waiter to order</p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryScreen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-custom-theme">
              {/* Restaurant Name Header */}
              <div className="text-center pb-4 border-b border-dashed border-custom-theme">
                <h4 className="font-black text-title-custom-theme text-base">{restaurant.restaurant_name}</h4>
                <p className="text-[10px] text-muted-custom-theme font-semibold uppercase tracking-widest mt-0.5">Guest Order Reference</p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {trayDetails.map(({ item, quantity }) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-xs border p-0.5 flex items-center justify-center shrink-0 ${
                          item.is_veg ? 'border-emerald-600' : 'border-red-600'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                        </div>
                        <span className="font-bold text-xs text-title-custom-theme">{item.name}</span>
                        <span className="text-[10px] font-bold text-muted-custom-theme">x{quantity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-muted-custom-theme mt-0.5 pl-4 font-medium">
                        {item.calories !== undefined && item.calories !== null && (
                          <span>{item.calories * quantity} kcal</span>
                        )}
                        {item.grams !== undefined && item.grams !== null && (
                          <span>• {item.grams * quantity} gms</span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-xs text-title-custom-theme shrink-0">
                      ₹{(item.price * quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Special Instructions section */}
              {waiterNote.trim() && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                  <span className="text-[9px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Waiter Note</span>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">"{waiterNote}"</p>
                </div>
              )}

              {/* Receipt Totals */}
              <div className="pt-4 border-t border-dashed border-custom-theme space-y-1.5">
                {(totalCalories > 0 || totalGrams > 0) && (
                  <div className="flex justify-between text-[10px] text-muted-custom-theme font-semibold uppercase tracking-wider">
                    <span>Total nutritional estimates</span>
                    <div className="flex gap-2">
                      {totalCalories > 0 && <span>{totalCalories} kcal</span>}
                      {totalGrams > 0 && <span>• {totalGrams} gms</span>}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black text-title-custom-theme uppercase tracking-widest">Total Bill Estimate</span>
                  <span className="text-lg font-black" style={{ color: primaryColor }}>₹{totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-right text-muted-custom-theme font-medium italic mt-0.5">
                  *Excludes taxes and other charges
                </p>
              </div>
            </div>

            {/* Receipt Footer Actions */}
            <div className="p-4 bg-card-custom-theme border-t border-custom-theme flex items-center justify-between shrink-0">
              <span className="text-[10px] text-muted-custom-theme font-semibold leading-tight">Thank you for visiting!</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl cursor-pointer transition shadow-xs"
              >
                Print / Save Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Image Lightbox Modal */}
      {lightboxItemId && (
        <PublicMenuLightbox
          isOpen={!!lightboxItemId}
          onClose={() => setLightboxItemId(null)}
          items={filteredItems}
          initialItemId={lightboxItemId}
          restaurantName={restaurant.restaurant_name}
          tray={tray}
          onAddToTray={addToTray}
          onRemoveFromTray={removeFromTray}
        />
      )}
    </div>
  );
};
