import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, ExternalLink, QrCode as QrIcon, UtensilsCrossed, FolderTree, Sparkles, CheckCircle2, ShieldCheck, Zap, Printer, ArrowLeft, SlidersHorizontal, List, LayoutGrid, FileText, Lock, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MenuItem, Category } from '../types';

interface DashboardOverviewProps {
  items: MenuItem[];
  categories: Category[];
  onNavigateTab: (tab: 'items' | 'categories' | 'settings' | 'billing') => void;
  onViewPublic: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  items,
  categories,
  onNavigateTab,
  onViewPublic,
}) => {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Print View Customization State
  const [showPrintView, setShowPrintView] = useState(false);
  const [printColumns, setPrintColumns] = useState<'1' | '2'>('2');
  const [printShowDescriptions, setPrintShowDescriptions] = useState(true);
  const [printShowPrices, setPrintShowPrices] = useState(true);
  const [printShowDietaryTags, setPrintShowDietaryTags] = useState(true);
  const [printShowQr, setPrintShowQr] = useState(true);

  if (!user) return null;

  if (showPrintView) {
    return (
      <div className="bg-slate-100 text-slate-900 font-sans p-4 sm:p-6 rounded-2xl border border-slate-200 min-h-[800px] animate-in fade-in duration-200">
        {/* Print Styles injected for window.print() */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-menu-sheet, #printable-menu-sheet * {
              visibility: visible !important;
            }
            #printable-menu-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
            }
            .print-hidden {
              display: none !important;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}</style>

        {/* Top Controls Bar - Hidden when printing */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg mb-6 print-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPrintView(false)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer flex items-center gap-2 text-xs font-bold shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h2 className="text-base font-black flex items-center gap-2">
                  <span>Paper Menu & PDF Generator</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full">
                    Printer Friendly
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Clean, ink-saving format optimized for paper table menus & PDF export.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>

          {/* Configuration Toolbar - Hidden when printing */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Layout & Options:</span>
              </span>

              {/* Column Layout */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setPrintColumns('1')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                    printColumns === '1' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>1 Column</span>
                </button>
                <button
                  onClick={() => setPrintColumns('2')}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                    printColumns === '2' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>2 Columns</span>
                </button>
              </div>

              {/* Toggles */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printShowDescriptions}
                  onChange={(e) => setPrintShowDescriptions(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
                <span>Descriptions</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printShowPrices}
                  onChange={(e) => setPrintShowPrices(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
                <span>Prices</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printShowDietaryTags}
                  onChange={(e) => setPrintShowDietaryTags(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
                <span>Dietary Badges</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={printShowQr}
                  onChange={(e) => setPrintShowQr(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
                <span>Order Link / QR Footer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable Menu Sheet */}
        <div className="max-w-4xl mx-auto">
          <div
            id="printable-menu-sheet"
            className="bg-white text-black p-8 sm:p-12 shadow-xl rounded-2xl border border-slate-200"
          >
            {/* Restaurant Header */}
            <div className="text-center pb-6 border-b-2 border-black">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                {user.restaurant_name}
              </h1>
              {user.address && (
                <p className="text-sm text-gray-700 mt-1 font-medium">
                  {user.address}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mt-1 font-mono">
                {user.phone && <span>Tel: {user.phone}</span>}
                {user.phone && <span>•</span>}
                <span>Dine-in & Takeaway Menu</span>
              </div>
            </div>

            {/* Menu Categories & Items */}
            <div className="mt-6 space-y-8">
              {categories.map((category) => {
                const categoryItems = items.filter((item) => item.category_id === category.id && item.is_available);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="break-inside-avoid">
                    <h2 className="text-xl font-bold text-black uppercase tracking-wider border-b border-black pb-1 mb-4">
                      {category.name}
                    </h2>

                    <div
                      className={
                        printColumns === '2'
                          ? 'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'
                          : 'space-y-4'
                      }
                    >
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-baseline gap-4 pb-2 border-b border-gray-100 print:border-gray-200 break-inside-avoid"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 font-bold text-base text-black">
                              {printShowDietaryTags && (
                                <span
                                  className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-black ${
                                    item.is_veg ? 'bg-emerald-600 print:bg-black' : 'bg-red-600 print:bg-black'
                                  }`}
                                  title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                                />
                              )}
                              <span>{item.name}</span>
                            </div>
                            {printShowDescriptions && item.description && (
                              <p className="text-xs text-gray-600 print:text-gray-800 mt-0.5 leading-relaxed font-normal">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {printShowPrices && (
                            <div className="font-bold font-mono text-base text-black shrink-0">
                              ₹{item.price}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer / QR Link */}
            {printShowQr && (
              <div className="mt-12 pt-6 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600 print:text-black break-inside-avoid">
                <div>
                  <p className="font-bold uppercase tracking-wider text-black">
                    Interactive Digital Menu & Live Ordering
                  </p>
                  <p className="mt-0.5 font-mono text-xs">
                    {window.location.origin}/menu/{user.slug}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Scan or visit link to view dish photos, allergen filters & place table orders.
                  </p>
                </div>

                <div className="p-2 border border-black rounded flex items-center gap-2.5 bg-white shrink-0">
                  <div className="w-12 h-12 bg-gray-100 print:bg-white border border-black flex flex-col items-center justify-center text-center overflow-hidden">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-10 h-10 object-contain" />
                    ) : (
                      <QrIcon className="w-7 h-7 text-black" />
                    )}
                    <span className="text-[6px] font-mono font-bold uppercase mt-0.5">MENU QR</span>
                  </div>
                  <div className="text-[10px] leading-tight font-bold text-black uppercase tracking-tight">
                    Scan for<br />
                    Photo Menu &<br />
                    Direct Order
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Construct full public URL for customer menu
  const publicUrl = `${window.location.origin}/menu/${user.slug}`;
  const qrTargetUrl = `${window.location.origin}/menu/${user.slug}?qr=1`;

  useEffect(() => {
    fetchQrCode();
  }, [user.slug]);

  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const res = await fetch(`/api/qr?url=${encodeURIComponent(qrTargetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.qr_data_url);
      }
    } catch (e) {
      console.error('Failed to fetch QR code:', e);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${user.slug}-menu-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const availableCount = items.filter(i => i.is_available).length;
  const outOfStockCount = items.length - availableCount;

  // Subscription and Trial Calculations
  const now = new Date();
  const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
  const daysRemaining = expiresAt 
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrial = user.subscription_status === 'trial';
  const isExpired = user.subscription_status === 'expired' || (expiresAt && expiresAt < now);

  let bannerType: 'trial_active' | 'trial_expired' | 'ending_soon' | 'expired' | null = null;

  if (isTrial) {
    if (isExpired) {
      bannerType = 'trial_expired';
    } else {
      bannerType = 'trial_active';
    }
  } else {
    if (isExpired) {
      bannerType = 'expired';
    } else if (daysRemaining <= 14) {
      bannerType = 'ending_soon';
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Restaurant Digital Menu Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {user.owner_name}!
          </h1>
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
            Your QR menu for <strong className="text-white font-semibold">{user.restaurant_name}</strong> is live and ready for customers.
          </p>
        </div>
      </div>

      {/* Subscription & Free Trial Banners */}
      {bannerType === 'trial_expired' && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-200 text-sm">Free Trial Ended</h3>
              <p className="text-xs text-red-700 dark:text-red-400/80 mt-1 leading-relaxed">
                Your 14-day free trial has expired, and your public digital menu has been temporarily taken offline. Subscribe to our annual plan to bring it back online instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center animate-bounce-subtle"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Activate Annual Pro (₹299)</span>
          </button>
        </div>
      )}

      {bannerType === 'trial_active' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Free Trial Active</h3>
              <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-1 leading-relaxed">
                You are currently on a 14-day free trial. There are <strong className="font-bold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</strong> before your trial expires and your public menu is disabled. Upgrade anytime to prevent any disruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Upgrade to Pro (₹299)</span>
          </button>
        </div>
      )}

      {bannerType === 'ending_soon' && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce-subtle" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">Subscription Ending Soon</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
                Your annual Pro subscription is ending in <strong className="font-bold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong>. Renew now to guarantee your public digital QR menu remains online without any interruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Renew Annual Pro (₹299)</span>
          </button>
        </div>
      )}

      {bannerType === 'expired' && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">Subscription Expired</h3>
              <p className="text-xs text-rose-700 dark:text-rose-400/80 mt-1 leading-relaxed">
                Your annual Pro subscription has expired, and your public digital menu has been taken offline. Renew your subscription now to immediately restore customer access.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center animate-bounce-subtle"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Renew Annual Pro (₹299)</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Total Menu Items</span>
            <UtensilsCrossed className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{items.length}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Active across categories</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Categories</span>
            <FolderTree className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Organized sections</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Available Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{availableCount}</div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Ready to order</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Out of Stock</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{outOfStockCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Temporarily unavailable</span>
        </div>
      </div>

      {/* QR Code & Link Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8 items-center transition-colors">
        {/* QR Visual */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
          <div className="relative p-4 bg-white rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center">
            {loadingQr ? (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <QrIcon className="w-12 h-12 animate-pulse" />
              </div>
            ) : (
              <img
                src={qrDataUrl || undefined}
                alt="Restaurant QR Code"
                className="w-56 h-56 object-contain"
              />
            )}
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Scannable QR Code
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Points directly to your digital menu</p>
          </div>
        </div>

        {/* QR Actions & Public Link */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <QrIcon className="w-5 h-5 text-blue-600 dark:text-sky-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Menu QR Code</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Print this QR code on table tent cards, stickers, or display boards so customers can scan and view your menu instantly on their mobile phones.
            </p>
          </div>

          {/* URL Box */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider">
                  Primary Customer URL (nexarismenu.online)
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  LIVE DEPLOYED
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://nexarismenu.online/menu/${user.slug}`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-none select-all"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://nexarismenu.online/menu/${user.slug}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition shadow-xs shrink-0 ${
                      copied
                        ? 'bg-emerald-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleDownloadPng}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG QR</span>
            </button>

            <button
              onClick={() => setShowPrintView(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Menu</span>
            </button>

            <button
              onClick={onViewPublic}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>Preview Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Menu Generator Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Physical Paper Menu & PDF Generator</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Create clean, professional 1-column or 2-column printable paper menus with your restaurant name, prices, dietary tags, and an embedded QR code for table ordering.
          </p>
        </div>
        <button
          onClick={() => setShowPrintView(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Open Menu Generator</span>
        </button>
      </div>

      {/* Quick Setup Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>Quick Setup Workflow</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTab('categories')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs mb-3 group-hover:scale-110 transition">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
              Organize Categories
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add section names like Pizzas, Appetizers, Drinks & Desserts.
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('items')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs mb-3 group-hover:scale-110 transition">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
              Add Delicious Dishes
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload photos, set prices, Veg / Non-Veg badges, and descriptions.
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('settings')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs mb-3 group-hover:scale-110 transition">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
              Custom Branding
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your logo, banner cover photo, phone number, and address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
