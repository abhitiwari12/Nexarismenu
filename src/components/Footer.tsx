import React from 'react';
import { NexarisLogo } from './NexarisLogo';

export const Footer: React.FC = () => {
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NexarisLogo 
            size="sm" 
            showTagline={false} 
            onClick={() => navigateTo('/')} 
            className="cursor-pointer hover:opacity-90 transition"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            One partner. Endless possibilities.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <p className="text-slate-500">© {new Date().getFullYear()} Nexaris. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
            <a 
              href="https://nexarismenu.online" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:underline hover:text-blue-300 transition"
            >
              nexarismenu.online
            </a>
            <button 
              onClick={() => navigateTo('/privacy')}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigateTo('/terms')}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button 
              onClick={() => navigateTo('/contact')}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
