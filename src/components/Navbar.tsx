import React from 'react';
import { ExternalLink, LogOut, User as UserIcon, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexarisLogo } from './NexarisLogo';

interface NavbarProps {
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onOpenDbModal?: () => void;
  onNavigatePublic?: (slug: string) => void;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal, onOpenDbModal, onNavigatePublic, currentView }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <NexarisLogo
          size="md"
          showTagline={false}
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('popstate'));
          }}
        />

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <>
              {/* Public Menu Quick Link */}
              <button
                onClick={() => {
                  if (onNavigatePublic) {
                    onNavigatePublic(user.slug);
                  } else {
                    window.history.pushState({}, '', `/menu/${user.slug}`);
                    window.dispatchEvent(new Event('popstate'));
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer"
                title="View how your menu looks to customers"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden xs:inline">Live Menu</span>
              </button>

              {/* Restaurant Info Badge */}
              <div className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <Store className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="max-w-[140px] truncate">{user.restaurant_name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 transition cursor-pointer"
                title="Log out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal?.('login')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuthModal?.('register')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

