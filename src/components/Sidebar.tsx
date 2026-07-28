import React from 'react';
import { QrCode, UtensilsCrossed, FolderTree, Settings, Eye, ExternalLink, CreditCard } from 'lucide-react';

export type AdminTab = 'overview' | 'items' | 'categories' | 'settings' | 'billing';

interface SidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onViewPublic: () => void;
  itemsCount: number;
  categoriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onViewPublic,
  itemsCount,
  categoriesCount,
}) => {
  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'QR Code & Overview',
      icon: QrCode,
      badge: null,
    },
    {
      id: 'items' as AdminTab,
      label: 'Menu Items',
      icon: UtensilsCrossed,
      badge: itemsCount > 0 ? itemsCount : null,
    },
    {
      id: 'categories' as AdminTab,
      label: 'Categories',
      icon: FolderTree,
      badge: categoriesCount > 0 ? categoriesCount : null,
    },
    {
      id: 'settings' as AdminTab,
      label: 'Restaurant Profile',
      icon: Settings,
      badge: null,
    },
    {
      id: 'billing' as AdminTab,
      label: 'Subscription Plan',
      icon: CreditCard,
      badge: '₹299/yr',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 p-4 shrink-0 transition-colors">
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <div className="hidden md:block px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Menu Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-sky-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isActive
                      ? 'bg-blue-200/60 dark:bg-blue-950/80 text-blue-800 dark:text-sky-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="hidden md:block my-4 border-t border-slate-100 dark:border-slate-800" />

        <button
          onClick={onViewPublic}
          className="hidden md:flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="flex-1 text-left">Preview Public Menu</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
        </button>
      </div>
    </aside>
  );
};
