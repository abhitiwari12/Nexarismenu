import React from 'react';
import { QrCode, Sparkles, Smartphone, UtensilsCrossed, Zap, ShieldCheck, ArrowRight, ExternalLink, Sliders, Palette } from 'lucide-react';
import { NexarisLogo } from './NexarisLogo';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenAuth: (tab: 'login' | 'register') => void;
  onViewDemoMenu: (slug?: string) => void;
}

const DEMO_SHOWCASE = [
  {
    name: 'The Velvet Bean',
    slug: 'velvet-bean',
    cuisine: 'Artisanal Cafe & Bakery',
    location: 'Park Street, NY',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    tag: 'Chic Cafe',
    popularItem: 'AeroPress Single Origin & Pistachio Croissant',
  },
  {
    name: 'The Grand Pavilion',
    slug: 'grand-pavilion',
    cuisine: 'Royal Mughlai & Indian',
    location: 'Connaught Place, New Delhi',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    tag: 'Heritage Hotel Dining',
    popularItem: 'Royal Awadhi Biryani & Murgh Khurchan',
  },
  {
    name: 'L\'Ambroisie',
    slug: 'lambroisie',
    cuisine: 'Contemporary Fine Dining',
    location: 'Fifth Avenue, NY',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    tag: 'Premium Fine Dine',
    popularItem: 'Atlantic Sea Scallops & Grand Chocolate Soufflé',
  },
  {
    name: 'Dakshin Bhavan',
    slug: 'dakshin-bhavan',
    cuisine: 'South Indian Vegetarian Heritage',
    location: 'Mylapore, Chennai',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
    tag: 'Traditional Southern',
    popularItem: 'Ghee Podi Masala Dosa & Royal Thali',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onViewDemoMenu,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="mb-6">
            <NexarisLogo size="xl" showTagline={true} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Digital QR Menu Platform for Modern Restaurants</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Create Your Restaurant QR Menu in <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400 bg-clip-text text-transparent">3 Minutes</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate reprinting costs. Update prices, mark items out of stock instantly, and deliver a smooth touchless digital dining experience to every customer.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-100 transition flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('demo-showcase');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onViewDemoMenu('velvet-bean');
                }
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base border border-slate-200 dark:border-slate-800 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <span>Explore Live Demo Menus</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Demo Restaurants Grid */}
      <section id="demo-showcase" className="py-12 bg-slate-100/80 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/80 scroll-mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-extrabold uppercase tracking-wider mb-2">
              Interactive Live Demos
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Explore Live Demo Menus
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Experience our latest features! Click on any demo restaurant below to search items dynamically using our **AI Food Finder**.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_SHOWCASE.map((demo) => (
              <div
                key={demo.slug}
                onClick={() => onViewDemoMenu(demo.slug)}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col group"
              >
                <div className="relative h-44 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={demo.image}
                    alt={demo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>{demo.tag}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">
                      {demo.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {demo.cuisine} • {demo.location}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Popular:</span> {demo.popularItem}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-lg w-fit">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Food Finder Enabled</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      View Digital Menu
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Advanced Digital Menu Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything Your Restaurant Needs
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Powerful tools built specifically for modern cafes, fine dining establishments, bistros, bars, and dark kitchens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Instant QR Code Generation */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant QR Generation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically generate high-resolution PNG QR codes bound to your custom domain slug. Download, customize, and print for tables.
              </p>
            </div>

            {/* 2. Real-Time Stock Control */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Availability Toggles</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Ran out of a popular ingredient? Instantly mark dishes as "Out of Stock" with one simple click to prevent customer disappointment.
              </p>
            </div>

            {/* 3. Mobile First Design */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mobile-First Interface</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                No slow apps, complex signups, or heavy PDFs. A beautiful, native-feeling dynamic browser layout that opens in sub-seconds.
              </p>
            </div>

            {/* 4. Complete Menu Control */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-amber-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Culinary Micro-Details</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Add precise descriptions, exact dish weights (grams), energy counts (calories), dietary tags (Veg, Vegan, Jain), and bestseller badges.
              </p>
            </div>

            {/* 5. Complete Brand Tailoring */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-rose-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Brand & Visual Tailoring</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Make your digital menu match your ambiance. Customize primary/secondary accent colors, elegant fonts, logo icons, and cover art.
              </p>
            </div>

            {/* 6. Cloud Scale Infrastructure */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-violet-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure Hybrid Database</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Backed by real-time dual sync: high-performance SQL databases and instant local replication. 100% uptime, zero offline lag.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
              Simple & Transparent Pricing
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Flat Rate Annual Pass
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              No hidden fees. One simple annual rate for unlimited digital menus.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-blue-600 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl tracking-wider">
              Popular Choice
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Annual Pro Membership</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900 dark:text-white">₹299</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">/ year</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Includes complete digital menu suite for 365 days</p>

              <div className="border-t border-slate-100 dark:border-slate-800 my-4 pt-4 space-y-3">
                {[
                  'Unlimited Menu Items & Categories',
                  'High-Res PNG QR Code Generator',
                  'Direct Google Drive Image Picker',
                  'Real-time Menu & Out-of-Stock Toggles',
                  'Custom Logo & Cover Banner Branding',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-4"
              >
                <span>Get Started at ₹299/yr</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Footer */}
      <Footer />
    </div>
  );
};
